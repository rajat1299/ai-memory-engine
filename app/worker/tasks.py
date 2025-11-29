"""
Background Worker Tasks with Instructor for Structured LLM Responses
Phase 4: Enhanced Memory Extraction with Deduplication
"""
import asyncio
import logging
from arq import cron, Retry
from arq.connections import RedisSettings
from openai import APIError, RateLimitError, APIConnectionError, APITimeoutError
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from typing import Any
from pydantic import BaseModel, Field, model_validator
from rapidfuzz import fuzz

from app.config import settings
from app.models import ChatLog, MemoryFact, FactCategory, TemporalState, Session
from app.llm import get_llm_provider
from datetime import datetime, timezone, timedelta

# Setup Logger
logger = logging.getLogger(__name__)

# Shared DB engine/session for worker tasks to avoid per-job creation overhead
worker_engine = create_async_engine(str(settings.DATABASE_URL), future=True)
worker_sessionmaker = async_sessionmaker(worker_engine, class_=AsyncSession, expire_on_commit=False)

# Minimum confidence required to persist a new fact
MIN_CONFIDENCE_TO_SAVE = 0.5


# Pydantic models for structured extraction
class ExtractedFact(BaseModel):
    """Single extracted fact with strict validation"""
    category: FactCategory = Field(
        description="Category of the fact: user_preference, biographical, work_context, relationship, or learning"
    )
    slot_hint: str | None = Field(
        default=None,
        description="Slot hint for supersession (e.g., employer, role, location, partner)."
    )
    temporal_state: TemporalState = Field(
        default=TemporalState.CURRENT,
        description="Whether this fact is current, past, future, or recurring."
    )
    content: str = Field(
        min_length=5,
        description="The actual fact, concise and specific (minimum 5 characters)"
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence score between 0 and 1"
    )

    @model_validator(mode="after")
    def validate_fact_quality(self) -> "ExtractedFact":
        """
        Guardrails to filter out low-signal extractions before saving.
        """
        tokens = self.content.split()
        if len(tokens) < 2:
            raise ValueError(f"Fact too short: '{self.content}'")
        if self.content.strip().endswith("?"):
            raise ValueError(f"Fact cannot be a question: '{self.content}'")
        return self


class FactExtractionResponse(BaseModel):
    """Collection of extracted facts"""
    facts: list[ExtractedFact] = Field(
        default_factory=list,
        description="List of extracted memory facts"
    )


def _is_fuzzy_duplicate(existing_texts: list[str], candidate: str, threshold: int = 75) -> bool:
    """
    Check whether a candidate fact is a fuzzy duplicate of anything we've already stored.
    Uses WRatio which combines multiple strategies and handles abbreviations well
    (e.g., 'Lives in SF' vs 'Resides in San Francisco').
    """
    for existing in existing_texts:
        if fuzz.WRatio(existing, candidate) >= threshold:
            return True
    return False


def normalize_fact(content: str, category: FactCategory) -> str:
    """
    Normalize fact phrasing to keep storage consistent.
    
    Skips normalization if the content already has temporal context markers
    like "Previously", "Used to", "Planning to", etc.
    """
    text = content.strip()
    lower = text.lower()
    
    # Skip normalization if content already has temporal/contextual prefixes
    temporal_prefixes = (
        "previously", "used to", "formerly", "was a", "were a",
        "planning to", "will", "going to", "might", "may",
        "usually", "often", "sometimes", "every", "regularly"
    )
    if any(lower.startswith(prefix) for prefix in temporal_prefixes):
        return text

    if category == FactCategory.BIOGRAPHICAL:
        # Already properly prefixed
        if lower.startswith(("lives in", "born in", "from", "age", "lived in")):
            return text
        # Needs prefix
        if lower.startswith(("in ", "at ")):
            text = f"Lives {text}"
        elif " in " in lower:
            # Don't double-prefix
            pass
        else:
            text = f"Lives in {text}"
    elif category == FactCategory.WORK_CONTEXT:
        # Already properly prefixed
        if lower.startswith(("works", "is a", "is an", "employed", "worked")):
            return text
        # Needs prefix
        if text and text[0].isupper():
            text = f"Works at {text}"
        else:
            text = f"Is a {text}"

    return text


def _same_slot(fact: MemoryFact, new_category: FactCategory, new_slot: str | None) -> bool:
    """
    Define "slot" membership for supersedable facts.
    
    Rules:
    - Categories must match
    - If the new fact has no slot, supersede all within the category
    - If the existing fact has no slot, treat it as same slot (legacy data)
    - Otherwise, match on slot name
    """
    return (
        fact.category == new_category
        and (
            fact.slot_hint is None
            or new_slot is None
            or fact.slot_hint == new_slot
        )
    )


def _supersedable_category(category: FactCategory) -> bool:
    """
    Categories that should typically have one active value (e.g., location).
    """
    return category in {
        FactCategory.BIOGRAPHICAL,   # location/home base
        FactCategory.RELATIONSHIP,   # partner/relationship status
        FactCategory.WORK_CONTEXT,    # supersede by slot_hint (employer, project, role)
    }


def _should_supersede(existing: MemoryFact, incoming_conf: float) -> bool:
    """
    Decide whether to supersede an existing fact with a new one in the same slot.
    Favor more recent facts; allow a newer fact to supersede if it's not much lower confidence.
    """
    # If existing is superseded already, we can supersede it again safely
    if existing.superseded_by is not None:
        return True
    # Allow supersession if confidence is within a reasonable band
    return incoming_conf >= (existing.confidence_score - 0.15)


async def extract_facts_task(ctx: dict[str, Any], session_id: str) -> dict:
    """
    THE SMART PART: Enhanced memory extraction with deduplication.
    
    Steps:
    1. Retrieve last 5 messages from session
    2. Call OpenAI with instructor for structured response
    3. Parse into FactCategory enum (automatic with Pydantic)
    4. Deduplicate against existing facts
    5. Save new facts to database
    """
    logger.info(f"Starting fact extraction for session {session_id}")
    
    async with worker_sessionmaker() as db:
        try:
            # 1. Fetch last 5 messages
            stmt = select(ChatLog).where(
                ChatLog.session_id == session_id
            ).order_by(ChatLog.timestamp.desc()).limit(5)
            
            result = await db.execute(stmt)
            messages = list(reversed(result.scalars().all()))
            
            if not messages:
                logger.warning(f"No messages found for session {session_id}")
                return {"status": "no_messages", "facts_extracted": 0}
            
            # Get user_id and session
            stmt_session = select(Session).where(Session.id == session_id)
            session_result = await db.execute(stmt_session)
            session_obj = session_result.scalar_one()
            user_id = session_obj.user_id
            
            # 2. Build conversation context
            conversation = "\n".join([
                f"{msg.role}: {msg.content}" for msg in messages
            ])
            
            logger.info(f"Analyzing {len(messages)} messages for user {user_id}")
            
            # 3. Extract facts using LLM provider
            llm_provider = get_llm_provider()
            extraction_result = await llm_provider.chat_structured(
                messages=[
                    {
                        "role": "system",
                        "content": """You are a memory extraction assistant. Extract persistent facts about the user from conversations.

CRITICAL RULES:
1. Each fact MUST be atomic - ONE piece of information per fact.
2. NEVER combine multiple pieces into one fact (e.g., "Works at Google as engineer" is WRONG - split into two facts).
3. Each slot_hint MUST be a single value, not combined (e.g., "employer" not "employer|role").
4. Detect temporal state: is this fact current, past, future, or recurring?
5. Ignore casual chat, greetings, or temporary states.
6. Assign confidence scores: 0.7-1.0 for explicit facts, 0.4-0.6 for inferred.

CATEGORIES:
- user_preference: Likes, dislikes, preferences (e.g., "Prefers dark mode")
- biographical: Personal info, location (e.g., "Lives in Dallas")
- work_context: Job, employer, role, projects (e.g., "Works at OpenAI")
- relationship: People, relationships (e.g., "Partner is Sara")
- learning: Studies, learning goals (e.g., "Learning AI")

TEMPORAL STATES:
- current: True NOW (default) - "I live in Austin", "I work at Google"
- past: Was true, not anymore - "I used to live in NYC", "Previously worked at Meta"
- future: Planned, not yet true - "I'm going to move to Seattle", "Planning to learn Python"
- recurring: Happens periodically - "I go hiking every weekend", "Usually drinks coffee"

SLOT_HINT (pick ONE per fact):
- work_context: employer | role | project | skill | team
- biographical: location | birthplace | education | age
- relationship: partner | friend | family | manager | colleague
- learning: topic | course | goal
- user_preference: food | tech | hobby | lifestyle

EXAMPLE - "I work at Google as a senior engineer":
WRONG: [{"category": "work_context", "slot_hint": "employer|role", "content": "Works at Google as senior engineer", ...}]
CORRECT: [
  {"category": "work_context", "slot_hint": "employer", "temporal_state": "current", "content": "Works at Google", ...},
  {"category": "work_context", "slot_hint": "role", "temporal_state": "current", "content": "Is a senior engineer", ...}
]

Return JSON ONLY:
{
  "facts": [
    {"category": "<category>", "slot_hint": "<single_slot>", "temporal_state": "current|past|future|recurring", "content": "<fact>", "confidence": <0.0-1.0>},
    ...
  ]
}"""

                    },
                    {
                        "role": "user",
                        "content": f"Extract facts from this conversation:\n\n{conversation}"
                    }
                ],
                response_model=FactExtractionResponse,
            )
            
            extracted_facts = extraction_result.facts
            logger.info(f"Extracted {len(extracted_facts)} potential facts")
            
            # 4. Deduplicate against existing facts
            stmt_existing = select(MemoryFact).where(
                MemoryFact.user_id == user_id,
                MemoryFact.expires_at.is_(None)
            )
            existing_result = await db.execute(stmt_existing)
            existing_facts = existing_result.scalars().all()
            
            # Build list of existing contents for fuzzy matching
            existing_contents = [fact.content for fact in existing_facts]
            
            # Filter out duplicates and save new facts (with embeddings)
            pending_facts: list[MemoryFact] = []
            supersede_queue: list[MemoryFact] = []
            for extracted in extracted_facts:
                if extracted.confidence < MIN_CONFIDENCE_TO_SAVE:
                    logger.debug(
                        f"Skipping low-confidence fact: '{extracted.content}' ({extracted.confidence:.2f})"
                    )
                    continue
                extracted.content = normalize_fact(extracted.content, extracted.category)

                duplicate_match = None
                for fact in existing_facts:
                    if _is_fuzzy_duplicate([fact.content], extracted.content):
                        duplicate_match = fact
                        break
                if duplicate_match:
                    # Refresh existing fact instead of creating a new one
                    duplicate_match.last_refreshed_at = datetime.now(timezone.utc)
                    duplicate_match.confidence_score = max(duplicate_match.confidence_score, extracted.confidence)
                    db.add(duplicate_match)
                    logger.debug(f"Refreshed existing fact: {duplicate_match.id}")
                    continue
                
                new_fact = MemoryFact(
                    user_id=user_id,
                    category=extracted.category,
                    content=extracted.content,
                    confidence_score=extracted.confidence,
                    slot_hint=extracted.slot_hint,
                    temporal_state=extracted.temporal_state.value,
                    source_message_id=messages[-1].id
                )
                pending_facts.append(new_fact)
                existing_contents.append(extracted.content)
                logger.info(f"New fact: [{extracted.category.value}] {extracted.content}")

                # Supersede older facts in the same slot when applicable
                if _supersedable_category(extracted.category):
                    supersede_queue.extend(
                        [
                            fact
                            for fact in existing_facts
                            if _same_slot(fact, extracted.category, extracted.slot_hint)
                        ]
                    )

            facts_saved = 0
            if pending_facts:
                try:
                    llm_provider = get_llm_provider()
                    embeddings = await llm_provider.embed_texts([fact.content for fact in pending_facts])
                except Exception as exc:  # keep saving facts even if embeddings fail
                    logger.error(f"Embedding generation failed: {exc}", exc_info=True)
                    embeddings = [None] * len(pending_facts)

                for fact, embedding in zip(pending_facts, embeddings):
                    fact.embedding = embedding
                    db.add(fact)
                    facts_saved += 1
                
                # Flush to obtain IDs for supersession updates
                await db.flush()
                for fact in supersede_queue:
                    newest = next(
                        (f for f in pending_facts if _same_slot(fact, f.category, f.slot_hint)),
                        None
                    )
                    if newest and _should_supersede(fact, newest.confidence_score):
                        fact.superseded_by = newest.id
                        db.add(fact)
            
            await db.commit()
            
            logger.info(f"Saved {facts_saved} new facts for session {session_id}")
            
            return {
                "status": "success",
                "facts_extracted": len(extracted_facts),
                "facts_saved": facts_saved,
                "session_id": session_id
            }
            
        except (RateLimitError, APIError, APIConnectionError, APITimeoutError) as e:
            logger.warning(f"Transient error extracting facts for session {session_id}: {e}")
            raise Retry(defer=30) from e
        except Exception as e:
            logger.error(f"Error extracting facts: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "session_id": session_id
            }


# ============================================================================
# Memory Optimization (Conscious Agent)
# ============================================================================

OPTIMIZATION_MAX_FACTS = 200


class OptimizationResponse(BaseModel):
    """Response from LLM identifying essential facts"""
    essential_fact_ids: list[int] = Field(
        description="List of IDs for facts that are essential/core to the user's identity"
    )


async def optimize_user_memory(ctx: dict[str, Any], user_id: str) -> dict:
    """
    Analyze user's memories and mark essential ones.
    This mimics the "Conscious Agent" promoting memories to short-term context.
    """
    logger.info(f"Starting memory optimization for user {user_id}")
    
    async with worker_sessionmaker() as db:
        try:
            # 1. Fetch all non-essential facts
            # Note: Limit the batch size to control token/cost footprint
            stmt = (
                select(MemoryFact)
                .where(
                    MemoryFact.user_id == user_id,
                    MemoryFact.is_essential == False,
                    MemoryFact.superseded_by.is_(None),
                    MemoryFact.expires_at.is_(None),
                )
                .order_by(
                    MemoryFact.confidence_score.desc(),
                    MemoryFact.created_at.desc()
                )
                .limit(OPTIMIZATION_MAX_FACTS)
            )
            result = await db.execute(stmt)
            facts = result.scalars().all()
            
            if not facts:
                return {"status": "no_facts_to_optimize", "user_id": user_id}
            
            # 2. Prepare facts for LLM
            # We send ID and content. We use the integer index in the list as a proxy ID for the LLM
            # because UUIDs can be long and error-prone in lists.
            facts_list = [
                f"[{i}] ({fact.category.value}) {fact.content}"
                for i, fact in enumerate(facts)
            ]
            facts_text = "\n".join(facts_list)
            
            # 3. Call LLM to identify essential facts
            llm_provider = get_llm_provider()
            response = await llm_provider.chat_structured(
                messages=[
                    {
                        "role": "system",
                        "content": """You are a Conscious Memory Agent. Your goal is to identify "Essential Memories" that should be always available to the AI.

Essential Memories are:
1. Core User Identity (Name, Role, Location)
2. Permanent Preferences (Coding style, Dietary restrictions)
3. Long-term Goals or Projects
4. Important Relationships

Ignore:
- Temporary context
- One-off facts
- Low confidence items

Return the list of INDICES (the number in brackets) for facts that are essential."""
                    },
                    {
                        "role": "user",
                        "content": f"Analyze these facts and return indices of essential ones:\n\n{facts_text}"
                    }
                ],
                response_model=OptimizationResponse,
            )
            
            # 4. Update Database
            promoted_count = 0
            for index in response.essential_fact_ids:
                if 0 <= index < len(facts):
                    fact = facts[index]
                    fact.is_essential = True
                    db.add(fact)
                    promoted_count += 1
            
            await db.commit()
            logger.info(f"Promoted {promoted_count} facts to essential for user {user_id}")
            
            return {
                "status": "success",
                "promoted": promoted_count,
                "total_analyzed": len(facts),
                "user_id": user_id
            }
            
        except (RateLimitError, APIError, APIConnectionError, APITimeoutError) as e:
            logger.warning(f"Transient error optimizing memory for user {user_id}: {e}")
            raise Retry(defer=30) from e
        except Exception as e:
            logger.error(f"Error optimizing memory: {str(e)}", exc_info=True)
            return {"status": "error", "error": str(e)}


async def scheduled_optimization(ctx: dict[str, Any]):
    """
    Cron task: Find all users and enqueue optimization for them.
    """
    logger.info("Running scheduled memory optimization")
    async with worker_sessionmaker() as db:
        # Get all distinct user_ids from facts table
        # (In a real app, query the Users table)
        stmt = select(MemoryFact.user_id).distinct()
        result = await db.execute(stmt)
        user_ids = result.scalars().all()
        
        for user_id in user_ids:
            await ctx["redis"].enqueue_job("optimize_user_memory", str(user_id))


async def decay_stale_facts(ctx: dict[str, Any]):
    """
    Periodic decay of stale facts to reduce confidence over time.
    """
    logger.info("Running decay job for stale facts")
    cutoff_days = 30
    decay_factor = 0.9
    async with worker_sessionmaker() as db:
        now = datetime.now(timezone.utc)
        stmt = select(MemoryFact).where(
            MemoryFact.superseded_by.is_(None),
            MemoryFact.expires_at.is_(None),
            MemoryFact.last_refreshed_at < now - timedelta(days=cutoff_days),
        )
        result = await db.execute(stmt)
        stale_facts = result.scalars().all()
        for fact in stale_facts:
            fact.confidence_score = max(0.1, fact.confidence_score * decay_factor)
            db.add(fact)
        if stale_facts:
            await db.commit()
            logger.info(f"Decayed {len(stale_facts)} stale facts")


# ============================================================================
# Multi-Session Memory Consolidation
# ============================================================================

# Semantic similarity threshold for considering facts as duplicates
SEMANTIC_DUPLICATE_THRESHOLD = 0.92  # Cosine similarity (0-1), high to avoid false merges

# Minimum number of refresh cycles to consider a fact "recurring"
RECURRING_REFRESH_THRESHOLD = 3


class ProfileSummaryResponse(BaseModel):
    """LLM response for profile summary generation."""
    summary: str = Field(description="A concise 2-3 sentence profile summary")
    key_traits: list[str] = Field(
        default_factory=list,
        description="Top 3-5 defining characteristics or facts"
    )


class ConsolidationStats(BaseModel):
    """Statistics from a consolidation run."""
    duplicates_merged: int = 0
    facts_promoted_essential: int = 0
    profile_updated: bool = False
    total_facts_analyzed: int = 0


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two embedding vectors."""
    import math
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _find_semantic_duplicate_clusters(
    facts: list[MemoryFact],
    threshold: float = SEMANTIC_DUPLICATE_THRESHOLD
) -> list[list[MemoryFact]]:
    """
    Find clusters of semantically similar facts using embedding similarity.
    
    Uses a simple union-find approach: for each pair of facts with similarity
    above threshold, group them together.
    
    Returns list of clusters (each cluster has 2+ similar facts).
    """
    # Only consider facts with embeddings
    facts_with_embeddings = [f for f in facts if f.embedding is not None]
    if len(facts_with_embeddings) < 2:
        return []
    
    # Build similarity graph
    n = len(facts_with_embeddings)
    parent = list(range(n))
    
    def find(x: int) -> int:
        if parent[x] != x:
            parent[x] = find(parent[x])
        return parent[x]
    
    def union(x: int, y: int):
        px, py = find(x), find(y)
        if px != py:
            parent[px] = py
    
    # Compare pairs within same category only
    for i in range(n):
        for j in range(i + 1, n):
            fact_i = facts_with_embeddings[i]
            fact_j = facts_with_embeddings[j]
            # Only compare within same category
            if fact_i.category != fact_j.category:
                continue
            similarity = _cosine_similarity(fact_i.embedding, fact_j.embedding)
            if similarity >= threshold:
                union(i, j)
    
    # Group by cluster
    clusters: dict[int, list[MemoryFact]] = {}
    for i, fact in enumerate(facts_with_embeddings):
        root = find(i)
        if root not in clusters:
            clusters[root] = []
        clusters[root].append(fact)
    
    # Return only clusters with 2+ facts
    return [cluster for cluster in clusters.values() if len(cluster) >= 2]


async def _merge_duplicate_cluster(
    cluster: list[MemoryFact],
    db: AsyncSession
) -> MemoryFact:
    """
    Merge a cluster of duplicate facts by keeping the best one.
    
    Selection criteria:
    1. Highest confidence
    2. Most recent if tie
    3. Essential facts preferred
    
    Other facts in cluster are superseded by the winner.
    """
    # Sort: essential first, then by confidence desc, then by created_at desc
    sorted_cluster = sorted(
        cluster,
        key=lambda f: (f.is_essential, f.confidence_score, f.created_at),
        reverse=True
    )
    winner = sorted_cluster[0]
    
    for fact in sorted_cluster[1:]:
        if fact.superseded_by is None:
            fact.superseded_by = winner.id
            db.add(fact)
    
    return winner


async def _generate_profile_summary(
    facts: list[MemoryFact],
    llm_provider
) -> ProfileSummaryResponse | None:
    """
    Generate a concise profile summary from user facts.
    
    Groups facts by category and asks LLM to synthesize.
    """
    if not facts:
        return None
    
    # Group facts by category for organized presentation
    by_category: dict[str, list[str]] = {}
    for fact in facts:
        cat = fact.category.value if hasattr(fact.category, 'value') else str(fact.category)
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(fact.content)
    
    # Build facts text
    facts_text_parts = []
    for cat, contents in by_category.items():
        facts_text_parts.append(f"**{cat}**:")
        for content in contents[:10]:  # Limit per category
            facts_text_parts.append(f"  - {content}")
    facts_text = "\n".join(facts_text_parts)
    
    try:
        response = await llm_provider.chat_structured(
            messages=[
                {
                    "role": "system",
                    "content": """You are a profile summarization assistant. Given a user's memory facts, 
create a brief, natural-sounding profile summary.

Rules:
1. Write 2-3 sentences maximum
2. Focus on the most defining characteristics
3. Write in third person ("They live in...", "Works as...")
4. Extract 3-5 key traits/facts
5. Be concise and factual, no fluff"""
                },
                {
                    "role": "user",
                    "content": f"Summarize this user from their facts:\n\n{facts_text}"
                }
            ],
            response_model=ProfileSummaryResponse,
        )
        return response
    except Exception as e:
        logger.warning(f"Profile summary generation failed: {e}")
        return None


async def consolidate_user_memory(ctx: dict[str, Any], user_id: str) -> dict:
    """
    Multi-session memory consolidation task.
    
    Analyzes ALL facts for a user across all sessions and:
    1. Finds and merges semantic duplicates (embedding similarity)
    2. Promotes frequently-refreshed facts to essential
    3. Generates/updates a profile summary
    
    Should be run periodically (daily/weekly) or triggered manually.
    """
    logger.info(f"Starting memory consolidation for user {user_id}")
    stats = ConsolidationStats()
    
    async with worker_sessionmaker() as db:
        try:
            # 1. Fetch all active (non-expired, non-superseded) facts
            stmt = (
                select(MemoryFact)
                .where(
                    MemoryFact.user_id == user_id,
                    MemoryFact.superseded_by.is_(None),
                    MemoryFact.expires_at.is_(None),
                )
                .order_by(MemoryFact.created_at.desc())
            )
            result = await db.execute(stmt)
            all_facts = list(result.scalars().all())
            stats.total_facts_analyzed = len(all_facts)
            
            if not all_facts:
                logger.info(f"No facts to consolidate for user {user_id}")
                return {"status": "no_facts", "user_id": user_id, "stats": stats.model_dump()}
            
            logger.info(f"Analyzing {len(all_facts)} facts for user {user_id}")
            
            # 2. Find and merge semantic duplicates
            duplicate_clusters = _find_semantic_duplicate_clusters(all_facts)
            for cluster in duplicate_clusters:
                winner = await _merge_duplicate_cluster(cluster, db)
                stats.duplicates_merged += len(cluster) - 1
                logger.debug(
                    f"Merged {len(cluster)} duplicates, kept: {winner.content[:50]}..."
                )
            
            # 3. Promote frequently-refreshed facts to essential
            # A fact that's been refreshed multiple times is likely important
            now = datetime.now(timezone.utc)
            for fact in all_facts:
                if fact.is_essential:
                    continue
                # Check if fact has been refreshed significantly after creation
                refresh_delta = (fact.last_refreshed_at - fact.created_at).days
                # If refreshed multiple times over weeks, it's recurring/important
                if refresh_delta >= 7 and fact.confidence_score >= 0.7:
                    fact.is_essential = True
                    db.add(fact)
                    stats.facts_promoted_essential += 1
            
            # 4. Generate profile summary
            # Filter to essential + high-confidence facts for summary
            summary_candidates = [
                f for f in all_facts
                if f.is_essential or f.confidence_score >= 0.75
            ][:30]  # Limit for token budget
            
            llm_provider = get_llm_provider()
            profile = await _generate_profile_summary(summary_candidates, llm_provider)
            
            if profile:
                # Store as a special biographical fact with slot_hint="profile_summary"
                existing_summary_stmt = select(MemoryFact).where(
                    MemoryFact.user_id == user_id,
                    MemoryFact.slot_hint == "profile_summary",
                    MemoryFact.superseded_by.is_(None),
                    MemoryFact.expires_at.is_(None),
                )
                existing_result = await db.execute(existing_summary_stmt)
                existing_summary = existing_result.scalar_one_or_none()
                
                summary_content = f"{profile.summary} Key traits: {', '.join(profile.key_traits)}"
                
                if existing_summary:
                    # Update existing summary
                    existing_summary.content = summary_content
                    existing_summary.last_refreshed_at = now
                    existing_summary.confidence_score = 1.0
                    db.add(existing_summary)
                else:
                    # Create new summary fact
                    summary_fact = MemoryFact(
                        user_id=user_id,
                        category=FactCategory.BIOGRAPHICAL,
                        content=summary_content,
                        confidence_score=1.0,
                        slot_hint="profile_summary",
                        is_essential=True,
                    )
                    db.add(summary_fact)
                
                stats.profile_updated = True
            
            await db.commit()
            
            logger.info(
                f"Consolidation complete for user {user_id}: "
                f"{stats.duplicates_merged} duplicates merged, "
                f"{stats.facts_promoted_essential} promoted to essential, "
                f"profile_updated={stats.profile_updated}"
            )
            
            return {
                "status": "success",
                "user_id": user_id,
                "stats": stats.model_dump()
            }
            
        except (RateLimitError, APIError, APIConnectionError, APITimeoutError) as e:
            logger.warning(f"Transient error during consolidation for user {user_id}: {e}")
            raise Retry(defer=60) from e
        except Exception as e:
            logger.error(f"Error during consolidation: {str(e)}", exc_info=True)
            return {"status": "error", "error": str(e), "user_id": user_id}


async def scheduled_consolidation(ctx: dict[str, Any]):
    """
    Cron task: Find all users with recent activity and enqueue consolidation.
    
    Only consolidates users who have new facts in the last 7 days to avoid
    unnecessary processing.
    """
    logger.info("Running scheduled memory consolidation")
    async with worker_sessionmaker() as db:
        # Get users with recent fact activity
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        stmt = (
            select(MemoryFact.user_id)
            .where(MemoryFact.created_at >= cutoff)
            .distinct()
        )
        result = await db.execute(stmt)
        user_ids = result.scalars().all()
        
        logger.info(f"Scheduling consolidation for {len(user_ids)} active users")
        for user_id in user_ids:
            await ctx["redis"].enqueue_job("consolidate_user_memory", str(user_id))


class WorkerSettings:
    """ARQ worker configuration"""
    
    functions = [
        extract_facts_task,
        optimize_user_memory,
        scheduled_optimization,
        decay_stale_facts,
        consolidate_user_memory,
        scheduled_consolidation,
    ]
    
    redis_settings = RedisSettings.from_dsn(str(settings.REDIS_URL))
    
    # Worker behavior
    max_jobs = 10
    job_timeout = 180  # 3 minutes per job (consolidation can take longer)
    retry_jobs = True
    max_tries = 5
    
    # Cron jobs
    cron_jobs = [
        cron(scheduled_optimization, hour={0, 6, 12, 18}, minute=0),
        cron(decay_stale_facts, hour={3}, minute=0),
        # Weekly consolidation on Sundays at 2 AM
        cron(scheduled_consolidation, weekday={6}, hour={2}, minute=0),
    ]
    
    @staticmethod
    async def on_shutdown(ctx):
        await worker_engine.dispose()

"""
API Routes - Recall Endpoint  
Phase 4: Retrieval & Context Injection
"""
import logging
import asyncio
import re
from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from rapidfuzz import fuzz
from openai import (
    APIError,
    RateLimitError as OpenAIRateLimitError,
    APIConnectionError,
    APITimeoutError,
)
from app.database import get_db
from app.schemas import RecallRequest, RecallResponse, FactDTO
from app.models import MemoryFact, TemporalState, FactCategory
from app.security import ensure_user_authorized, API_KEY_HEADER
from app.llm import get_llm_provider
from app.metrics import RECALL_LATENCY
from datetime import datetime, timedelta, timezone
from app.errors import RecallError

router = APIRouter(prefix="/v1", tags=["recall"])
logger = logging.getLogger(__name__)


def _fuzzy_score(query: str, content: str, confidence: float) -> tuple[float, int]:
    """
    Blend fuzzy similarity with stored confidence to avoid returning low-quality hits.
    Returns (composite_score, similarity_raw).
    """
    similarity = fuzz.token_set_ratio(query, content)
    composite_score = (similarity * 0.7) + (confidence * 30)
    return composite_score, similarity


# Minimum relevance thresholds to avoid returning unrelated facts
MIN_FUZZY_SIMILARITY = 30  # Minimum fuzzy match score (0-100) - lowered for better recall
MIN_VECTOR_DISTANCE = 0.75  # Maximum cosine distance (0=identical, 2=opposite) - slightly relaxed
HIGH_CONFIDENCE_FALLBACK = 0.7
INTENT_HINTS = {
    # Biographical / Location
    "where": {"biographical"},
    "live": {"biographical"},
    "lives": {"biographical"},
    "living": {"biographical"},
    "location": {"biographical"},
    "city": {"biographical"},
    "move": {"biographical"},
    "moved": {"biographical"},
    # Work context
    "job": {"work_context"},
    "jobs": {"work_context"},
    "profession": {"work_context"},
    "work": {"work_context"},
    "working": {"work_context"},
    "role": {"work_context"},
    "employer": {"work_context"},
    "company": {"work_context"},
    "companies": {"work_context"},
    # Preferences
    "like": {"user_preference"},
    "likes": {"user_preference"},
    "love": {"user_preference"},
    "loves": {"user_preference"},
    "enjoy": {"user_preference"},
    "enjoys": {"user_preference"},
    "hobby": {"user_preference"},
    "hobbies": {"user_preference"},
    "prefer": {"user_preference"},
    "prefers": {"user_preference"},
    "preference": {"user_preference"},
    "preferences": {"user_preference"},
    "favorite": {"user_preference"},
    "favourites": {"user_preference"},
    # Learning
    "learning": {"learning", "user_preference"},
    "studying": {"learning", "user_preference"},
    "study": {"learning", "user_preference"},
    "course": {"learning"},
    "courses": {"learning"},
    "class": {"learning"},
    # Relationships
    "girlfriend": {"relationship"},
    "boyfriend": {"relationship"},
    "spouse": {"relationship"},
    "partner": {"relationship"},
    "wife": {"relationship"},
    "husband": {"relationship"},
    "friend": {"relationship"},
    "friends": {"relationship"},
}


def _hint_categories(query: str) -> set[str]:
    """Extract category hints from query based on keywords.
    
    Strips punctuation from tokens to handle queries like "girlfriend?" or "live?".
    """
    import re
    # Remove punctuation from tokens for matching
    tokens = re.findall(r'\b\w+\b', query.lower())
    hinted: set[str] = set()
    for token in tokens:
        hinted.update(INTENT_HINTS.get(token, set()))
    return hinted


def _allow_category(hinted: set[str], category: str) -> bool:
    # If hints exist, only allow hinted categories; otherwise allow all.
    if hinted:
        return category in hinted
    return True


# Relaxed patterns: no strict anchors, punctuation-tolerant
# Uses re.search (matches anywhere) instead of re.match (anchored at start)
GENERIC_QUERY_PATTERNS = [
    r"tell me about (myself|me)\b",                     # "Can you tell me about myself?"
    r"what .* know about me\b",                         # "What do you know about me?"
    r"\bwho am i\b",                                    # "Who am I?"
    r"summarize (me|myself|my profile|my information)\b",  # "Please summarize my profile"
    r"what .* remember about me\b",                     # "What should you remember about me?"
    r"everything .* about me\b",                        # "Tell me everything about me"
    r"\b(my|about my) (profile|information|details|summary)\b",  # "Show me my profile"
    r"\bdescribe me\b",                                 # "Can you describe me?"
]


def _is_generic_query(query: str) -> bool:
    """
    Detect generic "tell me about myself" style queries.
    
    These queries don't have specific intent hints, so we use balanced
    profile retrieval instead of category-filtered search.
    """
    # Normalize: lowercase, strip whitespace, remove trailing punctuation
    normalized = query.strip().lower().rstrip('?!.')
    return any(re.search(pattern, normalized) for pattern in GENERIC_QUERY_PATTERNS)


async def _get_balanced_profile_facts(
    db: AsyncSession,
    user_id,
    limit: int,
    include_historical: bool,
    current_view_only: bool,
) -> list[MemoryFact]:
    """Return a balanced mix of facts across categories, preferring essential + confident."""
    per_category = max(1, limit // len(FactCategory))
    collected: list[MemoryFact] = []

    for category in FactCategory:
        filters = [
            MemoryFact.user_id == user_id,
            MemoryFact.category == category,
            MemoryFact.expires_at.is_(None),
        ]
        if current_view_only:
            filters.append(MemoryFact.superseded_by.is_(None))
        if not include_historical:
            filters.append(MemoryFact.temporal_state != TemporalState.PAST.value)

        stmt = (
            select(MemoryFact)
            .where(*filters)
            .order_by(
                MemoryFact.is_essential.desc(),
                MemoryFact.confidence_score.desc(),
                MemoryFact.created_at.desc(),
            )
            .limit(per_category)
        )
        result = await db.execute(stmt)
        collected.extend(result.scalars().all())

    return collected[:limit]


async def _get_high_confidence_facts(
    db: AsyncSession,
    user_id,
    limit: int,
    include_historical: bool,
    current_view_only: bool,
    min_confidence: float = HIGH_CONFIDENCE_FALLBACK,
) -> list[MemoryFact]:
    """Fetch top confidence facts regardless of category (for generic fallback)."""
    filters = [
        MemoryFact.user_id == user_id,
        MemoryFact.expires_at.is_(None),
        MemoryFact.confidence_score >= min_confidence,
    ]
    if current_view_only:
        filters.append(MemoryFact.superseded_by.is_(None))
    if not include_historical:
        filters.append(MemoryFact.temporal_state != TemporalState.PAST.value)

    stmt = (
        select(MemoryFact)
        .where(*filters)
        .order_by(
            MemoryFact.is_essential.desc(),
            MemoryFact.confidence_score.desc(),
            MemoryFact.created_at.desc(),
        )
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/recall", response_model=RecallResponse)
async def recall_facts(
    request: RecallRequest,
    db: AsyncSession = Depends(get_db),
    api_key: str | None = Header(default=None, alias=API_KEY_HEADER)
):
    """
    POST /v1/recall
    Retrieve relevant memory facts for a user based on query.
    
    Strategy:
    1. Filter by user_id
    2. TODO: Implement semantic search using query
    3. Order by confidence_score desc, created_at desc
    4. Map to FactDTO and return
    """
    await ensure_user_authorized(request.user_id, api_key, db)
    try:
        # Filters
        hinted_categories = _hint_categories(request.query)
        is_generic_query = _is_generic_query(request.query)
        category_filter = set(request.categories) if request.categories else None
        if not category_filter and hinted_categories and not is_generic_query:
            category_filter = hinted_categories
        cutoff_ts = None
        if request.max_age_days is not None:
            cutoff_ts = datetime.now(timezone.utc) - timedelta(days=request.max_age_days)
        llm_provider = get_llm_provider()
        query_embedding: list[float] | None = None
        vector_results: list[MemoryFact] = []
        with RECALL_LATENCY.labels(source="recall").time():
            try:
                query_embedding = (await llm_provider.embed_texts([request.query]))[0]
            except (OpenAIRateLimitError, APIError, APIConnectionError, APITimeoutError) as exc:
                logger.warning(f"Falling back to fuzzy recall; embedding transient error: {exc}")
            except Exception as exc:
                logger.warning(f"Falling back to fuzzy recall; embedding failed: {exc}")
        
        if query_embedding:
            # Build vector search filters
            vector_filters = [
                MemoryFact.user_id == request.user_id,
                MemoryFact.embedding.is_not(None),
                MemoryFact.expires_at.is_(None),
                MemoryFact.embedding.cosine_distance(query_embedding) < MIN_VECTOR_DISTANCE
            ]
            if request.current_view_only:
                vector_filters.append(MemoryFact.superseded_by.is_(None))
            # Apply category filter at SQL level to reduce noise (e.g., relationship facts in location queries)
            if category_filter:
                vector_filters.append(MemoryFact.category.in_(category_filter))
            # Filter by temporal state - by default exclude historical (past) facts
            if not request.include_historical:
                vector_filters.append(MemoryFact.temporal_state != TemporalState.PAST.value)
            
            vector_stmt = (
                select(MemoryFact)
                .where(*vector_filters)
                .order_by(MemoryFact.embedding.cosine_distance(query_embedding))
                .limit(request.limit)
            )
            vector_exec = await db.execute(vector_stmt)
            vector_results = list(vector_exec.scalars().all())
            logger.info(f"Vector search returned {len(vector_results)} results for query: {request.query} (categories: {category_filter})")
        
        if len(vector_results) < request.limit:
            # Pull a candidate pool to rank in-memory with fuzzy similarity to avoid full table scans.
            candidate_pool = min(max(request.limit * 10, 50), 500)
            stmt_filters = [
                MemoryFact.user_id == request.user_id,
                MemoryFact.expires_at.is_(None),
            ]
            if request.current_view_only:
                stmt_filters.append(MemoryFact.superseded_by.is_(None))
            if cutoff_ts:
                stmt_filters.append(MemoryFact.created_at >= cutoff_ts)
            if category_filter:
                stmt_filters.append(MemoryFact.category.in_(category_filter))
            # Filter by temporal state
            if not request.include_historical:
                stmt_filters.append(MemoryFact.temporal_state != TemporalState.PAST.value)

            stmt = select(MemoryFact).where(*stmt_filters).order_by(MemoryFact.created_at.desc()).limit(candidate_pool)
            
            result = await db.execute(stmt)
            facts = result.scalars().all()
            
            ranked = []
            seen_ids = {fact.id for fact in vector_results}
            for fact in facts:
                if fact.id in seen_ids:
                    continue
                if not _allow_category(hinted_categories, fact.category.value if hasattr(fact.category, "value") else str(fact.category)):
                    continue
                composite_score, similarity = _fuzzy_score(request.query, fact.content, fact.confidence_score)
                # Only include facts that meet minimum similarity threshold
                if similarity >= MIN_FUZZY_SIMILARITY:
                    ranked.append((composite_score, similarity, fact))
            
            ranked.sort(key=lambda item: item[0], reverse=True)
            remaining = request.limit - len(vector_results)
            vector_results.extend([item[2] for item in ranked[:remaining]])
            logger.info(f"Fuzzy search added {min(len(ranked), remaining)} results (filtered from {len(facts)} candidates)")

        # Generic query fallback: balanced essentials then high-confidence fill
        if is_generic_query and len(vector_results) < request.limit:
            seen_ids = {fact.id for fact in vector_results}
            balanced = await _get_balanced_profile_facts(
                db,
                request.user_id,
                request.limit,
                include_historical=request.include_historical,
                current_view_only=request.current_view_only,
            )
            for fact in balanced:
                if fact.id not in seen_ids and len(vector_results) < request.limit:
                    vector_results.append(fact)
                    seen_ids.add(fact.id)

            if len(vector_results) < request.limit:
                high_conf = await _get_high_confidence_facts(
                    db,
                    request.user_id,
                    request.limit - len(vector_results),
                    include_historical=request.include_historical,
                    current_view_only=request.current_view_only,
                )
                for fact in high_conf:
                    if fact.id not in seen_ids and len(vector_results) < request.limit:
                        vector_results.append(fact)
                        seen_ids.add(fact.id)
        
        fact_dtos = [
            FactDTO(
                category=fact.category.value if hasattr(fact.category, 'value') else str(fact.category),
                content=fact.content,
                confidence=fact.confidence_score,
                temporal_state=fact.temporal_state if fact.temporal_state else "current"
            )
            for fact in vector_results
        ]
        
        return RecallResponse(relevant_facts=fact_dtos)
    except RecallError:
        raise
    except Exception as exc:
        logger.error(f"Recall failed: {exc}", exc_info=True)
        raise RecallError("Recall failed", details={"reason": str(exc)})

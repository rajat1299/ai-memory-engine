"""
Background Worker Tasks with Instructor for Structured LLM Responses
Phase 4: Enhanced Memory Extraction with Deduplication
"""
import asyncio
import logging
from arq import cron, Retry
from arq.connections import RedisSettings
from openai import AsyncOpenAI, APIError, RateLimitError, APIConnectionError, APITimeoutError
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from typing import Any, Iterable
from pydantic import BaseModel, Field
import instructor
from rapidfuzz import fuzz

from app.config import settings
from app.models import ChatLog, MemoryFact, FactCategory, Session

# Setup Logger
logger = logging.getLogger(__name__)

# Initialize OpenAI clients (chat + embeddings) with instructor patch for chat
_base_openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY.get_secret_value())
instructor.patch(_base_openai_client)
openai_client = _base_openai_client
embedding_client = _base_openai_client

# Shared DB engine/session for worker tasks to avoid per-job creation overhead
worker_engine = create_async_engine(str(settings.DATABASE_URL), future=True)
worker_sessionmaker = async_sessionmaker(worker_engine, class_=AsyncSession, expire_on_commit=False)


# Pydantic models for structured extraction
class ExtractedFact(BaseModel):
    """Single extracted fact with strict validation"""
    category: FactCategory = Field(
        description="Category of the fact: user_preference, biographical, work_context, or relationship"
    )
    content: str = Field(
        min_length=5,
        description="The actual fact, concise and specific"
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence score between 0 and 1"
    )


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


async def _with_retry(coro_fn, *args, retries: int = 3, base_delay: float = 0.5, **kwargs):
    """
    Simple exponential backoff retry helper for transient OpenAI/connection errors.
    """
    for attempt in range(retries):
        try:
            return await coro_fn(*args, **kwargs)
        except (RateLimitError, APIError, APIConnectionError, APITimeoutError) as exc:
            if attempt == retries - 1:
                raise
            delay = base_delay * (2 ** attempt)
            logger.warning(f"Retrying after transient error: {exc} (attempt {attempt + 1}/{retries})")
            await asyncio.sleep(delay)


async def _embed_texts(texts: Iterable[str]) -> list[list[float]]:
    """
    Batch embed texts using the configured embedding model.
    """
    response = await _with_retry(
        embedding_client.embeddings.create,
        model=settings.EMBEDDING_MODEL,
        input=list(texts),
        dimensions=settings.EMBEDDING_DIM,
    )
    return [item.embedding for item in response.data]


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
            
            # 3. Extract facts using OpenAI with Instructor
            extraction_result = await _with_retry(
                openai_client.chat.completions.create,
                model="gpt-4o-mini",
                response_model=FactExtractionResponse,
                messages=[
                    {
                        "role": "system",
                        "content": """You are a memory extraction assistant. Extract persistent facts about the user from conversations.

Rules:
- Only extract clear, factual information
- Ignore casual chat, greetings, or temporary states
- Each fact should be atomic (one piece of information)
- Be concise but specific
- Assign appropriate confidence scores (0.7-1.0 for clear facts, 0.4-0.6 for inferred)

Categories:
- user_preference: Likes, dislikes, preferences (e.g., "Prefers dark mode")
- biographical: Personal info (e.g., "Lives in Dallas")
- work_context: Job, projects, work info (e.g., "Works on AI projects")
- relationship: People, relationships (e.g., "Manager is Sarah")"""
                    },
                    {
                        "role": "user",
                        "content": f"Extract facts from this conversation:\n\n{conversation}"
                    }
                ]
            )
            
            extracted_facts = extraction_result.facts
            logger.info(f"Extracted {len(extracted_facts)} potential facts")
            
            # 4. Deduplicate against existing facts
            stmt_existing = select(MemoryFact).where(
                MemoryFact.user_id == user_id
            )
            existing_result = await db.execute(stmt_existing)
            existing_facts = existing_result.scalars().all()
            
            # Build list of existing contents for fuzzy matching
            existing_contents = [fact.content for fact in existing_facts]
            
            # Filter out duplicates and save new facts (with embeddings)
            pending_facts: list[MemoryFact] = []
            for extracted in extracted_facts:
                if _is_fuzzy_duplicate(existing_contents, extracted.content):
                    logger.debug(f"Duplicate fact skipped: {extracted.content}")
                    continue
                
                new_fact = MemoryFact(
                    user_id=user_id,
                    category=extracted.category,
                    content=extracted.content,
                    confidence_score=extracted.confidence,
                    source_message_id=messages[-1].id
                )
                pending_facts.append(new_fact)
                existing_contents.append(extracted.content)
                logger.info(f"New fact: [{extracted.category.value}] {extracted.content}")

            facts_saved = 0
            if pending_facts:
                try:
                    embeddings = await _embed_texts([fact.content for fact in pending_facts])
                except Exception as exc:  # keep saving facts even if embeddings fail
                    logger.error(f"Embedding generation failed: {exc}", exc_info=True)
                    embeddings = [None] * len(pending_facts)

                for fact, embedding in zip(pending_facts, embeddings):
                    fact.embedding = embedding
                    db.add(fact)
                    facts_saved += 1
            
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
                    MemoryFact.is_essential == False
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
            response = await _with_retry(
                openai_client.chat.completions.create,
                model="gpt-4o-mini",
                response_model=OptimizationResponse,
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
                ]
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


class WorkerSettings:
    """ARQ worker configuration"""
    
    functions = [extract_facts_task, optimize_user_memory, scheduled_optimization]
    
    redis_settings = RedisSettings.from_dsn(str(settings.REDIS_URL))
    
    # Worker behavior
    max_jobs = 10
    job_timeout = 120  # 2 minutes per job
    retry_jobs = True
    max_tries = 5
    
    # Cron jobs
    cron_jobs = [
        cron(scheduled_optimization, hour={0, 6, 12, 18}, minute=0)
    ]
    
    @staticmethod
    async def on_shutdown(ctx):
        await worker_engine.dispose()

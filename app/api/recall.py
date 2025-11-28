"""
API Routes - Recall Endpoint  
Phase 4: Retrieval & Context Injection
"""
import logging
import asyncio
from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from rapidfuzz import fuzz
from openai import APIError, RateLimitError, APIConnectionError, APITimeoutError
from app.database import get_db
from app.schemas import RecallRequest, RecallResponse, FactDTO
from app.models import MemoryFact
from app.security import ensure_user_authorized, API_KEY_HEADER
from app.llm import get_llm_provider
from app.metrics import RECALL_LATENCY
from datetime import datetime, timedelta, timezone

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
    # Filters
    hinted_categories = _hint_categories(request.query)
    category_filter = set(request.categories) if request.categories else None
    if not category_filter and hinted_categories:
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
        except (RateLimitError, APIError, APIConnectionError, APITimeoutError) as exc:
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
    
    fact_dtos = [
        FactDTO(
            category=fact.category.value if hasattr(fact.category, 'value') else str(fact.category),
            content=fact.content,
            confidence=fact.confidence_score
        )
        for fact in vector_results
    ]
    
    return RecallResponse(relevant_facts=fact_dtos)

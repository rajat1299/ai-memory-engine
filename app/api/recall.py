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
from openai import AsyncOpenAI, APIError, RateLimitError, APIConnectionError, APITimeoutError
from app.database import get_db
from app.schemas import RecallRequest, RecallResponse, FactDTO
from app.models import MemoryFact
from app.config import settings
from app.security import ensure_user_authorized, API_KEY_HEADER

router = APIRouter(prefix="/v1", tags=["recall"])
logger = logging.getLogger(__name__)
_embedding_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY.get_secret_value())


async def _with_retry(coro_fn, *args, retries: int = 3, base_delay: float = 0.5, **kwargs):
    for attempt in range(retries):
        try:
            return await coro_fn(*args, **kwargs)
        except (RateLimitError, APIError, APIConnectionError, APITimeoutError) as exc:
            if attempt == retries - 1:
                raise
            delay = base_delay * (2 ** attempt)
            logger.warning(f"Retrying embedding after transient error: {exc} (attempt {attempt + 1}/{retries})")
            await asyncio.sleep(delay)


async def _embed_query(text: str) -> list[float]:
    response = await _with_retry(
        _embedding_client.embeddings.create,
        model=settings.EMBEDDING_MODEL,
        input=[text],
        dimensions=settings.EMBEDDING_DIM,
    )
    return response.data[0].embedding


def _fuzzy_score(query: str, content: str, confidence: float) -> tuple[float, int]:
    """
    Blend fuzzy similarity with stored confidence to avoid returning low-quality hits.
    Returns (composite_score, similarity_raw).
    """
    similarity = fuzz.token_set_ratio(query, content)
    composite_score = (similarity * 0.7) + (confidence * 30)
    return composite_score, similarity


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
    query_embedding: list[float] | None = None
    vector_results: list[MemoryFact] = []
    try:
        query_embedding = await _embed_query(request.query)
    except Exception as exc:
        logger.warning(f"Falling back to fuzzy recall; embedding failed: {exc}")
    
    if query_embedding:
        vector_stmt = (
            select(MemoryFact)
            .where(
                MemoryFact.user_id == request.user_id,
                MemoryFact.embedding.is_not(None)
            )
            .order_by(MemoryFact.embedding.cosine_distance(query_embedding))
            .limit(request.limit)
        )
        vector_exec = await db.execute(vector_stmt)
        vector_results = list(vector_exec.scalars().all())
    
    if len(vector_results) < request.limit:
        # Pull a candidate pool to rank in-memory with fuzzy similarity to avoid full table scans.
        candidate_pool = min(max(request.limit * 10, 50), 500)
        stmt = (
            select(MemoryFact)
            .where(MemoryFact.user_id == request.user_id)
            .order_by(MemoryFact.created_at.desc())
            .limit(candidate_pool)
        )
        
        result = await db.execute(stmt)
        facts = result.scalars().all()
        
        ranked = []
        seen_ids = {fact.id for fact in vector_results}
        for fact in facts:
            if fact.id in seen_ids:
                continue
            composite_score, similarity = _fuzzy_score(request.query, fact.content, fact.confidence_score)
            ranked.append((composite_score, similarity, fact))
        
        ranked.sort(key=lambda item: item[0], reverse=True)
        remaining = request.limit - len(vector_results)
        vector_results.extend([item[2] for item in ranked[:remaining]])
    
    fact_dtos = [
        FactDTO(
            category=fact.category.value,
            content=fact.content,
            confidence=fact.confidence_score
        )
        for fact in vector_results
    ]
    
    return RecallResponse(relevant_facts=fact_dtos)

"""
API Routes - Recall Endpoint  
Phase 4: Retrieval & Context Injection
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from rapidfuzz import fuzz
from app.database import get_db
from app.schemas import RecallRequest, RecallResponse, FactDTO
from app.models import MemoryFact

router = APIRouter(prefix="/v1", tags=["recall"])


@router.post("/recall", response_model=RecallResponse)
async def recall_facts(
    request: RecallRequest,
    db: AsyncSession = Depends(get_db)
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
    for fact in facts:
        similarity = fuzz.token_set_ratio(request.query, fact.content)
        # Blend similarity and stored confidence to avoid low-quality hits
        composite_score = (similarity * 0.7) + (fact.confidence_score * 30)
        ranked.append((composite_score, similarity, fact))
    
    # Highest composite score first
    ranked.sort(key=lambda item: item[0], reverse=True)
    top_facts = [item[2] for item in ranked[: request.limit]]
    
    fact_dtos = [
        FactDTO(
            category=fact.category.value,
            content=fact.content,
            confidence=fact.confidence_score
        )
        for fact in top_facts
    ]
    
    return RecallResponse(relevant_facts=fact_dtos)

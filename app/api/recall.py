"""
API Routes - Recall Endpoint  
Phase 4: Retrieval & Context Injection
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
    stmt = select(MemoryFact).where(
        MemoryFact.user_id == request.user_id
    )
    
    # TODO: Implement full-text or vector search when query is provided
    # For now, just return highest confidence facts
    
    stmt = stmt.order_by(
        MemoryFact.confidence_score.desc(),
        MemoryFact.created_at.desc()
    ).limit(request.limit)
    
    result = await db.execute(stmt)
    facts = result.scalars().all()
    
    # Map to FactDTO
    fact_dtos = [
        FactDTO(
            category=fact.category.value,
            content=fact.content,
            confidence=fact.confidence_score
        )
        for fact in facts
    ]
    
    return RecallResponse(relevant_facts=fact_dtos)


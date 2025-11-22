"""
API Routes - Conscious Memory Endpoint
Phase 5: Periodic Conscious Agent
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.database import get_db
from app.schemas import RecallResponse, FactDTO
from app.models import MemoryFact

router = APIRouter(prefix="/v1", tags=["conscious"])


@router.get("/conscious/{user_id}", response_model=RecallResponse)
async def get_conscious_memory(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    GET /v1/conscious/{user_id}
    Retrieve "Essential Memories" for a user.
    These are high-priority facts promoted by the Periodic Conscious Agent.
    
    Use this at application startup to load user context.
    """
    stmt = select(MemoryFact).where(
        MemoryFact.user_id == user_id,
        MemoryFact.is_essential == True
    ).order_by(MemoryFact.confidence_score.desc())
    
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

"""
Fact management endpoints (list/delete/expire).
"""
from fastapi import APIRouter, Depends, Header, HTTPException, status
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timezone
from app.database import get_db
from app.models import MemoryFact
from app.security import ensure_user_authorized, API_KEY_HEADER

router = APIRouter(prefix="/v1", tags=["facts"])


class FactWithId(BaseModel):
    """Fact DTO with full metadata for list endpoint."""
    id: UUID
    category: str
    content: str
    confidence: float
    is_essential: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class FactsListResponse(BaseModel):
    """Response for listing facts."""
    facts: list[FactWithId]


@router.get("/facts/{user_id}", response_model=FactsListResponse)
async def list_facts(
    user_id: UUID,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    api_key: str | None = Header(default=None, alias=API_KEY_HEADER)
):
    """
    GET /v1/facts/{user_id}
    List all active (non-expired, non-superseded) facts for a user.
    """
    await ensure_user_authorized(user_id, api_key, db)
    
    stmt = (
        select(MemoryFact)
        .where(
            MemoryFact.user_id == user_id,
            MemoryFact.superseded_by.is_(None),
            MemoryFact.expires_at.is_(None),
        )
        .order_by(MemoryFact.created_at.desc())
        .limit(limit)
    )
    
    result = await db.execute(stmt)
    facts = result.scalars().all()
    
    return FactsListResponse(
        facts=[
            FactWithId(
                id=f.id,
                category=f.category.value if hasattr(f.category, 'value') else str(f.category),
                content=f.content,
                confidence=f.confidence_score,
                is_essential=f.is_essential,
                created_at=f.created_at,
            )
            for f in facts
        ]
    )


@router.delete("/facts/{fact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fact(
    fact_id: UUID,
    db: AsyncSession = Depends(get_db),
    api_key: str | None = Header(default=None, alias=API_KEY_HEADER)
):
    """
    Soft delete a fact by expiring it.
    """
    stmt = select(MemoryFact).where(MemoryFact.id == fact_id)
    result = await db.execute(stmt)
    fact = result.scalar_one_or_none()
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    
    await ensure_user_authorized(fact.user_id, api_key, db)
    
    fact.expires_at = datetime.now(timezone.utc)
    db.add(fact)
    await db.commit()

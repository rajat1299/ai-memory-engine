"""
Fact management endpoints (delete/expire).
"""
from fastapi import APIRouter, Depends, Header, HTTPException, status
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import MemoryFact
from app.security import ensure_user_authorized, API_KEY_HEADER
from datetime import datetime, timezone

router = APIRouter(prefix="/v1", tags=["facts"])


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

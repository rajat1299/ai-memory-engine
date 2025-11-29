"""
Fact management endpoints (list/delete/expire).
"""
from fastapi import APIRouter, Depends, Header, HTTPException, status
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database import get_db
from app.models import MemoryFact, ChatLog
from app.security import ensure_user_authorized, API_KEY_HEADER
from app.schemas import FactWithId, FactsListResponse, FactSourceResponse

router = APIRouter(prefix="/v1", tags=["facts"])


def _preview_text(text: str | None, length: int = 100) -> str | None:
    if text is None:
        return None
    if len(text) <= length:
        return text
    return text[:length] + "…"


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
                source_message_id=f.source_message_id,
                temporal_state=f.temporal_state if hasattr(f, "temporal_state") else None,
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


@router.get("/facts/{fact_id}/source", response_model=FactSourceResponse)
async def get_fact_source(
    fact_id: UUID,
    db: AsyncSession = Depends(get_db),
    api_key: str | None = Header(default=None, alias=API_KEY_HEADER)
):
    """
    GET /v1/facts/{fact_id}/source
    Return the source message that led to this fact (if available).
    """
    stmt_fact = select(MemoryFact).where(MemoryFact.id == fact_id)
    fact_result = await db.execute(stmt_fact)
    fact = fact_result.scalar_one_or_none()
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")

    await ensure_user_authorized(fact.user_id, api_key, db)

    if not fact.source_message_id:
        raise HTTPException(status_code=404, detail="Source message not available for this fact")

    stmt_msg = select(ChatLog).where(ChatLog.id == fact.source_message_id)
    msg_result = await db.execute(stmt_msg)
    message = msg_result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Source message not found")

    return FactSourceResponse(
        fact_id=fact.id,
        source_message_id=fact.source_message_id,
        session_id=message.session_id,
        role=message.role,
        content=message.content,
        content_preview=_preview_text(message.content),
        timestamp=message.timestamp,
    )

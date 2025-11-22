"""
API Routes - Recall Endpoint  
Phase 4: Retrieval & Context Injection
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import Optional
from app.database import get_db
from app.schemas import MemoryFactResponse
from app.models import MemoryFact

router = APIRouter(prefix="/v1", tags=["recall"])


@router.get("/recall", response_model=list[MemoryFactResponse])
async def recall_facts(
    user_id: UUID,
    query: Optional[str] = Query(None, description="Search query for facts"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(5, le=50, description="Maximum number of facts to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    GET /v1/recall
    Retrieve relevant memory facts for a user.
    
    Strategy:
    1. If query provided: Full-text search on content (future: vector search)
    2. If category provided: Filter by category
    3. Order by confidence_score desc, created_at desc
    4. Limit results
    """
    stmt = select(MemoryFact).where(MemoryFact.user_id == user_id)
    
    # Filter by category if provided
    if category:
        stmt = stmt.where(MemoryFact.category == category)
    
    # TODO: Implement full-text search when query is provided
    # For now, just return highest confidence facts
    
    stmt = stmt.order_by(
        MemoryFact.confidence_score.desc(),
        MemoryFact.created_at.desc()
    ).limit(limit)
    
    result = await db.execute(stmt)
    facts = result.scalars().all()
    
    return facts

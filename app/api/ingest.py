"""
API Routes - Ingest Endpoint
Phase 2: The Ingestion API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.database import get_db
from app.schemas import ChatLogCreate, ChatLogResponse, SessionCreate, SessionResponse
from app.models import ChatLog, Session
from sqlalchemy import select

router = APIRouter(prefix="/v1", tags=["ingestion"])


@router.post("/ingest", response_model=ChatLogResponse, status_code=status.HTTP_201_CREATED)
async def ingest_message(
    log: ChatLogCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    POST /v1/ingest
    Save a chat message to the database.
    This is the entry point for all conversations.
    """
    # Create new chat log
    db_log = ChatLog(
        session_id=log.session_id,
        role=log.role,
        content=log.content
    )
    
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    
    # Enqueue background job for memory extraction
    from app.worker.queue import enqueue_memory_extraction
    await enqueue_memory_extraction(str(log.session_id))
    
    return db_log


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session: SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    POST /v1/sessions
    Create a new conversation session for a user.
    """
    db_session = Session(user_id=session.user_id)
    
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    
    return db_session


@router.get("/history/{session_id}", response_model=list[ChatLogResponse])
async def get_history(
    session_id: UUID,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """
    GET /v1/history/{session_id}
    Retrieve the last N messages from a session.
    """
    stmt = select(ChatLog).where(
        ChatLog.session_id == session_id
    ).order_by(ChatLog.timestamp.desc()).limit(limit)
    
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    # Return in chronological order
    return list(reversed(logs))

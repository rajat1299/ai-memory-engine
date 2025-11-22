"""
API Routes - Ingest Endpoint
Phase 2: The Ingestion API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.database import get_db
from app.schemas import IngestRequest, IngestResponse, SessionCreate, SessionResponse, HistoryResponse, ChatLogResponse
from app.models import ChatLog, Session
from app.services.ingestion import IngestionService
from sqlalchemy import select

router = APIRouter(prefix="/v1", tags=["ingestion"])


@router.post("/ingest", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_message(
    request: IngestRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    POST /v1/ingest
    RULE: No business logic here.
    1. Validate Input (Done by Pydantic)
    2. Call Service
    3. Return Output
    """
    service = IngestionService(db)
    result = await service.process_message(request)
    return result


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


@router.get("/history/{session_id}", response_model=HistoryResponse)
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
    
    # Return in chronological order wrapped in HistoryResponse
    return HistoryResponse(
        messages=list(reversed(logs)),
        session_id=session_id
    )


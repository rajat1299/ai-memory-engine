"""
Ingestion Service - Business Logic Layer
RULE: All business logic lives here, not in routes.
"""
import logging
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import ChatLog, Session
from app.schemas import IngestRequest, IngestResponse
from app.worker.queue import enqueue_memory_extraction

logger = logging.getLogger(__name__)


class IngestionService:
    """
    Service for handling chat message ingestion.
    Separates business logic from API routes.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def process_message(self, request: IngestRequest) -> IngestResponse:
        """
        Process incoming chat message:
        1. Validate session exists
        2. Save to chat_logs
        3. Enqueue background extraction
        4. Return response with job_id
        """
        # Validate session exists
        await self._validate_session(request.session_id)
        
        # Create chat log
        chat_log = ChatLog(
            session_id=request.session_id,
            role=request.role,
            content=request.content
        )
        
        self.db.add(chat_log)
        await self.db.commit()
        await self.db.refresh(chat_log)
        
        logger.info(f"Saved chat log {chat_log.id} for session {request.session_id}")
        
        # Enqueue background job
        job_id = await enqueue_memory_extraction(str(request.session_id))
        
        logger.info(f"Enqueued extraction job {job_id} for session {request.session_id}")
        
        return IngestResponse(
            status="queued",
            job_id=job_id,
            chat_log_id=chat_log.id
        )
    
    async def _validate_session(self, session_id: UUID) -> Session:
        """Validate that session exists"""
        stmt = select(Session).where(Session.id == session_id)
        result = await self.db.execute(stmt)
        session = result.scalar_one_or_none()
        
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        return session

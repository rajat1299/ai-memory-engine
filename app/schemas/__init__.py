"""
Pydantic Schemas for API Request/Response Validation
RULE: Data does not enter or leave the system without a visa (validation).
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Literal, Optional
from app.models import FactCategory


# ============================================================================
# INGESTION (Writing Memory)
# ============================================================================

class IngestRequest(BaseModel):
    """Request to ingest a chat message"""
    user_id: UUID
    session_id: UUID
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, description="The raw message content")


class IngestResponse(BaseModel):
    """Response after ingesting a message"""
    status: str = "queued"
    job_id: str | None = None
    chat_log_id: UUID


# ============================================================================
# RECALL (Reading Memory)
# ============================================================================

class RecallRequest(BaseModel):
    """Request to recall memory facts"""
    user_id: UUID
    query: str = Field(..., min_length=1, description="Current user input to search against")
    limit: int = Field(default=5, ge=1, le=20)


class FactDTO(BaseModel):
    """Data Transfer Object for a Memory Fact"""
    category: str
    content: str
    confidence: float
    
    model_config = ConfigDict(from_attributes=True)


class RecallResponse(BaseModel):
    """Response containing relevant memory facts"""
    relevant_facts: list[FactDTO]


# ============================================================================
# SESSION MANAGEMENT
# ============================================================================

class SessionCreate(BaseModel):
    """Request to create a new session"""
    user_id: UUID


class SessionResponse(BaseModel):
    """Response with session details"""
    id: UUID
    user_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# HISTORY
# ============================================================================

class ChatLogResponse(BaseModel):
    """Individual chat log in history"""
    id: UUID
    session_id: UUID
    role: str
    content: str
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)


class HistoryResponse(BaseModel):
    """Response containing chat history"""
    messages: list[ChatLogResponse]
    session_id: UUID


"""
Pydantic Schemas for API Request/Response Validation
RULE: Never use raw dicts. Always wrap data in Pydantic models.
"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional
from app.models import FactCategory


# ============================================================================
# Base Schemas
# ============================================================================

class TimestampMixin(BaseModel):
    """Mixin for created_at timestamp"""
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Chat Log Schemas
# ============================================================================

class ChatLogCreate(BaseModel):
    """Schema for creating a chat log entry"""
    session_id: UUID
    role: str  # 'user' or 'assistant'
    content: str


class ChatLogResponse(TimestampMixin):
    """Schema for chat log in responses"""
    id: UUID
    session_id: UUID
    role: str
    content: str
    timestamp: datetime


# ============================================================================
# Session Schemas
# ============================================================================

class SessionCreate(BaseModel):
    """Schema for creating a new session"""
    user_id: UUID


class SessionResponse(TimestampMixin):
    """Schema for session in responses"""
    id: UUID
    user_id: UUID


# ============================================================================
# Memory Fact Schemas
# ============================================================================

class MemoryFactCreate(BaseModel):
    """Schema for creating a memory fact (used by worker)"""
    user_id: UUID
    category: FactCategory
    content: str
    confidence_score: float
    source_message_id: Optional[UUID] = None


class MemoryFactResponse(TimestampMixin):
    """Schema for memory fact in responses"""
    id: UUID
    user_id: UUID
    category: FactCategory
    content: str
    confidence_score: float
    source_message_id: Optional[UUID] = None

"""
Pydantic models matching the Mémoire backend schemas.

These types mirror the backend's response structures to provide
full type safety and IDE autocomplete.
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


# ============================================================================
# Core Fact Models
# ============================================================================

class Fact(BaseModel):
    """
    A memory fact extracted from conversations.
    
    Attributes:
        id: Unique fact identifier (for delete/source operations)
        category: One of: biographical, work_context, relationship, user_preference, learning
        content: The fact text (e.g., "Lives in Austin")
        confidence: Extraction confidence score (0.0-1.0)
        temporal_state: current, past, future, or recurring
        slot_hint: Semantic slot (e.g., "location", "employer", "partner")
        source_message_id: ID of the chat message this fact was extracted from
        is_essential: Whether this is a "conscious memory" fact
        created_at: When the fact was created
    """
    id: Optional[str] = None
    category: str
    content: str
    confidence: float
    temporal_state: str = "current"
    slot_hint: Optional[str] = None
    source_message_id: Optional[str] = None
    is_essential: bool = False
    created_at: Optional[datetime] = None


class FactWithSource(BaseModel):
    """Fact with its source message context."""
    fact_id: str
    source_message_id: Optional[str] = None
    session_id: Optional[str] = None
    role: Optional[str] = None
    content: Optional[str] = None
    content_preview: Optional[str] = None
    timestamp: Optional[datetime] = None


# ============================================================================
# API Response Models
# ============================================================================

class RecallResponse(BaseModel):
    """Response from /v1/recall endpoint."""
    relevant_facts: List[Fact] = Field(default_factory=list)


class FactsListResponse(BaseModel):
    """Response from GET /v1/facts/{user_id}."""
    facts: List[Fact] = Field(default_factory=list)


class ConsciousResponse(BaseModel):
    """Response from GET /v1/conscious/{user_id}."""
    essential_facts: List[Fact] = Field(default_factory=list)
    user_id: str


class ConsolidationResponse(BaseModel):
    """Response from POST /v1/users/{user_id}/consolidate."""
    status: str
    message: str
    job_id: Optional[str] = None


class SessionResponse(BaseModel):
    """Response from POST /v1/sessions."""
    id: str
    user_id: str
    created_at: Optional[datetime] = None


# ============================================================================
# Timeline Models (for future /v1/timeline endpoint)
# ============================================================================

class TimelineEvent(BaseModel):
    """A single event in a fact's timeline."""
    fact_id: str
    content: str
    category: str
    confidence: float
    temporal_state: str
    slot_hint: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    replaced_by_id: Optional[str] = None
    is_current: bool = False


class TimelineResponse(BaseModel):
    """Response from GET /v1/timeline (coming soon)."""
    slot_hint: Optional[str] = None
    current_fact: Optional[TimelineEvent] = None
    history: List[TimelineEvent] = Field(default_factory=list)


# ============================================================================
# Request Models (for SDK internal use)
# ============================================================================

class IngestRequest(BaseModel):
    """Request body for POST /v1/ingest."""
    user_id: str
    session_id: str
    role: str
    content: str


# Category constants for convenience
class FactCategory:
    """Valid fact categories."""
    BIOGRAPHICAL = "biographical"
    WORK_CONTEXT = "work_context"
    RELATIONSHIP = "relationship"
    USER_PREFERENCE = "user_preference"
    LEARNING = "learning"
    
    ALL = [BIOGRAPHICAL, WORK_CONTEXT, RELATIONSHIP, USER_PREFERENCE, LEARNING]

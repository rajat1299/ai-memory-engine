from typing import List, Optional
from pydantic import BaseModel, Field


class Fact(BaseModel):
    category: str
    content: str
    confidence: float
    temporal_state: str = "current"
    source_message_id: Optional[str] = None


class RecallResponse(BaseModel):
    relevant_facts: List[Fact] = Field(default_factory=list)


class IngestRequest(BaseModel):
    user_id: str
    session_id: str
    role: str
    content: str


class TimelineEvent(BaseModel):
    fact_id: str
    content: str
    category: str
    confidence: float
    temporal_state: str
    slot_hint: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    replaced_by_id: Optional[str] = None
    is_current: bool = False


class TimelineResponse(BaseModel):
    slot_hint: Optional[str]
    current_fact: Optional[TimelineEvent] = None
    history: List[TimelineEvent] = Field(default_factory=list)

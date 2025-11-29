"""
SQLAlchemy Models - Database Table Definitions
Following the strict schema from the plan.
"""
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Float, Text, UUID, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase
from pgvector.sqlalchemy import Vector
from app.config import settings

class Base(AsyncAttrs, DeclarativeBase):
    """Base class for all models. Enables async attributes."""
    pass

class FactCategory(str, PyEnum):
    USER_PREFERENCE = "user_preference"   # e.g. "Likes dark mode"
    BIOGRAPHICAL = "biographical"         # e.g. "Lives in Dallas"
    WORK_CONTEXT = "work_context"         # e.g. "Working on Project X"
    RELATIONSHIP = "relationship"         # e.g. "Manager is Sarah"
    LEARNING = "learning"                 # e.g. "Studying AI", "Learning Spanish"


class TemporalState(str, PyEnum):
    """
    Indicates whether a fact represents a current, past, or future state.
    Used to distinguish "Lives in Austin" (current) from "Used to live in Dallas" (past).
    """
    CURRENT = "current"       # Present state - this is true NOW (default)
    PAST = "past"             # Historical - was true but no longer ("used to", "previously")
    FUTURE = "future"         # Planned/intended - not yet true ("will", "planning to")
    RECURRING = "recurring"   # Happens periodically ("every week", "usually", "often")

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_hash: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    sessions: Mapped[list["Session"]] = relationship(back_populates="user")
    facts: Mapped[list["MemoryFact"]] = relationship(back_populates="user")

class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="sessions")
    chat_logs: Mapped[list["ChatLog"]] = relationship(back_populates="session")

class ChatLog(Base):
    """Raw record of every message sent/received."""
    __tablename__ = "chat_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sessions.id"))
    role: Mapped[str] = mapped_column(String(20)) # 'user' or 'assistant'
    content: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    session: Mapped["Session"] = relationship(back_populates="chat_logs")

class MemoryFact(Base):
    """
    THE BRAIN: Extracted atomic facts about the user.
    These are created by the Background Worker, not the API directly.
    """
    __tablename__ = "memory_facts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    
    category: Mapped[FactCategory] = mapped_column(String, index=True)
    content: Mapped[str] = mapped_column(Text) # The actual fact
    # Metadata
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0)
    source_message_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), default=None, nullable=True)
    slot_hint: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    temporal_state: Mapped[str] = mapped_column(
        String(20),
        default="current",
        server_default="current",
        index=True
    )
    is_essential: Mapped[bool] = mapped_column(default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now()
    )
    embedding: Mapped[Optional[list[float]]] = mapped_column(
        Vector(settings.EMBEDDING_DIM),
        nullable=True
    )
    superseded_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("memory_facts.id"),
        nullable=True,
        index=True
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_refreshed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now()
    )
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="facts")

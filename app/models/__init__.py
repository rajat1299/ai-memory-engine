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

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_hash: Mapped[str] = mapped_column(String, index=True)
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
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="facts")

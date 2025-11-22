"""
SQLAlchemy Models - Database Table Definitions
Following the strict schema from the plan.
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import String, DateTime, ForeignKey, Float, Text, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase

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
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    sessions: Mapped[list["Session"]] = relationship(back_populates="user")
    facts: Mapped[list["MemoryFact"]] = relationship(back_populates="user")

class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
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
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

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
    confidence_score: Mapped[float] = mapped_column(Float)
    
    # Origin tracking
    source_message_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="facts")





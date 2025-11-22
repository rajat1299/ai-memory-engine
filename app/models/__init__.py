"""
SQLAlchemy Models - Database Table Definitions
Following the strict schema from the plan.
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class MemoryCategory(str, PyEnum):
    """Enum for memory fact categories"""
    USER_PREFERENCE = "USER_PREFERENCE"
    BIOGRAPHICAL_FACT = "BIOGRAPHICAL_FACT"
    WORK_CONTEXT = "WORK_CONTEXT"


class User(Base):
    """Users table - Multi-tenancy support"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_hash = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships (reverse)
    sessions = relationship("Session", back_populates="user")
    memory_facts = relationship("MemoryFact", back_populates="user")


class Session(Base):
    """Sessions table - Grouping conversations"""
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    metadata = Column(JSONB, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    chat_logs = relationship("ChatLog", back_populates="session")


class MemoryFact(Base):
    """Memory Facts table - The 'Long Term' Memory"""
    __tablename__ = "memory_facts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category = Column(Enum(MemoryCategory), nullable=False)
    content = Column(Text, nullable=False)
    confidence_score = Column(Float, default=1.0)
    valid_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="memory_facts")


class ChatLog(Base):
    """Chat Logs table - The Raw Record"""
    __tablename__ = "chat_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="chat_logs")




"""
Background Worker Tasks with Instructor for Structured LLM Responses
Phase 4: Enhanced Memory Extraction with Deduplication
"""
import asyncio
import logging
from arq import create_pool
from arq.connections import RedisSettings
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from typing import Any
from pydantic import BaseModel, Field
import instructor

from app.config import settings
from app.models import ChatLog, MemoryFact, FactCategory, Session

# Setup Logger
logger = logging.getLogger(__name__)

# Initialize Instructor-patched OpenAI client
openai_client = instructor.from_openai(
    AsyncOpenAI(api_key=settings.OPENAI_API_KEY.get_secret_value())
)


# Pydantic models for structured extraction
class ExtractedFact(BaseModel):
    """Single extracted fact with strict validation"""
    category: FactCategory = Field(
        description="Category of the fact: user_preference, biographical, work_context, or relationship"
    )
    content: str = Field(
        min_length=5,
        description="The actual fact, concise and specific"
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence score between 0 and 1"
    )


class FactExtractionResponse(BaseModel):
    """Collection of extracted facts"""
    facts: list[ExtractedFact] = Field(
        default_factory=list,
        description="List of extracted memory facts"
    )


async def extract_facts_task(ctx: dict[str, Any], session_id: str) -> dict:
    """
    THE SMART PART: Enhanced memory extraction with deduplication.
    
    Steps:
    1. Retrieve last 5 messages from session
    2. Call OpenAI with instructor for structured response
    3. Parse into FactCategory enum (automatic with Pydantic)
    4. Deduplicate against existing facts
    5. Save new facts to database
    """
    logger.info(f"Starting fact extraction for session {session_id}")
    
    # Get database session
    engine = create_async_engine(str(settings.DATABASE_URL))
    
    async with AsyncSession(engine) as db:
        try:
            # 1. Fetch last 5 messages
            stmt = select(ChatLog).where(
                ChatLog.session_id == session_id
            ).order_by(ChatLog.timestamp.desc()).limit(5)
            
            result = await db.execute(stmt)
            messages = list(reversed(result.scalars().all()))
            
            if not messages:
                logger.warning(f"No messages found for session {session_id}")
                return {"status": "no_messages", "facts_extracted": 0}
            
            # Get user_id and session
            stmt_session = select(Session).where(Session.id == session_id)
            session_result = await db.execute(stmt_session)
            session_obj = session_result.scalar_one()
            user_id = session_obj.user_id
            
            # 2. Build conversation context
            conversation = "\n".join([
                f"{msg.role}: {msg.content}" for msg in messages
            ])
            
            logger.info(f"Analyzing {len(messages)} messages for user {user_id}")
            
            # 3. Extract facts using OpenAI with Instructor
            extraction_result = await openai_client.chat.completions.create(
                model="gpt-4o-mini",
                response_model=FactExtractionResponse,
                messages=[
                    {
                        "role": "system",
                        "content": """You are a memory extraction assistant. Extract persistent facts about the user from conversations.

Rules:
- Only extract clear, factual information
- Ignore casual chat, greetings, or temporary states
- Each fact should be atomic (one piece of information)
- Be concise but specific
- Assign appropriate confidence scores (0.7-1.0 for clear facts, 0.4-0.6 for inferred)

Categories:
- user_preference: Likes, dislikes, preferences (e.g., "Prefers dark mode")
- biographical: Personal info (e.g., "Lives in Dallas")
- work_context: Job, projects, work info (e.g., "Works on AI projects")
- relationship: People, relationships (e.g., "Manager is Sarah")"""
                    },
                    {
                        "role": "user",
                        "content": f"Extract facts from this conversation:\n\n{conversation}"
                    }
                ]
            )
            
            extracted_facts = extraction_result.facts
            logger.info(f"Extracted {len(extracted_facts)} potential facts")
            
            # 4. Deduplicate against existing facts
            stmt_existing = select(MemoryFact).where(
                MemoryFact.user_id == user_id
            )
            existing_result = await db.execute(stmt_existing)
            existing_facts = existing_result.scalars().all()
            
            # Build set of existing fact contents (lowercased for comparison)
            existing_contents = {fact.content.lower() for fact in existing_facts}
            
            # Filter out duplicates and save new facts
            facts_saved = 0
            for extracted in extracted_facts:
                # Simple deduplication: check if similar content exists
                if extracted.content.lower() not in existing_contents:
                    new_fact = MemoryFact(
                        user_id=user_id,
                        category=extracted.category,
                        content=extracted.content,
                        confidence_score=extracted.confidence,
                        source_message_id=messages[-1].id
                    )
                    db.add(new_fact)
                    facts_saved += 1
                    logger.info(f"New fact: [{extracted.category.value}] {extracted.content}")
                else:
                    logger.debug(f"Duplicate fact skipped: {extracted.content}")
            
            await db.commit()
            
            logger.info(f"Saved {facts_saved} new facts for session {session_id}")
            
            return {
                "status": "success",
                "facts_extracted": len(extracted_facts),
                "facts_saved": facts_saved,
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"Error extracting facts: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "session_id": session_id
            }
        finally:
            await engine.dispose()


class WorkerSettings:
    """ARQ worker configuration"""
    
    functions = [extract_facts_task]
    
    redis_settings = RedisSettings.from_dsn(str(settings.REDIS_URL))
    
    # Worker behavior
    max_jobs = 10
    job_timeout = 120  # 2 minutes per job (increased for LLM calls)

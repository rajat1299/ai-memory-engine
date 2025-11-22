"""
Background Worker Tasks using ARQ
Phase 3: The "Memory Agent"
"""
from arq import create_pool
from arq.connections import RedisSettings
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
import json
from typing import Any
from app.config import settings
from app.models import ChatLog, MemoryFact, FactCategory


# Initialize OpenAI client
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY.get_secret_value())


async def extract_memory_facts(ctx: dict[str, Any], session_id: str) -> dict:
    """
    Background task: Extract memory facts from recent conversation.
    
    Process:
    1. Fetch last 5 messages from session
    2. Send to LLM with extraction prompt
    3. Parse JSON response (using strict mode)
    4. Save facts to memory_facts table
    """
    # Get database session
    engine = create_async_engine(str(settings.DATABASE_URL))
    
    async with AsyncSession(engine) as db:
        # Fetch last 5 messages
        stmt = select(ChatLog).where(
            ChatLog.session_id == session_id
        ).order_by(ChatLog.timestamp.desc()).limit(5)
        
        result = await db.execute(stmt)
        messages = list(reversed(result.scalars().all()))
        
        if not messages:
            return {"status": "no_messages", "facts_extracted": 0}
        
        # Get user_id from session
        user_id = messages[0].session.user_id
        
        # Build conversation context
        conversation = "\n".join([
            f"{msg.role}: {msg.content}" for msg in messages
        ])
        
        # Extract facts using OpenAI
        try:
            response = await openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """Extract persistent facts about the user from this conversation.
Return a JSON array of facts. Each fact should have:
- category: one of [user_preference, biographical, work_context, relationship]
- content: the actual fact (concise, one sentence)
- confidence: float between 0.0 and 1.0

Only extract clear, factual information. Ignore casual chat."""
                    },
                    {
                        "role": "user",
                        "content": f"Conversation:\n{conversation}"
                    }
                ],
                response_format={"type": "json_object"}
            )
            
            # Parse response
            facts_data = json.loads(response.choices[0].message.content)
            facts_list = facts_data.get("facts", [])
            
            # Save facts to database
            facts_created = 0
            for fact_data in facts_list:
                fact = MemoryFact(
                    user_id=user_id,
                    category=FactCategory(fact_data["category"]),
                    content=fact_data["content"],
                    confidence_score=fact_data["confidence"],
                    source_message_id=messages[-1].id
                )
                db.add(fact)
                facts_created += 1
            
            await db.commit()
            
            return {
                "status": "success",
                "facts_extracted": facts_created,
                "session_id": session_id
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "session_id": session_id
            }


class WorkerSettings:
    """ARQ worker configuration"""
    
    functions = [extract_memory_facts]
    
    redis_settings = RedisSettings.from_dsn(str(settings.REDIS_URL))
    
    # Worker behavior
    max_jobs = 10
    job_timeout = 60  # 60 seconds per job

"""
Redis Queue Integration
Helper functions to enqueue background tasks from API routes.
"""
from arq import create_pool
from arq.connections import RedisSettings
from app.config import settings

# Cached Redis pool
_redis_pool = None


async def get_redis_pool():
    """Get or create Redis connection pool for ARQ"""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = await create_pool(
            RedisSettings.from_dsn(str(settings.REDIS_URL))
        )
    return _redis_pool
    

async def close_redis_pool():
    """Close Redis pool on shutdown to avoid leaked connections."""
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.close()
        _redis_pool = None


async def enqueue_memory_extraction(session_id: str) -> str:
    """
    Enqueue a memory extraction job for a session.
    Returns job_id for tracking.
    """
    pool = await get_redis_pool()
    job = await pool.enqueue_job(
        "extract_memory_facts",
        session_id
    )
    return job.job_id

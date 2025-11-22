"""
Database Initialization Script
Run this to create tables in PostgreSQL
"""
import asyncio
from app.database import engine
from app.models import Base


async def init_db():
    """Create all tables based on SQLAlchemy models"""
    async with engine.begin() as conn:
        # Drop all tables (WARNING: destructive in production!)
        # await conn.run_sync(Base.metadata.drop_all)
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database tables created successfully!")


if __name__ == "__main__":
    print("Initializing database...")
    asyncio.run(init_db())

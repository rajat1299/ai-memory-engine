"""
FastAPI Main Application
This is the entry point for the Memori API service.
"""
from fastapi import FastAPI
from app.api import ingest, recall, conscious
from app.api import auth, facts
from app.worker.queue import close_redis_pool

app = FastAPI(
    title="Memori API",
    description="Memory service for conversational AI",
    version="0.1.0"
)

# Include API routers
app.include_router(ingest.router)
app.include_router(recall.router)
app.include_router(conscious.router)
app.include_router(auth.router)
app.include_router(facts.router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "service": "memori-api"}


@app.on_event("shutdown")
async def shutdown_event():
    """Release shared resources on shutdown."""
    await close_redis_pool()

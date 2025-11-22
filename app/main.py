"""
FastAPI Main Application
This is the entry point for the Memori API service.
"""
from fastapi import FastAPI
from app.api import ingest, recall

app = FastAPI(
    title="Memori API",
    description="Memory service for conversational AI",
    version="0.1.0"
)

# Include API routers
app.include_router(ingest.router)
app.include_router(recall.router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "service": "memori-api"}

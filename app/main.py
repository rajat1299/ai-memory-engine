"""
FastAPI Main Application
This is the entry point for the Memori API service.
"""
from fastapi import FastAPI

app = FastAPI(
    title="Memori API",
    description="Memory service for conversational AI",
    version="0.1.0"
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "service": "memori-api"}

"""
FastAPI Main Application
This is the entry point for the Memori API service.
"""
import time
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
import structlog
from app.api import ingest, recall, conscious
from app.api import auth, facts, users
from app.worker.queue import close_redis_pool
from app.metrics import REQUEST_COUNT, REQUEST_LATENCY

logger = structlog.get_logger()

app = FastAPI(
    title="Memori API",
    description="Memory service for conversational AI",
    version="0.1.0"
)

# CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start = time.perf_counter()
    response: Response | PlainTextResponse
    try:
        response = await call_next(request)
    except Exception:
        # Let exception handlers deal with it; count as 500
        REQUEST_COUNT.labels(request.url.path, request.method, "500").inc()
        raise
    duration = time.perf_counter() - start
    REQUEST_COUNT.labels(request.url.path, request.method, str(response.status_code)).inc()
    REQUEST_LATENCY.labels(request.url.path, request.method).observe(duration)
    return response


@app.get("/metrics")
async def metrics():
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)


# Include API routers
app.include_router(ingest.router)
app.include_router(recall.router)
app.include_router(conscious.router)
app.include_router(auth.router)
app.include_router(facts.router)
app.include_router(users.router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "service": "memori-api"}


@app.on_event("shutdown")
async def shutdown_event():
    """Release shared resources on shutdown."""
    await close_redis_pool()

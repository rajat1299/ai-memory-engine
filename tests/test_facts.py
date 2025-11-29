import os
import uuid
from datetime import datetime

import pytest

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("OPENAI_API_KEY", "test-key")

from app.api.facts import _preview_text
from app.schemas import FactSourceResponse


def test_preview_text_truncates_and_handles_none():
    assert _preview_text(None) is None
    short = "Hello"
    assert _preview_text(short) == short
    long = "a" * 150
    truncated = _preview_text(long, length=100)
    assert truncated.startswith("a" * 100)
    assert truncated.endswith("…")
    assert len(truncated) == 101


def test_fact_source_response_construction():
    resp = FactSourceResponse(
        fact_id=uuid.uuid4(),
        source_message_id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        role="user",
        content="Hello world",
        content_preview="Hello world",
        timestamp=datetime.utcnow(),
    )
    assert resp.content_preview == "Hello world"

import os
import json
import pytest
from starlette.requests import Request

# Dummy env to satisfy settings import paths if needed
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("OPENAI_API_KEY", "test-key")

from app.errors import MemoriError, RecallError
from app.main import memori_error_handler


def make_request(path: str = "/test") -> Request:
    scope = {
        "type": "http",
        "path": path,
        "method": "GET",
        "headers": [],
        "scheme": "http",
        "server": ("testserver", 80),
    }
    return Request(scope)


@pytest.mark.asyncio
async def test_memori_error_handler_shapes_payload():
    exc = MemoriError("Something went wrong", status_code=418, details={"foo": "bar"})
    response = await memori_error_handler(make_request(), exc)
    assert response.status_code == 418
    payload = json.loads(response.body.decode())
    assert payload["error"]["code"] == "internal_error"
    assert payload["error"]["message"] == "Something went wrong"
    assert payload["error"]["details"] == {"foo": "bar"}


@pytest.mark.asyncio
async def test_memori_error_handler_subclass():
    exc = RecallError("Recall failed", details={"reason": "timeout"})
    response = await memori_error_handler(make_request("/v1/recall"), exc)
    assert response.status_code == exc.status_code
    payload = json.loads(response.body.decode())
    assert payload["error"]["code"] == exc.code
    assert payload["error"]["message"] == "Recall failed"
    assert payload["error"]["details"]["reason"] == "timeout"

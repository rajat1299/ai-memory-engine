import os

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("OPENAI_API_KEY", "test-key")

from app.security import hash_api_key


def test_hash_api_key_is_deterministic():
    key = "secret-key"
    assert hash_api_key(key) == hash_api_key(key)

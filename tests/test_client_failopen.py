"""Test fail-open behavior for the Memoire client."""

from memoire.client import Memoire


def test_recall_fail_open_returns_empty():
    """When backend is unreachable, recall should return empty list (not raise)."""
    mem = Memoire(api_key="key", base_url="http://example.com")
    
    # Monkeypatch _client.post to raise
    def boom(*args, **kwargs):
        raise RuntimeError("Connection failed")
    
    mem._client.post = boom  # type: ignore
    facts = mem.recall(query="hi", user_id="u1")
    
    assert facts == []
    mem.close()


def test_ingest_fail_open_no_exception():
    """When backend is unreachable, ingest should not raise."""
    mem = Memoire(api_key="key", base_url="http://example.com")
    
    def boom(*args, **kwargs):
        raise RuntimeError("Connection failed")
    
    mem._client.post = boom  # type: ignore
    
    # Should not raise
    mem.ingest("user", "Hello", "u1", "s1")
    mem.close()

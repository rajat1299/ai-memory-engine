"""
Comprehensive tests for the Memoire SDK.
"""
import os
import pytest
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from typing import List

# Set dummy env vars before imports
os.environ.setdefault("MEMOIRE_API_KEY", "test-key")

from memoire import Memoire, MemoireAsync, Fact, MemoireError, MemoireConfigError
from memoire.utils import inject_context, format_facts_for_prompt
from memoire.config import Settings, default_headers
from memoire.constants import DEFAULT_BASE_URL, DEFAULT_TIMEOUT


# ============================================================================
# Configuration Tests
# ============================================================================

class TestSettings:
    def test_load_from_env(self, monkeypatch):
        monkeypatch.setenv("MEMOIRE_API_KEY", "env-key")
        monkeypatch.setenv("MEMOIRE_BASE_URL", "http://custom:9000")
        monkeypatch.setenv("MEMOIRE_TIMEOUT", "5.0")
        
        settings = Settings.load()
        
        assert settings.api_key == "env-key"
        assert settings.base_url == "http://custom:9000"
        assert settings.timeout == 5.0

    def test_explicit_params_override_env(self, monkeypatch):
        monkeypatch.setenv("MEMOIRE_API_KEY", "env-key")
        
        settings = Settings.load(api_key="explicit-key", base_url="http://explicit:8000")
        
        assert settings.api_key == "explicit-key"
        assert settings.base_url == "http://explicit:8000"

    def test_defaults_applied(self):
        settings = Settings.load(api_key="key")
        
        assert settings.base_url == DEFAULT_BASE_URL
        assert settings.timeout == DEFAULT_TIMEOUT


class TestDefaultHeaders:
    def test_includes_api_key(self):
        headers = default_headers("my-key")
        
        assert headers["X-API-Key"] == "my-key"
        assert headers["Content-Type"] == "application/json"
        assert "User-Agent" in headers

    def test_no_api_key_when_none(self):
        headers = default_headers(None)
        
        assert "X-API-Key" not in headers


# ============================================================================
# Utility Tests
# ============================================================================

class TestFormatFacts:
    def test_formats_with_temporal_state(self):
        facts = [
            Fact(category="biographical", content="Lives in Austin", confidence=0.9, temporal_state="current"),
            Fact(category="work_context", content="Works at OpenAI", confidence=0.8, temporal_state="past"),
        ]
        
        text = format_facts_for_prompt(facts)
        
        assert "[MEMOIRE CONTEXT]" in text
        assert "Lives in Austin (current)" in text
        assert "Works at OpenAI (past)" in text

    def test_empty_facts_returns_empty_string(self):
        assert format_facts_for_prompt([]) == ""


class TestInjectContext:
    def test_appends_to_existing_system_message(self):
        facts = [Fact(category="bio", content="Lives in Austin", confidence=0.9)]
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello!"}
        ]
        
        result = inject_context(messages, facts)
        
        assert result[0]["role"] == "system"
        assert "You are a helpful assistant." in result[0]["content"]
        assert "Lives in Austin" in result[0]["content"]

    def test_prepends_system_message_if_missing(self):
        facts = [Fact(category="bio", content="Lives in Austin", confidence=0.9)]
        messages = [{"role": "user", "content": "Hello!"}]
        
        result = inject_context(messages, facts)
        
        assert result[0]["role"] == "system"
        assert "MEMOIRE CONTEXT" in result[0]["content"]
        assert result[1]["role"] == "user"

    def test_no_modification_when_no_facts(self):
        messages = [{"role": "user", "content": "Hello!"}]
        
        result = inject_context(messages, [])
        
        assert result == messages


# ============================================================================
# Client Tests (Sync)
# ============================================================================

class TestMemoireClient:
    def test_init_with_explicit_params(self):
        client = Memoire(api_key="test-key", base_url="http://test:8000", timeout=3.0)
        
        assert client.settings.api_key == "test-key"
        assert client.settings.base_url == "http://test:8000"
        assert client.settings.timeout == 3.0
        
        client.close()

    def test_context_manager(self):
        with Memoire(api_key="test-key") as client:
            assert client.settings.api_key == "test-key"
        # Should not raise after exit

    def test_recall_fail_open_returns_empty(self):
        with Memoire(api_key="key", base_url="http://nonexistent:9999") as client:
            # Force failure by setting a very short timeout
            client._client = Mock()
            client._client.post.side_effect = Exception("Connection failed")
            
            facts = client.recall(query="test", user_id="u1")
            
            assert facts == []

    def test_recall_parses_response(self):
        with Memoire(api_key="key") as client:
            mock_response = Mock()
            mock_response.json.return_value = {
                "relevant_facts": [
                    {"category": "bio", "content": "Lives in Austin", "confidence": 0.9, "temporal_state": "current"}
                ]
            }
            mock_response.raise_for_status = Mock()
            client._client.post = Mock(return_value=mock_response)
            
            facts = client.recall(query="where do I live?", user_id="u1")
            
            assert len(facts) == 1
            assert facts[0].content == "Lives in Austin"

    def test_ingest_fail_open_no_exception(self):
        with Memoire(api_key="key") as client:
            client._client.post = Mock(side_effect=Exception("Failed"))
            
            # Should not raise
            client.ingest("user", "Hello", "u1", "s1")

    def test_wrap_unsupported_client_raises(self):
        with Memoire(api_key="key") as client:
            with pytest.raises(MemoireConfigError):
                client.wrap("not a client")


# ============================================================================
# Client Tests (Async)
# ============================================================================

class TestMemoireAsyncClient:
    @pytest.mark.asyncio
    async def test_async_context_manager(self):
        async with MemoireAsync(api_key="test-key") as client:
            assert client.settings.api_key == "test-key"

    @pytest.mark.asyncio
    async def test_async_recall_fail_open(self):
        async with MemoireAsync(api_key="key") as client:
            client._client.post = AsyncMock(side_effect=Exception("Failed"))
            
            facts = await client.recall(query="test", user_id="u1")
            
            assert facts == []

    @pytest.mark.asyncio
    async def test_async_ingest_fail_open(self):
        async with MemoireAsync(api_key="key") as client:
            client._client.post = AsyncMock(side_effect=Exception("Failed"))
            
            # Should not raise
            await client.ingest("user", "Hello", "u1", "s1")


# ============================================================================
# OpenAI Wrapper Tests
# ============================================================================

class TestOpenAIWrapper:
    def test_wrapper_forwards_non_chat_attrs(self):
        """Wrapper should forward attributes like .models, .embeddings to original client."""
        from memoire.wrappers.openai import MemoireOpenAIWrapper
        
        mock_openai = Mock()
        mock_openai.models = Mock()
        mock_openai.models.list.return_value = ["gpt-4"]
        
        memoire = Mock(spec=Memoire)
        wrapper = MemoireOpenAIWrapper(mock_openai, memoire)
        
        # Should forward to original
        result = wrapper.models.list()
        assert result == ["gpt-4"]

    def test_create_without_user_id_passes_through(self):
        """If no user= param, should pass through without memory."""
        from memoire.wrappers.openai import CompletionsProxy
        
        mock_completions = Mock()
        mock_completions.create.return_value = Mock(choices=[Mock(message=Mock(content="Hi!"))])
        
        memoire = Mock(spec=Memoire)
        proxy = CompletionsProxy(mock_completions, memoire)
        
        response = proxy.create(
            model="gpt-4",
            messages=[{"role": "user", "content": "Hello"}]
        )
        
        # recall should NOT be called (no user_id)
        memoire.recall.assert_not_called()
        mock_completions.create.assert_called_once()

    def test_create_with_user_id_recalls_and_injects(self):
        """With user= param, should recall facts and inject into context."""
        from memoire.wrappers.openai import CompletionsProxy
        
        mock_completions = Mock()
        mock_completions.create.return_value = Mock(choices=[Mock(message=Mock(content="Hi!"))])
        
        memoire = Mock(spec=Memoire)
        memoire.recall.return_value = [
            Fact(category="bio", content="Lives in Austin", confidence=0.9)
        ]
        
        proxy = CompletionsProxy(mock_completions, memoire)
        
        response = proxy.create(
            model="gpt-4",
            user="user-123",
            messages=[{"role": "user", "content": "Hello"}]
        )
        
        # recall should be called
        memoire.recall.assert_called_once()
        
        # Check that messages were modified to include facts
        call_kwargs = mock_completions.create.call_args[1]
        messages = call_kwargs.get("messages", [])
        assert any("MEMOIRE CONTEXT" in str(m.get("content", "")) for m in messages)

    def test_memoire_skip_bypasses_memory(self):
        """memoire_skip=True should bypass recall and ingest."""
        from memoire.wrappers.openai import CompletionsProxy
        
        mock_completions = Mock()
        mock_completions.create.return_value = Mock(choices=[Mock(message=Mock(content="Hi!"))])
        
        memoire = Mock(spec=Memoire)
        proxy = CompletionsProxy(mock_completions, memoire)
        
        response = proxy.create(
            model="gpt-4",
            user="user-123",
            memoire_skip=True,
            messages=[{"role": "user", "content": "Hello"}]
        )
        
        # recall should NOT be called
        memoire.recall.assert_not_called()
        memoire.ingest.assert_not_called()


# ============================================================================
# Fact Model Tests
# ============================================================================

class TestFactModel:
    def test_fact_defaults(self):
        fact = Fact(category="bio", content="Test", confidence=0.5)
        
        assert fact.temporal_state == "current"
        assert fact.source_message_id is None

    def test_fact_full_construction(self):
        fact = Fact(
            category="work_context",
            content="Works at Google",
            confidence=0.95,
            temporal_state="past",
            source_message_id="msg-123"
        )
        
        assert fact.category == "work_context"
        assert fact.temporal_state == "past"


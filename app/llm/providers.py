"""
LLM provider abstraction to enable BYOK across OpenAI, Anthropic, Gemini, etc.
Default is OpenAI; other providers can be wired in without touching call sites.
"""
import asyncio
import logging
from typing import Iterable, List, Sequence, TypeVar, Optional, Callable, Awaitable
from dataclasses import dataclass
from openai import AsyncOpenAI, APIError, RateLimitError, APIConnectionError, APITimeoutError
import instructor
from app.config import settings

logger = logging.getLogger(__name__)

ChatReturnT = TypeVar("ChatReturnT")


class LLMProvider:
    """
    Minimal interface for chat + embeddings.
    """
    async def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        raise NotImplementedError

    async def chat_structured(
        self,
        messages: Sequence[dict],
        response_model: type[ChatReturnT],
        model: Optional[str] = None,
    ) -> ChatReturnT:
        raise NotImplementedError


@dataclass
class _RetryConfig:
    retries: int = 3
    base_delay: float = 0.5


async def _with_retry(coro_fn: Callable[..., Awaitable], *args, config: _RetryConfig = _RetryConfig(), **kwargs):
    """
    Simple exponential backoff retry helper for transient OpenAI/connection errors.
    """
    for attempt in range(config.retries):
        try:
            return await coro_fn(*args, **kwargs)
        except (RateLimitError, APIError, APIConnectionError, APITimeoutError) as exc:
            if attempt == config.retries - 1:
                raise
            delay = config.base_delay * (2 ** attempt)
            logger.warning(f"LLM call transient error: {exc}; retrying in {delay:.2f}s ({attempt + 1}/{config.retries})")
            await asyncio.sleep(delay)


class OpenAIProvider(LLMProvider):
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required for OpenAI provider")
        self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY.get_secret_value())
        self._chat_client = instructor.from_openai(self._client)
        self._retry_cfg = _RetryConfig()

    async def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        response = await _with_retry(
            self._client.embeddings.create,
            model=settings.EMBEDDING_MODEL,
            input=list(texts),
            dimensions=settings.EMBEDDING_DIM,
            config=self._retry_cfg,
        )
        return [item.embedding for item in response.data]

    async def chat_structured(
        self,
        messages: Sequence[dict],
        response_model: type[ChatReturnT],
        model: Optional[str] = None,
    ) -> ChatReturnT:
        chat_model = model or settings.CHAT_MODEL
        return await _with_retry(
            self._chat_client.chat.completions.create,
            model=chat_model,
            response_model=response_model,
            messages=messages,
            config=self._retry_cfg,
        )


class AnthropicProvider(LLMProvider):
    """
    Placeholder for future Anthropic integration.
    """
    def __init__(self):
        raise NotImplementedError("Anthropic provider not yet implemented")


class GeminiProvider(LLMProvider):
    """
    Placeholder for future Gemini integration.
    """
    def __init__(self):
        raise NotImplementedError("Gemini provider not yet implemented")


_provider_singleton: Optional[LLMProvider] = None


def get_llm_provider() -> LLMProvider:
    global _provider_singleton
    if _provider_singleton:
        return _provider_singleton
    
    provider_name = settings.LLM_PROVIDER.lower()
    if provider_name == "openai":
        _provider_singleton = OpenAIProvider()
    elif provider_name == "anthropic":
        _provider_singleton = AnthropicProvider()
    elif provider_name == "gemini":
        _provider_singleton = GeminiProvider()
    else:
        raise ValueError(f"Unsupported LLM provider: {provider_name}")
    
    return _provider_singleton

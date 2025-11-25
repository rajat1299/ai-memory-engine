"""
LLM provider abstraction to enable BYOK across OpenAI, Anthropic, Gemini, etc.
Default is OpenAI; other providers can be wired in without touching call sites.
"""
import asyncio
import json
import logging
from typing import Iterable, List, Sequence, TypeVar, Optional, Callable, Awaitable
from dataclasses import dataclass
from openai import AsyncOpenAI, APIError, RateLimitError, APIConnectionError, APITimeoutError
from anthropic import AsyncAnthropic
import google.generativeai as genai
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
        instructor.patch(self._client)
        self._chat_client = self._client
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
    def __init__(self):
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY is required for Anthropic provider")
        self._client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY.get_secret_value())
        self._retry_cfg = _RetryConfig()

    async def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        """
        Anthropic does not yet expose embeddings; fallback to OpenAI embeddings if configured.
        """
        if not settings.OPENAI_API_KEY:
            raise ValueError("Embeddings not supported for Anthropic without OPENAI_API_KEY fallback")
        return await OpenAIProvider().embed_texts(texts)

    async def chat_structured(
        self,
        messages: Sequence[dict],
        response_model: type[ChatReturnT],
        model: Optional[str] = None,
    ) -> ChatReturnT:
        # Convert OpenAI-style messages to Anthropic format
        anthropic_messages = []
        system_prompts = []
        for m in messages:
            role = m.get("role")
            content = m.get("content", "")
            if role == "system":
                system_prompts.append(content)
            else:
                anthropic_messages.append({"role": role, "content": content})
        
        sys_prompt = "\n".join(system_prompts)
        user_prompt = "\n".join(
            f"{m['role']}: {m['content']}" for m in anthropic_messages
        ) + "\nReturn JSON only."
        model_name = model or settings.ANTHROPIC_MODEL
        resp = await _with_retry(
            self._client.messages.create,
            model=model_name,
            max_tokens=2048,
            system=sys_prompt,
            messages=[{"role": "user", "content": user_prompt}],
            config=self._retry_cfg,
        )
        text = resp.content[0].text if resp.content else ""
        return response_model.model_validate_json(text)


class GeminiProvider(LLMProvider):
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required for Gemini provider")
        genai.configure(api_key=settings.GEMINI_API_KEY.get_secret_value())
        self._retry_cfg = _RetryConfig()

    async def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        model = settings.GEMINI_EMBEDDING_MODEL
        embeddings: List[List[float]] = []
        for text in texts:
            resp = await _with_retry(
                genai.embed_content_async,
                model=model,
                content=text,
                config=self._retry_cfg,
            )
            embeddings.append(resp["embedding"])
        return embeddings

    async def chat_structured(
        self,
        messages: Sequence[dict],
        response_model: type[ChatReturnT],
        model: Optional[str] = None,
    ) -> ChatReturnT:
        model_name = model or settings.GEMINI_MODEL
        # Combine messages into a single prompt; instruct JSON output
        prompt_parts = []
        for m in messages:
            role = m.get("role")
            content = m.get("content", "")
            prompt_parts.append(f"{role.upper()}: {content}")
        prompt_parts.append("Return JSON matching the response schema.")
        prompt = "\n".join(prompt_parts)
        
        gen_model = genai.GenerativeModel(model_name)
        resp = await _with_retry(
            gen_model.generate_content_async,
            prompt,
            config=self._retry_cfg,
        )
        text = resp.text
        return response_model.model_validate_json(text)


class OpenRouterProvider(LLMProvider):
    def __init__(self):
        if not settings.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY is required for OpenRouter provider")
        self._client = AsyncOpenAI(
            api_key=settings.OPENROUTER_API_KEY.get_secret_value(),
            base_url="https://openrouter.ai/api/v1",
        )
        self._retry_cfg = _RetryConfig()

    def _extra_headers(self) -> dict:
        headers = {}
        if settings.OPENROUTER_SITE_URL:
            headers["HTTP-Referer"] = settings.OPENROUTER_SITE_URL
        if settings.OPENROUTER_SITE_NAME:
            headers["X-Title"] = settings.OPENROUTER_SITE_NAME
        return headers

    async def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        response = await _with_retry(
            self._client.embeddings.create,
            model=settings.OPENROUTER_EMBEDDING_MODEL,
            input=list(texts),
            extra_headers=self._extra_headers(),
            config=self._retry_cfg,
        )
        return [item.embedding for item in response.data]

    async def chat_structured(
        self,
        messages: Sequence[dict],
        response_model: type[ChatReturnT],
        model: Optional[str] = None,
    ) -> ChatReturnT:
        chat_model = model or settings.OPENROUTER_MODEL
        resp = await _with_retry(
            self._client.chat.completions.create,
            model=chat_model,
            messages=messages,
            response_format={"type": "json_object"},
            extra_headers=self._extra_headers(),
            config=self._retry_cfg,
        )
        choice = resp.choices[0]
        content = choice.message.content or "{}"
        return response_model.model_validate_json(content)


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
    elif provider_name == "openrouter":
        _provider_singleton = OpenRouterProvider()
    else:
        raise ValueError(f"Unsupported LLM provider: {provider_name}")
    
    return _provider_singleton

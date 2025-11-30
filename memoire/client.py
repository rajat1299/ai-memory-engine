"""
Mémoire SDK Client

Provides sync and async clients for the Mémoire memory engine.
Supports wrapping LLM clients (OpenAI, Anthropic) for automatic
memory recall and ingestion.
"""
import logging
from typing import Any, List, Optional

import httpx

from .config import Settings, default_headers
from .constants import RECALL_PATH, INGEST_PATH, TIMELINE_PATH, SESSIONS_PATH
from .exceptions import MemoireConfigError
from .types import Fact, RecallResponse, TimelineResponse

logger = logging.getLogger("memoire")


class Memoire:
    """
    Sync SDK entry point for the Mémoire Memory Engine.
    
    Example:
        >>> memoire = Memoire(api_key="memori_xxx")
        >>> facts = memoire.recall("Where do I live?", user_id="user-123")
        >>> memoire.ingest("user", "I live in Austin", "user-123", "session-1")
        
        # Or wrap an LLM client for automatic memory:
        >>> client = memoire.wrap(openai.OpenAI())
        >>> response = client.chat.completions.create(
        ...     model="gpt-4",
        ...     user="user-123",
        ...     messages=[{"role": "user", "content": "Hello!"}]
        ... )
    """

    def __init__(
        self, 
        api_key: Optional[str] = None, 
        base_url: Optional[str] = None, 
        timeout: Optional[float] = None
    ):
        """
        Initialize the Memoire client.
        
        Args:
            api_key: API key for authentication. Falls back to MEMOIRE_API_KEY env var.
            base_url: Backend URL. Falls back to MEMOIRE_BASE_URL or localhost:8000.
            timeout: Request timeout in seconds. Falls back to MEMOIRE_TIMEOUT or 2.0.
        """
        settings = Settings.load(api_key=api_key, base_url=base_url, timeout=timeout)
        if not settings.api_key:
            logger.warning("Memoire initialized without API Key. Most features will fail.")
        self.settings = settings
        self._client = httpx.Client(
            base_url=settings.base_url, 
            headers=default_headers(settings.api_key), 
            timeout=settings.timeout
        )

    def __enter__(self) -> "Memoire":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    def close(self) -> None:
        """Close the HTTP client and release resources."""
        self._client.close()

    def recall(
        self, 
        query: str, 
        user_id: str,
        limit: int = 5,
        include_historical: bool = False,
        **extra
    ) -> List[Fact]:
        """
        Retrieve relevant facts for a query.
        
        Args:
            query: The query to search for relevant facts.
            user_id: The user ID to retrieve facts for.
            limit: Maximum number of facts to return (default: 5).
            include_historical: Include past/superseded facts (default: False).
            **extra: Additional parameters passed to the recall API.
            
        Returns:
            List of relevant facts. Returns empty list on error (fail-open).
        """
        payload = {
            "query": query, 
            "user_id": user_id,
            "limit": limit,
            "include_historical": include_historical,
        }
        payload.update(extra)
        try:
            resp = self._client.post(RECALL_PATH, json=payload)
            resp.raise_for_status()
            data = RecallResponse(**resp.json())
            return data.relevant_facts
        except Exception as exc:
            logger.warning(f"Memoire recall failed (fail-open): {exc}")
            return []

    def ingest(self, role: str, content: str, user_id: str, session_id: str) -> None:
        """
        Ingest a message into the memory system.
        
        Args:
            role: Message role ("user" or "assistant").
            content: The message content.
            user_id: The user ID.
            session_id: The session ID for grouping messages.
        """
        payload = {
            "role": role, 
            "content": content, 
            "user_id": user_id, 
            "session_id": session_id
        }
        try:
            self._client.post(INGEST_PATH, json=payload, timeout=self.settings.timeout)
        except Exception as exc:
            logger.warning(f"Memoire ingest failed (fail-open): {exc}")

    def create_session(self, user_id: str) -> Optional[str]:
        """
        Create a new session for a user.
        
        Args:
            user_id: The user ID to create a session for.
            
        Returns:
            Session ID if successful, None on error.
        """
        try:
            resp = self._client.post(SESSIONS_PATH, json={"user_id": user_id})
            resp.raise_for_status()
            return resp.json().get("id")
        except Exception as exc:
            logger.warning(f"Memoire create_session failed (fail-open): {exc}")
            return None

    def timeline(
        self, 
        user_id: str, 
        category: Optional[str] = None, 
        slot_hint: Optional[str] = None, 
        include_historical: bool = True
    ) -> Optional[TimelineResponse]:
        """
        Retrieve timeline of facts (supersession history).
        
        Note: Requires backend timeline endpoint (coming soon).
        
        Args:
            user_id: The user ID.
            category: Filter by category (e.g., "biographical").
            slot_hint: Filter by slot (e.g., "location").
            include_historical: Include superseded facts.
            
        Returns:
            Timeline response or None on error.
        """
        params: dict = {"user_id": user_id, "include_historical": include_historical}
        if category:
            params["category"] = category
        if slot_hint:
            params["slot_hint"] = slot_hint
        try:
            resp = self._client.get(TIMELINE_PATH, params=params, timeout=self.settings.timeout)
            resp.raise_for_status()
            return TimelineResponse(**resp.json())
        except Exception as exc:
            logger.warning(f"Memoire timeline failed (fail-open): {exc}")
            return None

    def wrap(self, client: Any) -> Any:
        """
        Wrap an LLM client to add automatic memory capabilities.
        
        Currently supports:
        - openai.OpenAI (sync)
        - openai.AsyncOpenAI (async) - use MemoireAsync.wrap() instead
        
        Args:
            client: The LLM client to wrap.
            
        Returns:
            Wrapped client with memory capabilities.
            
        Raises:
            MemoireConfigError: If client type is not supported.
        """
        try:
            import openai

            if isinstance(client, openai.OpenAI):
                from .wrappers.openai import MemoireOpenAIWrapper
                return MemoireOpenAIWrapper(client, self)
            if isinstance(client, openai.AsyncOpenAI):
                from .wrappers.openai import MemoireAsyncOpenAIWrapper
                # Note: For AsyncOpenAI, user should use MemoireAsync
                logger.warning("Use MemoireAsync.wrap() for AsyncOpenAI clients")
                return MemoireAsyncOpenAIWrapper(client, MemoireAsync(
                    api_key=self.settings.api_key,
                    base_url=self.settings.base_url,
                    timeout=self.settings.timeout
                ))
        except ImportError:
            logger.debug("openai not installed; wrap() limited to available providers.")
        raise MemoireConfigError(f"Unsupported client type: {type(client)}. Install 'openai' package.")


class MemoireAsync:
    """
    Async SDK entry point for the Mémoire Memory Engine.
    
    Example:
        >>> async with MemoireAsync(api_key="memori_xxx") as memoire:
        ...     facts = await memoire.recall("Where do I live?", user_id="user-123")
        ...     client = memoire.wrap(openai.AsyncOpenAI())
        ...     response = await client.chat.completions.create(
        ...         model="gpt-4",
        ...         user="user-123",
        ...         messages=[{"role": "user", "content": "Hello!"}]
        ...     )
    """

    def __init__(
        self, 
        api_key: Optional[str] = None, 
        base_url: Optional[str] = None, 
        timeout: Optional[float] = None
    ):
        """Initialize the async Memoire client."""
        settings = Settings.load(api_key=api_key, base_url=base_url, timeout=timeout)
        if not settings.api_key:
            logger.warning("MemoireAsync initialized without API Key. Most features will fail.")
        self.settings = settings
        self._client = httpx.AsyncClient(
            base_url=settings.base_url, 
            headers=default_headers(settings.api_key), 
            timeout=settings.timeout
        )

    async def __aenter__(self) -> "MemoireAsync":
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        """Close the async HTTP client."""
        await self._client.aclose()

    async def recall(
        self, 
        query: str, 
        user_id: str,
        limit: int = 5,
        include_historical: bool = False,
        **extra
    ) -> List[Fact]:
        """Async retrieve relevant facts for a query."""
        payload = {
            "query": query, 
            "user_id": user_id,
            "limit": limit,
            "include_historical": include_historical,
        }
        payload.update(extra)
        try:
            resp = await self._client.post(RECALL_PATH, json=payload)
            resp.raise_for_status()
            data = RecallResponse(**resp.json())
            return data.relevant_facts
        except Exception as exc:
            logger.warning(f"Memoire async recall failed (fail-open): {exc}")
            return []

    async def ingest(self, role: str, content: str, user_id: str, session_id: str) -> None:
        """Async ingest a message into memory."""
        payload = {
            "role": role, 
            "content": content, 
            "user_id": user_id, 
            "session_id": session_id
        }
        try:
            await self._client.post(INGEST_PATH, json=payload, timeout=self.settings.timeout)
        except Exception as exc:
            logger.warning(f"Memoire async ingest failed (fail-open): {exc}")

    async def create_session(self, user_id: str) -> Optional[str]:
        """Async create a new session for a user."""
        try:
            resp = await self._client.post(SESSIONS_PATH, json={"user_id": user_id})
            resp.raise_for_status()
            return resp.json().get("id")
        except Exception as exc:
            logger.warning(f"Memoire async create_session failed (fail-open): {exc}")
            return None

    async def timeline(
        self, 
        user_id: str, 
        category: Optional[str] = None, 
        slot_hint: Optional[str] = None, 
        include_historical: bool = True
    ) -> Optional[TimelineResponse]:
        """Async retrieve timeline of facts."""
        params: dict = {"user_id": user_id, "include_historical": include_historical}
        if category:
            params["category"] = category
        if slot_hint:
            params["slot_hint"] = slot_hint
        try:
            resp = await self._client.get(TIMELINE_PATH, params=params, timeout=self.settings.timeout)
            resp.raise_for_status()
            return TimelineResponse(**resp.json())
        except Exception as exc:
            logger.warning(f"Memoire async timeline failed (fail-open): {exc}")
            return None

    def wrap(self, client: Any) -> Any:
        """Wrap an async LLM client for automatic memory."""
        try:
            import openai

            if isinstance(client, openai.AsyncOpenAI):
                from .wrappers.openai import MemoireAsyncOpenAIWrapper
                return MemoireAsyncOpenAIWrapper(client, self)
        except ImportError:
            logger.debug("openai not installed; wrap() limited to available providers.")
        raise MemoireConfigError(f"Unsupported client type: {type(client)}. Install 'openai' package.")

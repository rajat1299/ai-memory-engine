"""
Mémoire SDK Client

Provides sync and async clients for the Mémoire memory engine.
Supports wrapping LLM clients (OpenAI, Anthropic) for automatic
memory recall and ingestion.

Full Feature Parity with Backend:
- recall() - Semantic search with category/temporal filters
- ingest() - Store messages for fact extraction
- list_facts() - Get all facts for a user
- delete_fact() - Soft-delete a fact
- get_fact_source() - Get the source message for a fact
- get_conscious() - Get essential "working memory" facts
- consolidate() - Trigger memory optimization
- create_session() - Create a conversation session
- timeline() - Get fact history (coming soon)
"""
import logging
from typing import Any, List, Optional

import httpx

from .config import Settings, default_headers
from .constants import (
    RECALL_PATH, INGEST_PATH, SESSIONS_PATH, TIMELINE_PATH,
    FACTS_PATH, CONSCIOUS_PATH, CONSOLIDATE_PATH, FACT_SOURCE_PATH
)
from .exceptions import MemoireConfigError
from .types import (
    Fact, RecallResponse, TimelineResponse, FactsListResponse,
    ConsciousResponse, ConsolidationResponse, FactWithSource
)

logger = logging.getLogger("memoire")


class Memoire:
    """
    Sync SDK entry point for the Mémoire Memory Engine.
    
    Example:
        >>> memoire = Memoire(api_key="memori_xxx")
        >>> 
        >>> # Semantic recall with filters
        >>> facts = memoire.recall(
        ...     "Where do I work?",
        ...     user_id="user-123",
        ...     categories=["work_context"],
        ...     include_historical=True
        ... )
        >>> 
        >>> # Get essential facts (working memory)
        >>> conscious = memoire.get_conscious(user_id="user-123")
        >>> 
        >>> # List all facts
        >>> all_facts = memoire.list_facts(user_id="user-123")
        >>> 
        >>> # Trigger memory optimization
        >>> memoire.consolidate(user_id="user-123")
        >>> 
        >>> # Or wrap an LLM client for automatic memory:
        >>> client = memoire.wrap(openai.OpenAI())
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

    # =========================================================================
    # Core Memory Operations
    # =========================================================================

    def recall(
        self, 
        query: str, 
        user_id: str,
        limit: int = 5,
        categories: Optional[List[str]] = None,
        include_historical: bool = False,
        current_view_only: bool = True,
        max_age_days: Optional[int] = None,
    ) -> List[Fact]:
        """
        Retrieve relevant facts for a query using semantic search.
        
        Args:
            query: The query to search for relevant facts.
            user_id: The user ID to retrieve facts for.
            limit: Maximum number of facts to return (default: 5).
            categories: Filter by categories (e.g., ["biographical", "work_context"]).
            include_historical: Include past/superseded facts (default: False).
            current_view_only: Exclude superseded facts (default: True).
            max_age_days: Only return facts created within N days.
            
        Returns:
            List of relevant facts. Returns empty list on error (fail-open).
            
        Example:
            >>> facts = memoire.recall(
            ...     "What's my job?",
            ...     user_id="u-123",
            ...     categories=["work_context"],
            ...     include_historical=True  # Include past jobs
            ... )
        """
        payload: dict = {
            "query": query, 
            "user_id": user_id,
            "limit": limit,
            "include_historical": include_historical,
            "current_view_only": current_view_only,
        }
        if categories:
            payload["categories"] = categories
        if max_age_days is not None:
            payload["max_age_days"] = max_age_days
            
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
        
        Triggers the background extraction pipeline to parse facts
        from the conversation.
        
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

    def get_conscious(self, user_id: str, max_facts: int = 20) -> List[Fact]:
        """
        Get essential "working memory" facts for a user.
        
        These are high-confidence, frequently-used facts that should be
        included in every LLM context (e.g., name, location, preferences).
        
        Args:
            user_id: The user ID.
            max_facts: Maximum number of essential facts to return.
            
        Returns:
            List of essential facts. Returns empty list on error.
            
        Example:
            >>> conscious = memoire.get_conscious("user-123")
            >>> # Include in system prompt for every conversation
        """
        try:
            resp = self._client.get(
                f"{CONSCIOUS_PATH}/{user_id}",
                params={"max_facts": max_facts}
            )
            resp.raise_for_status()
            data = ConsciousResponse(**resp.json())
            return data.essential_facts
        except Exception as exc:
            logger.warning(f"Memoire get_conscious failed (fail-open): {exc}")
            return []

    # =========================================================================
    # Facts Management
    # =========================================================================

    def list_facts(
        self, 
        user_id: str, 
        limit: int = 100,
        category: Optional[str] = None,
    ) -> List[Fact]:
        """
        List all active facts for a user.
        
        Returns non-expired, non-superseded facts.
        
        Args:
            user_id: The user ID.
            limit: Maximum number of facts to return.
            category: Optional category filter.
            
        Returns:
            List of facts. Returns empty list on error.
            
        Example:
            >>> all_facts = memoire.list_facts("user-123")
            >>> work_facts = memoire.list_facts("user-123", category="work_context")
        """
        params: dict = {"limit": limit}
        if category:
            params["category"] = category
        try:
            resp = self._client.get(f"{FACTS_PATH}/{user_id}", params=params)
            resp.raise_for_status()
            data = FactsListResponse(**resp.json())
            return data.facts
        except Exception as exc:
            logger.warning(f"Memoire list_facts failed (fail-open): {exc}")
            return []

    def delete_fact(self, fact_id: str) -> bool:
        """
        Soft-delete a fact by expiring it.
        
        The fact remains in the database but won't be returned in queries.
        
        Args:
            fact_id: The fact UUID to delete.
            
        Returns:
            True if deleted successfully, False on error.
            
        Example:
            >>> success = memoire.delete_fact("fact-uuid-here")
        """
        try:
            resp = self._client.delete(f"{FACTS_PATH}/{fact_id}")
            resp.raise_for_status()
            return True
        except Exception as exc:
            logger.warning(f"Memoire delete_fact failed (fail-open): {exc}")
            return False

    def get_fact_source(self, fact_id: str) -> Optional[FactWithSource]:
        """
        Get the source message that a fact was extracted from.
        
        Useful for debugging extraction and providing transparency.
        
        Args:
            fact_id: The fact UUID.
            
        Returns:
            FactWithSource containing the original message, or None on error.
            
        Example:
            >>> source = memoire.get_fact_source("fact-uuid")
            >>> print(f"Extracted from: {source.content_preview}")
        """
        try:
            path = FACT_SOURCE_PATH.format(fact_id=fact_id)
            resp = self._client.get(path)
            resp.raise_for_status()
            return FactWithSource(**resp.json())
        except Exception as exc:
            logger.warning(f"Memoire get_fact_source failed (fail-open): {exc}")
            return None

    # =========================================================================
    # Memory Optimization
    # =========================================================================

    def consolidate(self, user_id: str) -> Optional[ConsolidationResponse]:
        """
        Trigger memory consolidation for a user.
        
        Consolidation:
        - Merges semantically duplicate facts
        - Promotes frequently-refreshed facts to essential
        - Generates a profile summary
        
        Runs as a background job. Use for periodic optimization or
        after bulk ingestion.
        
        Args:
            user_id: The user ID.
            
        Returns:
            ConsolidationResponse with job_id, or None on error.
            
        Example:
            >>> result = memoire.consolidate("user-123")
            >>> print(f"Job queued: {result.job_id}")
        """
        try:
            path = CONSOLIDATE_PATH.format(user_id=user_id)
            resp = self._client.post(path)
            resp.raise_for_status()
            return ConsolidationResponse(**resp.json())
        except Exception as exc:
            logger.warning(f"Memoire consolidate failed (fail-open): {exc}")
            return None

    # =========================================================================
    # Session Management
    # =========================================================================

    def create_session(self, user_id: str) -> Optional[str]:
        """
        Create a new conversation session for a user.
        
        Sessions group related messages together for extraction context.
        
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

    # =========================================================================
    # Timeline (Coming Soon)
    # =========================================================================

    def timeline(
        self, 
        user_id: str, 
        category: Optional[str] = None, 
        slot_hint: Optional[str] = None, 
        include_historical: bool = True
    ) -> Optional[TimelineResponse]:
        """
        Retrieve timeline of facts (supersession history).
        
        Shows how a fact evolved over time (e.g., location changes).
        
        Note: Requires backend /v1/timeline endpoint (coming soon).
        
        Args:
            user_id: The user ID.
            category: Filter by category (e.g., "biographical").
            slot_hint: Filter by slot (e.g., "location", "employer").
            include_historical: Include superseded facts.
            
        Returns:
            Timeline response or None on error.
            
        Example:
            >>> # "Where have I lived?"
            >>> timeline = memoire.timeline("user-123", slot_hint="location")
            >>> for event in timeline.history:
            ...     print(f"{event.content} ({event.valid_from} - {event.valid_until})")
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

    # =========================================================================
    # LLM Wrapper
    # =========================================================================

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
                logger.warning("Use MemoireAsync.wrap() for AsyncOpenAI clients")
                return MemoireAsyncOpenAIWrapper(client, MemoireAsync(
                    api_key=self.settings.api_key,
                    base_url=self.settings.base_url,
                    timeout=self.settings.timeout
                ))
        except ImportError:
            logger.debug("openai not installed; wrap() limited to available providers.")
        raise MemoireConfigError(f"Unsupported client type: {type(client)}. Install 'openai' package.")


# =============================================================================
# Async Client
# =============================================================================

class MemoireAsync:
    """
    Async SDK entry point for the Mémoire Memory Engine.
    
    Provides all the same methods as Memoire, but async.
    
    Example:
        >>> async with MemoireAsync(api_key="memori_xxx") as memoire:
        ...     facts = await memoire.recall("Where do I live?", user_id="user-123")
        ...     conscious = await memoire.get_conscious(user_id="user-123")
        ...     await memoire.consolidate(user_id="user-123")
    """

    def __init__(
        self, 
        api_key: Optional[str] = None, 
        base_url: Optional[str] = None, 
        timeout: Optional[float] = None
    ):
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
        await self._client.aclose()

    # =========================================================================
    # Core Memory Operations (Async)
    # =========================================================================

    async def recall(
        self, 
        query: str, 
        user_id: str,
        limit: int = 5,
        categories: Optional[List[str]] = None,
        include_historical: bool = False,
        current_view_only: bool = True,
        max_age_days: Optional[int] = None,
    ) -> List[Fact]:
        """Async semantic recall with full filter support."""
        payload: dict = {
            "query": query, 
            "user_id": user_id,
            "limit": limit,
            "include_historical": include_historical,
            "current_view_only": current_view_only,
        }
        if categories:
            payload["categories"] = categories
        if max_age_days is not None:
            payload["max_age_days"] = max_age_days
            
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

    async def get_conscious(self, user_id: str, max_facts: int = 20) -> List[Fact]:
        """Async get essential working memory facts."""
        try:
            resp = await self._client.get(
                f"{CONSCIOUS_PATH}/{user_id}",
                params={"max_facts": max_facts}
            )
            resp.raise_for_status()
            data = ConsciousResponse(**resp.json())
            return data.essential_facts
        except Exception as exc:
            logger.warning(f"Memoire async get_conscious failed (fail-open): {exc}")
            return []

    # =========================================================================
    # Facts Management (Async)
    # =========================================================================

    async def list_facts(
        self, 
        user_id: str, 
        limit: int = 100,
        category: Optional[str] = None,
    ) -> List[Fact]:
        """Async list all active facts for a user."""
        params: dict = {"limit": limit}
        if category:
            params["category"] = category
        try:
            resp = await self._client.get(f"{FACTS_PATH}/{user_id}", params=params)
            resp.raise_for_status()
            data = FactsListResponse(**resp.json())
            return data.facts
        except Exception as exc:
            logger.warning(f"Memoire async list_facts failed (fail-open): {exc}")
            return []

    async def delete_fact(self, fact_id: str) -> bool:
        """Async soft-delete a fact."""
        try:
            resp = await self._client.delete(f"{FACTS_PATH}/{fact_id}")
            resp.raise_for_status()
            return True
        except Exception as exc:
            logger.warning(f"Memoire async delete_fact failed (fail-open): {exc}")
            return False

    async def get_fact_source(self, fact_id: str) -> Optional[FactWithSource]:
        """Async get the source message for a fact."""
        try:
            path = FACT_SOURCE_PATH.format(fact_id=fact_id)
            resp = await self._client.get(path)
            resp.raise_for_status()
            return FactWithSource(**resp.json())
        except Exception as exc:
            logger.warning(f"Memoire async get_fact_source failed (fail-open): {exc}")
            return None

    # =========================================================================
    # Memory Optimization (Async)
    # =========================================================================

    async def consolidate(self, user_id: str) -> Optional[ConsolidationResponse]:
        """Async trigger memory consolidation."""
        try:
            path = CONSOLIDATE_PATH.format(user_id=user_id)
            resp = await self._client.post(path)
            resp.raise_for_status()
            return ConsolidationResponse(**resp.json())
        except Exception as exc:
            logger.warning(f"Memoire async consolidate failed (fail-open): {exc}")
            return None

    # =========================================================================
    # Session Management (Async)
    # =========================================================================

    async def create_session(self, user_id: str) -> Optional[str]:
        """Async create a new session for a user."""
        try:
            resp = await self._client.post(SESSIONS_PATH, json={"user_id": user_id})
            resp.raise_for_status()
            return resp.json().get("id")
        except Exception as exc:
            logger.warning(f"Memoire async create_session failed (fail-open): {exc}")
            return None

    # =========================================================================
    # Timeline (Async, Coming Soon)
    # =========================================================================

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

    # =========================================================================
    # LLM Wrapper (Async)
    # =========================================================================

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

import asyncio
import logging
import threading
from typing import Any, Dict, List, Optional, Union

from ..client import Memoire, MemoireAsync
from ..types import Fact
from ..utils import inject_context

logger = logging.getLogger("memoire")


def _fire_and_forget_sync(fn, *args):
    """Run a function in a background thread (fire-and-forget)."""
    thread = threading.Thread(target=fn, args=args, daemon=True)
    thread.start()


class MemoireOpenAIWrapper:
    """
    Sync wrapper for openai.OpenAI.
    Intercepts chat.completions.create to add recall/inject/ingest.
    
    Usage:
        memoire = Memoire(api_key="...")
        client = memoire.wrap(openai.OpenAI())
        response = client.chat.completions.create(
            model="gpt-4",
            user="user-123",  # Required for memory
            messages=[{"role": "user", "content": "Hello!"}]
        )
    """

    def __init__(self, client: Any, memoire: Memoire):
        self._client = client
        self._memoire = memoire
        self.chat = ChatProxy(client.chat, memoire)

    def __getattr__(self, name: str) -> Any:
        # Forward all other attributes to the original client
        return getattr(self._client, name)


class ChatProxy:
    """Proxy for client.chat namespace."""
    
    def __init__(self, chat_attr: Any, memoire: Memoire):
        self._chat = chat_attr
        self.completions = CompletionsProxy(chat_attr.completions, memoire)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._chat, name)


class CompletionsProxy:
    """Proxy for client.chat.completions namespace."""
    
    def __init__(self, completions_attr: Any, memoire: Memoire):
        self._completions = completions_attr
        self._memoire = memoire

    def create(self, *args, **kwargs) -> Any:
        """
        Intercept chat.completions.create:
        1. Recall relevant facts before LLM call
        2. Inject facts into system prompt
        3. Execute LLM call
        4. Ingest user + assistant messages (background)
        """
        user_id: Optional[str] = kwargs.get("user")
        session_id: str = kwargs.pop("memoire_session_id", "default-session")
        skip_memory: bool = kwargs.pop("memoire_skip", False)
        
        messages: List[Dict] = list(kwargs.get("messages", []))
        last_user_msg = next((m for m in reversed(messages) if m.get("role") == "user"), None)

        # Phase 1: RECALL (if user_id provided and not skipped)
        if user_id and last_user_msg and not skip_memory:
            facts = self._memoire.recall(query=last_user_msg.get("content", ""), user_id=user_id)
            if facts:
                kwargs["messages"] = inject_context(messages, facts)
                logger.debug(f"Injected {len(facts)} facts into context")

        # Phase 2: EXECUTE LLM call
        # Handle streaming separately
        if kwargs.get("stream"):
            return self._handle_streaming(kwargs, user_id, session_id, last_user_msg, skip_memory)
        
        response = self._completions.create(*args, **kwargs)

        # Phase 3: INGEST (background, fire-and-forget)
        if user_id and last_user_msg and not skip_memory:
            ai_content = ""
            if getattr(response, "choices", None) and response.choices:
                ai_content = response.choices[0].message.content or ""
            
            if ai_content:
                _fire_and_forget_sync(
                    self._memoire.ingest, "user", last_user_msg.get("content", ""), user_id, session_id
                )
                _fire_and_forget_sync(
                    self._memoire.ingest, "assistant", ai_content, user_id, session_id
                )

        return response

    def _handle_streaming(self, kwargs, user_id, session_id, last_user_msg, skip_memory):
        """Handle streaming responses by collecting chunks."""
        stream = self._completions.create(**kwargs)
        return StreamingResponseWrapper(
            stream, 
            self._memoire, 
            user_id, 
            session_id, 
            last_user_msg.get("content", "") if last_user_msg else "",
            skip_memory
        )

    def __getattr__(self, name: str) -> Any:
        return getattr(self._completions, name)


class StreamingResponseWrapper:
    """Wrapper for streaming responses that collects content for ingestion."""
    
    def __init__(self, stream, memoire: Memoire, user_id: Optional[str], 
                 session_id: str, user_content: str, skip_memory: bool):
        self._stream = stream
        self._memoire = memoire
        self._user_id = user_id
        self._session_id = session_id
        self._user_content = user_content
        self._skip_memory = skip_memory
        self._collected_content: List[str] = []

    def __iter__(self):
        return self

    def __next__(self):
        try:
            chunk = next(self._stream)
            # Collect content from delta
            if hasattr(chunk, "choices") and chunk.choices:
                delta = chunk.choices[0].delta
                if hasattr(delta, "content") and delta.content:
                    self._collected_content.append(delta.content)
            return chunk
        except StopIteration:
            # Stream finished, ingest collected content
            self._finalize()
            raise

    def _finalize(self):
        """Ingest after stream completes."""
        if self._skip_memory or not self._user_id:
            return
        
        ai_content = "".join(self._collected_content)
        if ai_content and self._user_content:
            _fire_and_forget_sync(
                self._memoire.ingest, "user", self._user_content, self._user_id, self._session_id
            )
            _fire_and_forget_sync(
                self._memoire.ingest, "assistant", ai_content, self._user_id, self._session_id
            )


class MemoireAsyncOpenAIWrapper:
    """
    Async wrapper for openai.AsyncOpenAI.
    
    Usage:
        memoire = MemoireAsync(api_key="...")
        client = memoire.wrap(openai.AsyncOpenAI())
        response = await client.chat.completions.create(
            model="gpt-4",
            user="user-123",
            messages=[{"role": "user", "content": "Hello!"}]
        )
    """

    def __init__(self, client: Any, memoire: MemoireAsync):
        self._client = client
        self._memoire = memoire
        self.chat = AsyncChatProxy(client.chat, memoire)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._client, name)


class AsyncChatProxy:
    """Async proxy for client.chat namespace."""
    
    def __init__(self, chat_attr: Any, memoire: MemoireAsync):
        self._chat = chat_attr
        self.completions = AsyncCompletionsProxy(chat_attr.completions, memoire)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._chat, name)


class AsyncCompletionsProxy:
    """Async proxy for client.chat.completions namespace."""
    
    def __init__(self, completions_attr: Any, memoire: MemoireAsync):
        self._completions = completions_attr
        self._memoire = memoire

    async def create(self, *args, **kwargs) -> Any:
        """
        Async intercept of chat.completions.create.
        """
        user_id: Optional[str] = kwargs.get("user")
        session_id: str = kwargs.pop("memoire_session_id", "default-session")
        skip_memory: bool = kwargs.pop("memoire_skip", False)
        
        messages: List[Dict] = list(kwargs.get("messages", []))
        last_user_msg = next((m for m in reversed(messages) if m.get("role") == "user"), None)

        # Phase 1: RECALL
        if user_id and last_user_msg and not skip_memory:
            facts = await self._memoire.recall(query=last_user_msg.get("content", ""), user_id=user_id)
            if facts:
                kwargs["messages"] = inject_context(messages, facts)
                logger.debug(f"Injected {len(facts)} facts into context (async)")

        # Phase 2: EXECUTE
        if kwargs.get("stream"):
            return await self._handle_streaming(kwargs, user_id, session_id, last_user_msg, skip_memory)
        
        response = await self._completions.create(*args, **kwargs)

        # Phase 3: INGEST (background tasks)
        if user_id and last_user_msg and not skip_memory:
            ai_content = ""
            if getattr(response, "choices", None) and response.choices:
                ai_content = response.choices[0].message.content or ""
            
            if ai_content:
                # Fire-and-forget async tasks
                asyncio.create_task(
                    self._memoire.ingest("user", last_user_msg.get("content", ""), user_id, session_id)
                )
                asyncio.create_task(
                    self._memoire.ingest("assistant", ai_content, user_id, session_id)
                )

        return response

    async def _handle_streaming(self, kwargs, user_id, session_id, last_user_msg, skip_memory):
        """Handle async streaming responses."""
        stream = await self._completions.create(**kwargs)
        return AsyncStreamingResponseWrapper(
            stream,
            self._memoire,
            user_id,
            session_id,
            last_user_msg.get("content", "") if last_user_msg else "",
            skip_memory
        )

    def __getattr__(self, name: str) -> Any:
        return getattr(self._completions, name)


class AsyncStreamingResponseWrapper:
    """Async wrapper for streaming responses."""
    
    def __init__(self, stream, memoire: MemoireAsync, user_id: Optional[str],
                 session_id: str, user_content: str, skip_memory: bool):
        self._stream = stream
        self._memoire = memoire
        self._user_id = user_id
        self._session_id = session_id
        self._user_content = user_content
        self._skip_memory = skip_memory
        self._collected_content: List[str] = []

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            chunk = await self._stream.__anext__()
            if hasattr(chunk, "choices") and chunk.choices:
                delta = chunk.choices[0].delta
                if hasattr(delta, "content") and delta.content:
                    self._collected_content.append(delta.content)
            return chunk
        except StopAsyncIteration:
            await self._finalize()
            raise

    async def _finalize(self):
        """Ingest after stream completes."""
        if self._skip_memory or not self._user_id:
            return
        
        ai_content = "".join(self._collected_content)
        if ai_content and self._user_content:
            asyncio.create_task(
                self._memoire.ingest("user", self._user_content, self._user_id, self._session_id)
            )
            asyncio.create_task(
                self._memoire.ingest("assistant", ai_content, self._user_id, self._session_id)
            )

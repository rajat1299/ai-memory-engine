"""
Mémoire Python SDK

A lightweight SDK for the Mémoire memory engine. Wrap your LLM clients
to add long-term memory with automatic recall and ingestion.

Quick Start:
    >>> from memoire import Memoire
    >>> import openai
    >>>
    >>> memoire = Memoire(api_key="memori_xxx")
    >>> client = memoire.wrap(openai.OpenAI())
    >>>
    >>> # Memory is now automatic!
    >>> response = client.chat.completions.create(
    ...     model="gpt-4",
    ...     user="user-123",
    ...     messages=[{"role": "user", "content": "Remember I live in Austin"}]
    ... )
"""
from .client import Memoire, MemoireAsync
from .types import Fact, RecallResponse, TimelineResponse, TimelineEvent
from .exceptions import MemoireError, MemoireConnectionError, MemoireConfigError
from .constants import VERSION

__version__ = VERSION
__all__ = [
    # Core clients
    "Memoire",
    "MemoireAsync",
    # Types
    "Fact",
    "RecallResponse",
    "TimelineResponse",
    "TimelineEvent",
    # Exceptions
    "MemoireError",
    "MemoireConnectionError",
    "MemoireConfigError",
    # Version
    "__version__",
]

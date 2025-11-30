"""
Mémoire Python SDK

A full-featured SDK for the Mémoire memory engine. Wrap your LLM clients
to add long-term memory with automatic recall and ingestion.

Quick Start (Auto-Memory):
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

Power User API:
    >>> # Semantic recall with filters
    >>> facts = memoire.recall("work history", user_id="u-123", categories=["work_context"])
    >>>
    >>> # Essential "working memory" facts
    >>> conscious = memoire.get_conscious(user_id="u-123")
    >>>
    >>> # List/delete facts programmatically
    >>> all_facts = memoire.list_facts(user_id="u-123")
    >>> memoire.delete_fact(fact_id="fact-uuid")
    >>>
    >>> # Trigger memory optimization
    >>> memoire.consolidate(user_id="u-123")
"""
from .client import Memoire, MemoireAsync
from .types import (
    Fact, 
    FactWithSource,
    RecallResponse, 
    FactsListResponse,
    ConsciousResponse,
    ConsolidationResponse,
    TimelineResponse, 
    TimelineEvent,
    FactCategory,
)
from .exceptions import MemoireError, MemoireConnectionError, MemoireConfigError
from .constants import VERSION

__version__ = VERSION
__all__ = [
    # Core clients
    "Memoire",
    "MemoireAsync",
    # Fact types
    "Fact",
    "FactWithSource",
    "FactCategory",
    # Response types
    "RecallResponse",
    "FactsListResponse",
    "ConsciousResponse",
    "ConsolidationResponse",
    "TimelineResponse",
    "TimelineEvent",
    # Exceptions
    "MemoireError",
    "MemoireConnectionError",
    "MemoireConfigError",
    # Version
    "__version__",
]

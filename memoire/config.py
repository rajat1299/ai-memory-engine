import os
from dataclasses import dataclass
from typing import Optional

from .constants import DEFAULT_BASE_URL, DEFAULT_TIMEOUT, USER_AGENT


@dataclass
class Settings:
    api_key: Optional[str]
    base_url: str
    timeout: float

    @classmethod
    def load(cls, api_key: Optional[str] = None, base_url: Optional[str] = None, timeout: Optional[float] = None) -> "Settings":
        return cls(
            api_key=api_key or os.getenv("MEMOIRE_API_KEY"),
            base_url=base_url or os.getenv("MEMOIRE_BASE_URL", DEFAULT_BASE_URL),
            timeout=timeout if timeout is not None else float(os.getenv("MEMOIRE_TIMEOUT", DEFAULT_TIMEOUT)),
        )


def default_headers(api_key: Optional[str]) -> dict:
    headers = {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
    }
    if api_key:
        headers["X-API-Key"] = api_key
    return headers

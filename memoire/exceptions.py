class MemoireError(Exception):
    """Base SDK error."""


class MemoireConnectionError(MemoireError):
    """Raised when the backend cannot be reached."""


class MemoireConfigError(MemoireError):
    """Raised when required configuration is missing."""

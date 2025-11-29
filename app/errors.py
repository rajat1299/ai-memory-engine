"""
Application error taxonomy and response helpers.
"""
from fastapi import status


class MemoriError(Exception):
    """
    Base application error with optional HTTP status and details payload.
    """
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    code: str = "internal_error"

    def __init__(self, message: str, *, status_code: int | None = None, details: dict | None = None):
        super().__init__(message)
        if status_code is not None:
            self.status_code = status_code
        self.details = details or {}

    @property
    def message(self) -> str:
        return str(self)


class AuthError(MemoriError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "unauthorized"


class ForbiddenError(MemoriError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "forbidden"


class NotFoundError(MemoriError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"


class RateLimitError(MemoriError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    code = "rate_limit_exceeded"


class RecallError(MemoriError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    code = "recall_unavailable"


class ExtractionError(MemoriError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    code = "extraction_unavailable"

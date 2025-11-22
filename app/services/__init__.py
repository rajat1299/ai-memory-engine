"""
Services package - Business logic layer
All business logic should live in services, not routes.
"""
from app.services.ingestion import IngestionService

__all__ = ["IngestionService"]

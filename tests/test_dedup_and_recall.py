import os
import pytest
import uuid
from pydantic import ValidationError

# Provide dummy env vars so Settings() loads in test imports.
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("OPENAI_API_KEY", "test-key")

from app.models import MemoryFact, FactCategory, TemporalState
from app.worker.tasks import (
    _is_fuzzy_duplicate,
    _same_slot,
    _supersedable_category,
    normalize_fact,
    ExtractedFact,
    MIN_CONFIDENCE_TO_SAVE,
    _cosine_similarity,
    _find_semantic_duplicate_clusters,
    SEMANTIC_DUPLICATE_THRESHOLD,
)
from app.api.recall import _fuzzy_score, _is_generic_query


def test_fuzzy_duplicate_catches_rephrased_fact():
    existing = ["Lives in SF"]
    assert _is_fuzzy_duplicate(existing, "Resides in San Francisco") is True
    assert _is_fuzzy_duplicate(existing, "Prefers Python over Java") is False


@pytest.mark.parametrize(
    "query,content_a,conf_a,content_b,conf_b",
    [
        (
            "loves hiking",
            "Loves hiking in the Bay Area",
            0.5,
            "Enjoys cooking Italian food",
            0.9,
        ),
        (
            "works at Acme Corp",
            "Works at ACME corporation",
            0.6,
            "Vacationed in Spain",
            1.0,
        ),
    ],
)
def test_fuzzy_score_prefers_semantic_match(query, content_a, conf_a, content_b, conf_b):
    score_a, _ = _fuzzy_score(query, content_a, conf_a)
    score_b, _ = _fuzzy_score(query, content_b, conf_b)
    assert score_a > score_b


def test_same_slot_uses_slot_hint():
    fact = MemoryFact(
        user_id=uuid.uuid4(),
        category=FactCategory.WORK_CONTEXT,
        content="Works at Microsoft",
        confidence_score=0.8,
        slot_hint="employer",
    )
    assert _same_slot(fact, FactCategory.WORK_CONTEXT, "employer") is True
    assert _same_slot(fact, FactCategory.WORK_CONTEXT, "project") is False
    # legacy data without slot_hint should be treated as same slot
    fact.slot_hint = None
    assert _same_slot(fact, FactCategory.WORK_CONTEXT, "employer") is True
    # new fact without slot supersedes whole category
    assert _same_slot(fact, FactCategory.WORK_CONTEXT, None) is True
    # different category should never match
    assert _same_slot(fact, FactCategory.BIOGRAPHICAL, "employer") is False


def test_work_context_is_supersedable():
    assert _supersedable_category(FactCategory.WORK_CONTEXT) is True


def test_normalize_fact_applies_expected_patterns():
    assert normalize_fact("Austin", FactCategory.BIOGRAPHICAL).startswith("Lives")
    assert normalize_fact("Google", FactCategory.WORK_CONTEXT).startswith("Works at")
    assert normalize_fact("backend developer", FactCategory.WORK_CONTEXT).startswith("Is a")


def test_extracted_fact_validator_blocks_questions_and_too_short():
    with pytest.raises(ValidationError):
        ExtractedFact(
            category=FactCategory.BIOGRAPHICAL,
            slot_hint=None,
            content="Name?",
            confidence=0.9,
        )
    with pytest.raises(ValidationError):
        ExtractedFact(
            category=FactCategory.USER_PREFERENCE,
            slot_hint=None,
            content="Hi",
            confidence=0.9,
        )


def test_min_confidence_threshold_constant():
    assert MIN_CONFIDENCE_TO_SAVE == 0.5


# ============================================================================
# Temporal Awareness Tests
# ============================================================================

def test_temporal_state_enum_values():
    """Verify TemporalState enum has expected values."""
    assert TemporalState.CURRENT.value == "current"
    assert TemporalState.PAST.value == "past"
    assert TemporalState.FUTURE.value == "future"
    assert TemporalState.RECURRING.value == "recurring"


def test_extracted_fact_with_temporal_state():
    """Verify ExtractedFact accepts temporal_state field."""
    fact = ExtractedFact(
        category=FactCategory.BIOGRAPHICAL,
        slot_hint="location",
        temporal_state=TemporalState.CURRENT,
        content="Lives in Austin",
        confidence=0.9,
    )
    assert fact.temporal_state == TemporalState.CURRENT
    
    # Test past temporal state
    past_fact = ExtractedFact(
        category=FactCategory.WORK_CONTEXT,
        slot_hint="employer",
        temporal_state=TemporalState.PAST,
        content="Previously worked at Google",
        confidence=0.85,
    )
    assert past_fact.temporal_state == TemporalState.PAST


def test_extracted_fact_defaults_to_current():
    """Verify temporal_state defaults to current if not specified."""
    fact = ExtractedFact(
        category=FactCategory.USER_PREFERENCE,
        slot_hint="hobby",
        content="Enjoys rock climbing",
        confidence=0.8,
    )
    assert fact.temporal_state == TemporalState.CURRENT


def test_memory_fact_temporal_state_field_exists():
    """Verify MemoryFact has temporal_state field."""
    fact = MemoryFact(
        user_id=uuid.uuid4(),
        category=FactCategory.BIOGRAPHICAL,
        content="Lives in Seattle",
        confidence_score=0.9,
        temporal_state="current",  # Explicitly set since default applies at DB flush
    )
    assert fact.temporal_state == "current"
    
    # Test with past state
    past_fact = MemoryFact(
        user_id=uuid.uuid4(),
        category=FactCategory.WORK_CONTEXT,
        content="Previously worked at Google",
        confidence_score=0.85,
        temporal_state="past",
    )
    assert past_fact.temporal_state == "past"


# ============================================================================
# Generic Query Detection
# ============================================================================

@pytest.mark.parametrize(
    "query",
    [
        # Basic forms
        "Tell me about myself",
        "Tell me about me",
        "What do you know about me",
        "What should you know about me",
        "Who am I",
        "Summarize my profile",
        # With prefixes/suffixes (relaxed matching)
        "Can you tell me about myself?",
        "Please tell me about me",
        "Hey, who am i?",
        "Could you summarize my information?",
        "What do you remember about me?",
        "Show me my profile",
        "Give me my summary",
        "Describe me please",
        "Everything you know about me",
    ],
)
def test_is_generic_query_matches(query):
    assert _is_generic_query(query) is True


@pytest.mark.parametrize(
    "query",
    [
        "Where do I live?",
        "What is my job?",
        "Do you remember my partner?",
        "What company do I work for?",
        "What are my hobbies?",
    ],
)
def test_is_generic_query_non_generic(query):
    assert _is_generic_query(query) is False


# ============================================================================
# Multi-Session Consolidation Tests
# ============================================================================

def test_cosine_similarity_identical_vectors():
    """Identical vectors should have similarity of 1.0."""
    vec = [0.1, 0.2, 0.3, 0.4, 0.5]
    assert abs(_cosine_similarity(vec, vec) - 1.0) < 0.0001


def test_cosine_similarity_orthogonal_vectors():
    """Orthogonal vectors should have similarity of 0.0."""
    vec_a = [1.0, 0.0, 0.0]
    vec_b = [0.0, 1.0, 0.0]
    assert abs(_cosine_similarity(vec_a, vec_b)) < 0.0001


def test_cosine_similarity_opposite_vectors():
    """Opposite vectors should have similarity of -1.0."""
    vec_a = [1.0, 0.0, 0.0]
    vec_b = [-1.0, 0.0, 0.0]
    assert abs(_cosine_similarity(vec_a, vec_b) - (-1.0)) < 0.0001


def test_semantic_duplicate_threshold_is_high():
    """Threshold should be high enough to avoid false positives."""
    assert SEMANTIC_DUPLICATE_THRESHOLD >= 0.9


def test_find_semantic_duplicate_clusters_empty_input():
    """Empty input should return empty list."""
    result = _find_semantic_duplicate_clusters([])
    assert result == []


def test_find_semantic_duplicate_clusters_no_embeddings():
    """Facts without embeddings should be skipped."""
    facts = [
        MemoryFact(
            user_id=uuid.uuid4(),
            category=FactCategory.BIOGRAPHICAL,
            content="Lives in Austin",
            confidence_score=0.9,
            embedding=None,
        ),
        MemoryFact(
            user_id=uuid.uuid4(),
            category=FactCategory.BIOGRAPHICAL,
            content="Lives in Texas",
            confidence_score=0.9,
            embedding=None,
        ),
    ]
    result = _find_semantic_duplicate_clusters(facts)
    assert result == []


def test_find_semantic_duplicate_clusters_different_categories():
    """Facts in different categories should not be clustered together."""
    user_id = uuid.uuid4()
    # Same embedding, different categories
    embedding = [0.1] * 1536
    facts = [
        MemoryFact(
            user_id=user_id,
            category=FactCategory.BIOGRAPHICAL,
            content="Lives in Austin",
            confidence_score=0.9,
            embedding=embedding,
        ),
        MemoryFact(
            user_id=user_id,
            category=FactCategory.WORK_CONTEXT,  # Different category
            content="Works in Austin",
            confidence_score=0.9,
            embedding=embedding,
        ),
    ]
    result = _find_semantic_duplicate_clusters(facts)
    # Should not cluster because categories differ
    assert result == []


def test_find_semantic_duplicate_clusters_finds_duplicates():
    """Identical embeddings in same category should be clustered."""
    user_id = uuid.uuid4()
    embedding = [0.1] * 1536
    facts = [
        MemoryFact(
            user_id=user_id,
            category=FactCategory.BIOGRAPHICAL,
            content="Lives in Austin",
            confidence_score=0.9,
            embedding=embedding,
        ),
        MemoryFact(
            user_id=user_id,
            category=FactCategory.BIOGRAPHICAL,
            content="Resides in Austin, Texas",
            confidence_score=0.85,
            embedding=embedding,  # Same embedding = same meaning
        ),
    ]
    result = _find_semantic_duplicate_clusters(facts)
    assert len(result) == 1
    assert len(result[0]) == 2

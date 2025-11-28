import os
import pytest
import uuid

# Provide dummy env vars so Settings() loads in test imports.
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("OPENAI_API_KEY", "test-key")

from app.models import MemoryFact, FactCategory
from app.worker.tasks import _is_fuzzy_duplicate, _same_slot, _supersedable_category
from app.api.recall import _fuzzy_score


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

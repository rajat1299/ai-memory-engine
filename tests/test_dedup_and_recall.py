import pytest

from app.worker.tasks import _is_fuzzy_duplicate
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

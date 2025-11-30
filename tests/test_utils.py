from memoire.types import Fact
from memoire.utils import inject_context, format_facts_for_prompt


def test_format_facts_for_prompt_includes_temporal_state():
    facts = [
        Fact(category="biographical", content="Lives in Austin", confidence=0.9, temporal_state="current"),
        Fact(category="work_context", content="Works at OpenAI", confidence=0.8, temporal_state="past"),
    ]
    text = format_facts_for_prompt(facts)
    assert "Lives in Austin" in text
    assert "Works at OpenAI" in text
    assert "past" in text


def test_inject_context_prepends_system_if_missing():
    facts = [Fact(category="biographical", content="Lives in Austin", confidence=0.9, temporal_state="current")]
    messages = [{"role": "user", "content": "Hello"}]
    injected = inject_context(messages, facts)
    assert injected[0]["role"] == "system"
    assert "MEMOIRE CONTEXT" in injected[0]["content"]

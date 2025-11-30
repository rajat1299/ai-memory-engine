from typing import List
from .types import Fact

CONTEXT_TEMPLATE = "[MEMOIRE CONTEXT]\n{facts}\n[/MEMOIRE CONTEXT]"


def format_facts_for_prompt(facts: List[Fact]) -> str:
    if not facts:
        return ""
    fact_lines = []
    for fact in facts:
        temporal = fact.temporal_state if fact.temporal_state else "current"
        fact_lines.append(f"- {fact.content} ({temporal})")
    return CONTEXT_TEMPLATE.format(facts="\n".join(fact_lines))


def inject_context(messages: list[dict], facts: List[Fact]) -> list[dict]:
    """Injects facts into the first system message or prepends one."""
    context_block = format_facts_for_prompt(facts)
    if not context_block:
        return messages
    for msg in messages:
        if msg.get("role") == "system":
            msg["content"] = msg.get("content", "") + "\n\n" + context_block
            return messages
    return [{"role": "system", "content": context_block}] + messages

## Supersession & Temporal Awareness

### What is Supersession?

When new information contradicts old information, Mémoire automatically marks the old fact as **superseded**:

```
Day 1: "I live in San Francisco" → Stored as current
Day 30: "I just moved to Austin" → 
  • New fact stored as current
  • Old fact marked: superseded_by = new_fact_id
```

### Slot-Based Supersession

Supersession is **slot-aware** — only facts in the same semantic slot are superseded:

```
Fact 1: "Works at Google" (slot: employer)
Fact 2: "Is a product manager" (slot: role)
Fact 3: "Works at OpenAI" (slot: employer)

Result:
• Fact 1 superseded by Fact 3 (same slot: employer)
• Fact 2 remains current (different slot: role)
```

Without slot awareness, Fact 3 would incorrectly supersede both!

### Temporal States

Facts have a `temporal_state` field:

| State | Meaning | Example |
|-------|---------|---------|
| `current` | True now | "Lives in Austin" |
| `past` | Was true before | "Previously lived in SF" |
| `future` | Will be true | "Moving to NYC next month" |
| `recurring` | Periodic | "Goes hiking every weekend" |

### Querying with Temporal Awareness

```python
# Default: Only current facts
facts = memoire.recall("Where do I live?", user_id="user-123")
# Returns: "Lives in Austin"

# Include historical facts
facts = memoire.recall(
    "Where have I lived?",
    user_id="user-123",
    include_historical=True
)
# Returns: "Lives in Austin", "Previously lived in SF"
```

### The Current View

By default, recall returns the **current view** — only non-superseded, non-past facts:

```python
# current_view_only=True (default)
facts = memoire.recall(query, user_id, current_view_only=True)
```

Set `current_view_only=False` to include superseded facts (useful for debugging).

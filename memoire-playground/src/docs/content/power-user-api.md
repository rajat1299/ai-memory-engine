## Power User API

Full programmatic control over memory operations:

### Recall

```python
from memoire import Memoire, FactCategory

memoire = Memoire(api_key="memori_xxx")

# Basic recall
facts = memoire.recall(
    query="What's my job?",
    user_id="user-123"
)

# With filters
facts = memoire.recall(
    query="work history",
    user_id="user-123",
    limit=10,
    categories=[FactCategory.WORK_CONTEXT],
    include_historical=True,  # Include past jobs
    current_view_only=False,  # Include superseded
    max_age_days=365          # Last year only
)

for fact in facts:
    print(f"[{fact.category}] {fact.content}")
    print(f"  Confidence: {fact.confidence}")
    print(f"  Temporal: {fact.temporal_state}")
    print(f"  Slot: {fact.slot_hint}")
```

### Ingest

```python
# Create a session first
session_id = memoire.create_session(user_id="user-123")

# Ingest messages
memoire.ingest(
    role="user",
    content="I'm starting a new job at Apple next week",
    user_id="user-123",
    session_id=session_id
)

memoire.ingest(
    role="assistant",
    content="Congratulations on the new role at Apple!",
    user_id="user-123",
    session_id=session_id
)
```

### Conscious Memory

Get essential facts for a user (always-include context):

```python
essential = memoire.get_conscious(user_id="user-123", max_facts=10)

for fact in essential:
    print(f"Essential: {fact.content}")
```

### Facts Management

```python
# List all facts
all_facts = memoire.list_facts(user_id="user-123")

# Filter by category
work_facts = memoire.list_facts(
    user_id="user-123",
    category=FactCategory.WORK_CONTEXT
)

# Delete a fact
success = memoire.delete_fact(fact_id="fact-uuid")

# Get source message for a fact
source = memoire.get_fact_source(fact_id="fact-uuid")
if source:
    print(f"Extracted from: {source.content_preview}")
```

### Memory Consolidation

Trigger optimization manually:

```python
result = memoire.consolidate(user_id="user-123")
print(f"Consolidation job: {result.job_id}")

# Consolidation:
# - Merges semantically duplicate facts
# - Promotes frequently-used facts to essential
# - Generates a profile summary
```

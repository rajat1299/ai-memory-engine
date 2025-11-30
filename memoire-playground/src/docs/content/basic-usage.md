## Basic Usage

Learn Mémoire's core concepts with practical examples.

### Core Workflow

```
User Message → Ingest → Extract Facts → Store with Embeddings
                                              ↓
User Query → Recall (Vector + Fuzzy Search) → Inject Context → LLM Response
```

### Method 1: SDK Wrapper (Recommended)

The easiest way — wrap your LLM client and memory is automatic:

```python
from memoire import Memoire
import openai

memoire = Memoire(api_key="memori_xxx")
client = memoire.wrap(openai.OpenAI())

# Every conversation is automatically:
# 1. Checked for relevant memories (recall)
# 2. Enhanced with context (injection)
# 3. Recorded for future use (ingest)

response = client.chat.completions.create(
    model="gpt-4",
    user="user-123",  # REQUIRED: identifies the user
    messages=[{"role": "user", "content": "I love hiking and photography"}]
)
```

### Method 2: Direct SDK Calls

For fine-grained control:

```python
from memoire import Memoire

memoire = Memoire(api_key="memori_xxx")

# Create a session for this conversation
session_id = memoire.create_session(user_id="user-123")

# Manually ingest a message
memoire.ingest(
    role="user",
    content="I'm learning machine learning",
    user_id="user-123",
    session_id=session_id
)

# Manually recall relevant facts
facts = memoire.recall(
    query="What am I studying?",
    user_id="user-123",
    limit=5
)

for fact in facts:
    print(f"[{fact.category}] {fact.content} (confidence: {fact.confidence})")
```

### Method 3: REST API

For non-Python applications or maximum flexibility:

```bash
# Create session
curl -X POST http://localhost:8000/v1/sessions \
  -H "X-API-Key: memori_xxx" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-123"}'

# Ingest message
curl -X POST http://localhost:8000/v1/ingest \
  -H "X-API-Key: memori_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "session_id": "SESSION_ID_HERE",
    "role": "user",
    "content": "I work at Google as a product manager"
  }'

# Recall facts
curl -X POST http://localhost:8000/v1/recall \
  -H "X-API-Key: memori_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "query": "What do I do for work?"
  }'
```

### Wrapper Options

Control memory behavior per-call:

```python
# Skip memory for a specific call
response = client.chat.completions.create(
    model="gpt-4",
    user="user-123",
    memoire_skip=True,  # No recall or ingest
    messages=[...]
)

# Use a specific session
response = client.chat.completions.create(
    model="gpt-4",
    user="user-123",
    memoire_session_id="custom-session-id",
    messages=[...]
)
```

### Streaming Support

Works seamlessly with streaming responses:

```python
stream = client.chat.completions.create(
    model="gpt-4",
    user="user-123",
    stream=True,
    messages=[{"role": "user", "content": "Tell me about Austin"}]
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")

# Ingestion happens after stream completes
```

## Auto-Memory (Wrapper)

The easiest integration — wrap your OpenAI client:

```python
from memoire import Memoire
import openai

memoire = Memoire(api_key="memori_xxx")
client = memoire.wrap(openai.OpenAI())

# Now every call automatically:
# 1. Recalls relevant facts
# 2. Injects them into system prompt
# 3. Ingests the conversation

response = client.chat.completions.create(
    model="gpt-4",
    user="user-123",  # REQUIRED
    messages=[{"role": "user", "content": "What's the weather like where I live?"}]
)
```

### How It Works

```
Your Call → Wrapper intercepts
                 ↓
         Extract user_id from request
                 ↓
         Call memoire.recall(query, user_id)
                 ↓
         Inject facts into system message
                 ↓
         Forward to OpenAI
                 ↓
         Get response
                 ↓
         Call memoire.ingest() in background
                 ↓
         Return response to you
```

### Wrapper Options

```python
# Skip memory for sensitive calls
response = client.chat.completions.create(
    model="gpt-4",
    user="user-123",
    memoire_skip=True,  # No memory operations
    messages=[...]
)

# Specify session for grouped conversations
response = client.chat.completions.create(
    model="gpt-4",
    user="user-123",
    memoire_session_id="onboarding-flow",
    messages=[...]
)
```

### Streaming

Works automatically with streaming:

```python
stream = client.chat.completions.create(
    model="gpt-4",
    user="user-123",
    stream=True,
    messages=[{"role": "user", "content": "Tell me a story"}]
)

for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")

# Ingestion happens after stream completes
```

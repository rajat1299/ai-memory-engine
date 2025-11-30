## The Extraction Pipeline

### How Facts Are Extracted

When you ingest a message, here's what happens:

**1. Message Storage**
```python
memoire.ingest(
    role="user",
    content="I'm John, a 28-year-old ML engineer at OpenAI in Austin.",
    user_id="user-123",
    session_id="session-456"
)
# → Stored in chat_logs table
# → Extraction job queued in Redis
```

**2. LLM Extraction (Background Worker)**

The worker calls your configured LLM with a structured prompt:

```
Extract atomic facts from this conversation.
For each fact, provide:
- category: biographical | work_context | relationship | user_preference | learning
- content: The fact as a complete sentence
- confidence: 0.0 to 1.0
- temporal_state: current | past | future | recurring
- slot_hint: semantic slot (e.g., "location", "employer", "partner")

Important:
- Create SEPARATE facts for each piece of information
- "Works at OpenAI as ML Engineer" → TWO facts (employer + role)
- Use first-person perspective ("Lives in Austin", not "User lives in Austin")
```

**3. Fact Validation**

Each extracted fact goes through validation:
- Minimum length (5 characters)
- Not a question
- Minimum confidence (0.5)
- Valid category

**4. Normalization**

Facts are normalized for consistency:
- "user lives in austin" → "Lives in Austin"
- "i work at openai" → "Works at OpenAI"
- "used to live in sf" → "Previously lived in SF" (temporal_state: past)

**5. Embedding Generation**

Each fact gets a vector embedding (OpenAI `text-embedding-3-small`):
- 1536-dimensional vector
- Stored in pgvector column
- Enables semantic search

**6. Deduplication**

Before saving, we check for near-duplicates:
- Cosine similarity > 0.95 → Same fact
- Keep higher confidence version

**7. Supersession**

Check if new fact supersedes existing facts:
- Same user
- Same category
- Same slot_hint (if applicable)
- Mark old as `superseded_by`

### Extraction Example

Input message:
> "I used to work at Google but now I'm at OpenAI. I'm a staff ML engineer and I moved from SF to Austin last year."

Extracted facts:

| Content | Category | Slot | Temporal | Confidence |
|---------|----------|------|----------|------------|
| "Previously worked at Google" | work_context | employer | past | 0.90 |
| "Works at OpenAI" | work_context | employer | current | 0.95 |
| "Is a Staff ML Engineer" | work_context | role | current | 0.95 |
| "Previously lived in San Francisco" | biographical | location | past | 0.85 |
| "Lives in Austin" | biographical | location | current | 0.90 |

## Endpoints Reference

### Users

**POST /v1/users** — Create a new user
```bash
curl -X POST http://localhost:8000/v1/users -d '{}'
```
```json
{"id": "uuid", "api_key": "memori_xxx"}
```

**POST /v1/users/{user_id}/consolidate** — Trigger memory consolidation
```bash
curl -X POST http://localhost:8000/v1/users/{user_id}/consolidate \
  -H "X-API-Key: memori_xxx"
```
```json
{"status": "queued", "message": "...", "job_id": "..."}
```

### Sessions

**POST /v1/sessions** — Create a conversation session
```bash
curl -X POST http://localhost:8000/v1/sessions \
  -H "X-API-Key: memori_xxx" \
  -d '{"user_id": "user-123"}'
```
```json
{"id": "session-uuid", "user_id": "user-123", "created_at": "..."}
```

### Ingest

**POST /v1/ingest** — Ingest a message
```bash
curl -X POST http://localhost:8000/v1/ingest \
  -H "X-API-Key: memori_xxx" \
  -d '{
    "user_id": "user-123",
    "session_id": "session-uuid",
    "role": "user",
    "content": "I work at OpenAI"
  }'
```
```json
{"status": "queued", "chat_log_id": "..."}
```

### Recall

**POST /v1/recall** — Retrieve relevant facts
```bash
curl -X POST http://localhost:8000/v1/recall \
  -H "X-API-Key: memori_xxx" \
  -d '{
    "user_id": "user-123",
    "query": "What do I do for work?",
    "limit": 5,
    "current_view_only": true,
    "include_historical": false
  }'
```
```json
{
  "relevant_facts": [
    {
      "id": "fact-uuid",
      "category": "work_context",
      "content": "Works at OpenAI",
      "confidence": 0.95,
      "temporal_state": "current",
      "slot_hint": "employer"
    }
  ]
}
```

**Recall Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `user_id` | string | required | User identifier |
| `query` | string | required | Search query |
| `limit` | int | 5 | Max facts to return |
| `categories` | string[] | null | Filter by categories |
| `current_view_only` | bool | true | Exclude superseded facts |
| `include_historical` | bool | false | Include past temporal states |
| `max_age_days` | int | null | Only recent facts |

### Conscious

**GET /v1/conscious/{user_id}** — Get essential facts
```bash
curl http://localhost:8000/v1/conscious/user-123 \
  -H "X-API-Key: memori_xxx"
```
```json
{
  "essential_facts": [...],
  "user_id": "user-123"
}
```

### Facts

**GET /v1/facts/{user_id}** — List all facts
```bash
curl http://localhost:8000/v1/facts/user-123 \
  -H "X-API-Key: memori_xxx"
```

**DELETE /v1/facts/{fact_id}** — Delete a fact
```bash
curl -X DELETE http://localhost:8000/v1/facts/fact-uuid \
  -H "X-API-Key: memori_xxx"
```

**GET /v1/facts/{fact_id}/source** — Get fact source
```bash
curl http://localhost:8000/v1/facts/fact-uuid/source \
  -H "X-API-Key: memori_xxx"
```
```json
{
  "fact_id": "...",
  "source_message_id": "...",
  "content_preview": "I work at OpenAI as a...",
  "role": "user",
  "timestamp": "..."
}
```

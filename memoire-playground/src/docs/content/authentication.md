## Authentication

All API requests require an API key in the `X-API-Key` header:

```bash
curl -X POST http://localhost:8000/v1/recall \
  -H "X-API-Key: memori_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-123", "query": "work"}'
```

### Getting an API Key

Create a user to get an API key:

```bash
curl -X POST http://localhost:8000/v1/users \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "api_key": "memori_abc123..."
}
```

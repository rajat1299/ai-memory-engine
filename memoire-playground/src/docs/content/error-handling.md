## Error Handling

All errors return consistent JSON:

```json
{
  "error": {
    "code": "not_found",
    "message": "User not found",
    "details": {"user_id": "invalid-id"}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `unauthorized` | 401 | Missing or invalid API key |
| `forbidden` | 403 | Access denied to resource |
| `not_found` | 404 | Resource doesn't exist |
| `rate_limited` | 429 | Too many requests |
| `validation_error` | 422 | Invalid request body |
| `recall_error` | 500 | Recall operation failed |
| `extraction_error` | 500 | Fact extraction failed |

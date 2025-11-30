## Environment Variables

### Required

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379

# LLM Provider (choose one)
LLM_PROVIDER=openai      # or: anthropic, gemini, openrouter
OPENAI_API_KEY=sk-...    # Required if LLM_PROVIDER=openai
```

### Optional

```bash
# Embedding model
EMBEDDING_MODEL=text-embedding-3-small

# API settings
API_HOST=0.0.0.0
API_PORT=8000
API_RATE_LIMIT=100  # requests per minute

# Worker settings
WORKER_CONCURRENCY=10
EXTRACTION_BATCH_SIZE=5

# Logging
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
```

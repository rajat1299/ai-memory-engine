## Quick Start

Get Mémoire running in under 5 minutes.

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/memoire.git
cd memoire

# Copy environment template
cp .env.example .env
```

Edit `.env` with your LLM provider:

```env
# Database (auto-configured by Docker)
DATABASE_URL=postgresql+asyncpg://memori:memori@db:5432/memori
REDIS_URL=redis://redis:6379

# LLM Provider for fact extraction (choose one)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here

# Or use OpenRouter (100+ models, many free)
# LLM_PROVIDER=openrouter
# OPENROUTER_API_KEY=sk-or-your-key-here
```

### 2. Start Services

```bash
# Start everything
docker-compose up -d

# Apply database migrations
docker-compose exec api alembic upgrade head
```

### 3. Create a User

```bash
curl -X POST http://localhost:8000/v1/users -H "Content-Type: application/json" -d '{}'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "api_key": "memori_abc123xyz..."
}
```

Save the `api_key` — you'll need it for all API calls.

### 4. Install the SDK

```bash
pip install -e "./memoire[openai]"
```

### 5. Add Memory to Your App

```python
from memoire import Memoire
import openai

# Initialize with your API key
memoire = Memoire(api_key="memori_abc123xyz...")

# Wrap your OpenAI client
client = memoire.wrap(openai.OpenAI())

# First conversation: Establish facts
response = client.chat.completions.create(
    model="gpt-4",
    user="user-123",  # Required: identifies the user
    messages=[{"role": "user", "content": "I'm a software engineer at OpenAI, living in Austin."}]
)
print(response.choices[0].message.content)

# Later conversation: Memory is automatic
response = client.chat.completions.create(
    model="gpt-4",
    user="user-123",
    messages=[{"role": "user", "content": "What's my commute like?"}]
)
# Mémoire recalls: works at OpenAI, lives in Austin
# Response will reference Austin-specific context
```

### What Just Happened?

1. **Ingestion**: The SDK sent your conversation to `/v1/ingest`
2. **Extraction**: Background worker parsed facts using your LLM provider
3. **Storage**: Facts stored with embeddings in PostgreSQL
4. **Recall**: On next query, SDK called `/v1/recall` to get relevant facts
5. **Injection**: Facts were injected into the system prompt automatically

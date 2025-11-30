## Installation

### Requirements

- Docker & Docker Compose (for backend)
- Python 3.9+ (for SDK)
- An LLM provider API key (OpenAI, Anthropic, Gemini, or OpenRouter)

### Backend Installation

```bash
# Clone repository
git clone https://github.com/your-org/memoire.git
cd memoire

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start services
docker-compose up -d

# Verify services are running
docker-compose ps
# Should show: api, worker, db, redis all "Up"

# Apply migrations
docker-compose exec api alembic upgrade head

# Check API health
curl http://localhost:8000/health
# {"status": "healthy"}
```

### SDK Installation

```bash
# Basic installation
pip install memoire

# With OpenAI wrapper support
pip install memoire[openai]

# With Anthropic wrapper support (coming soon)
pip install memoire[anthropic]

# Development installation (from source)
cd memoire
pip install -e ".[openai,dev]"
```

### Verify Installation

```python
from memoire import Memoire, __version__
print(f"Memoire SDK v{__version__}")

# Test connection (will warn if backend is down, but won't crash)
memoire = Memoire(
    api_key="memori_xxx",
    base_url="http://localhost:8000"
)
facts = memoire.recall("test", user_id="test-user")
print(f"Connection OK: {facts}")
```

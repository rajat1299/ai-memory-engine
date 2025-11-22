# Memori API - AI Memory Engine

A production-ready REST API service for conversational AI memory management, built with FastAPI, PostgreSQL, and Redis.

## Architecture

- **Service-Oriented**: Dockerized microservice architecture
- **Async-First**: Built on FastAPI with async/await patterns
- **Type-Safe**: Strict typing with Pydantic throughout
- **Background Processing**: Memory extraction via ARQ workers

## Quick Start

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your OPENAI_API_KEY

# Start all services
docker-compose up --build

# API will be available at http://localhost:8000
```

## Stack

- **Framework**: FastAPI 0.109+
- **Database**: PostgreSQL 15 + pgvector
- **Cache/Queue**: Redis
- **ORM**: SQLAlchemy 2.0 (Async)
- **Worker**: ARQ

## Project Structure

```
app/
├── main.py           # FastAPI application
├── config.py         # Settings management
├── database.py       # DB session handling
├── models/           # SQLAlchemy models
├── schemas/          # Pydantic schemas
├── api/              # Route handlers
├── services/         # Business logic
├── repositories/     # Data access layer
└── worker/           # Background tasks
```

## Development

```bash
# Run tests
docker-compose run api pytest

# Lint code
docker-compose run api ruff check .

# Check coverage
docker-compose run api coverage run -m pytest
```

## License

MIT

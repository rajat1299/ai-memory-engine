## Architecture

Mémoire is designed as a **sidecar service** — it runs alongside your application, handling all memory operations asynchronously.

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Docker Compose Stack                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────┐     ┌────────────────┐     ┌────────────────┐   │
│  │   FastAPI      │     │     Redis      │     │   ARQ Worker   │   │
│  │   (api)        │────▶│   (redis)      │◀────│   (worker)     │   │
│  │                │     │                │     │                │   │
│  │ • REST API     │     │ • Job Queue    │     │ • Extraction   │   │
│  │ • Auth         │     │ • Pub/Sub      │     │ • Optimization │   │
│  │ • Rate Limit   │     │ • Caching      │     │ • Decay        │   │
│  └───────┬────────┘     └────────────────┘     │ • Consolidate  │   │
│          │                                      └───────┬────────┘   │
│          │                                              │            │
│          ▼                                              ▼            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL + pgvector                      │   │
│  │                         (db)                                  │   │
│  │  Tables:                                                      │   │
│  │  • users          - User accounts and API keys                │   │
│  │  • sessions       - Conversation sessions                     │   │
│  │  • chat_logs      - Raw message history                       │   │
│  │  • memory_facts   - Extracted facts with embeddings           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

**1. Ingestion Flow:**
```
Client → POST /v1/ingest → Save ChatLog → Queue Extraction Job
                                                    ↓
                                          ARQ Worker picks up
                                                    ↓
                                          LLM extracts facts
                                                    ↓
                                          Generate embeddings
                                                    ↓
                                          Save MemoryFacts
                                                    ↓
                                          Run supersession logic
```

**2. Recall Flow:**
```
Client → POST /v1/recall → Vector Search (pgvector)
                                    ↓
                          Fuzzy Search (fallback)
                                    ↓
                          Category filtering
                                    ↓
                          Temporal filtering
                                    ↓
                          Return ranked facts
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| API | FastAPI (Python 3.11+) | Async REST API with validation |
| Database | PostgreSQL 15 | Relational data storage |
| Vector Search | pgvector | Semantic similarity search |
| Queue | Redis | Job queue and caching |
| Worker | ARQ | Async background tasks |
| ORM | SQLAlchemy 2.0 | Database access |
| Validation | Pydantic v2 | Request/response schemas |
| Migrations | Alembic | Database schema management |

### Background Tasks

The ARQ worker handles several scheduled and on-demand tasks:

| Task | Trigger | Purpose |
|------|---------|---------|
| `extract_facts_task` | On ingest | Parse facts from messages |
| `run_deduplication` | After extraction | Remove duplicate facts |
| `run_supersession` | After dedup | Mark superseded facts |
| `optimize_memory` | Every 6 hours | Promote essential facts |
| `decay_stale_facts` | Daily | Reduce confidence of unused facts |
| `consolidate_user_memory` | Weekly | Merge duplicates, generate profile |

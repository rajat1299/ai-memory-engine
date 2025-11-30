## Database Setup

### PostgreSQL with pgvector

Mémoire requires PostgreSQL with the pgvector extension:

**Using Docker (Recommended):**
```yaml
# docker-compose.yml
services:
  db:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_USER: memori
      POSTGRES_PASSWORD: memori
      POSTGRES_DB: memori
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

**Manual Setup:**
```sql
-- Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Connection String Format

```bash
# Local
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/memori

# Cloud (Neon, Supabase, etc.)
DATABASE_URL=postgresql+asyncpg://user:pass@host.cloud.neon.tech:5432/memori?sslmode=require
```

### Migrations

```bash
# Apply all migrations
docker-compose exec api alembic upgrade head

# Check current version
docker-compose exec api alembic current

# Create new migration
docker-compose exec api alembic revision --autogenerate -m "description"
```

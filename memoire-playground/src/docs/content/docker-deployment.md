## Docker Deployment

### Development

```bash
# Clone and configure
git clone https://github.com/your-org/memoire.git
cd memoire
cp .env.example .env
# Edit .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api worker

# Stop
docker-compose down
```

### Production

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  api:
    image: memoire/api:latest
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  worker:
    image: memoire/worker:latest
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  db:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

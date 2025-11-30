## Contributing to Mémoire

We welcome contributions! Here's how to get started.

### Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/memoire.git
cd memoire

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dev dependencies
pip install -e ".[dev]"

# Set up pre-commit hooks
pre-commit install

# Copy env and configure
cp .env.example .env
# Add your OPENAI_API_KEY for testing
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_recall.py -v

# Run SDK tests
pytest tests/test_sdk.py -v
```

### Code Style

```bash
# Format code
black app/ tests/
isort app/ tests/

# Lint
ruff check app/ tests/

# Type check
mypy app/
```

### Project Structure

```
memoire/
├── app/                    # Backend application
│   ├── api/               # FastAPI routes
│   │   ├── ingest.py     # POST /v1/ingest
│   │   ├── recall.py     # POST /v1/recall
│   │   ├── facts.py      # Facts CRUD
│   │   └── users.py      # User management
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   ├── worker/           # ARQ background tasks
│   │   ├── tasks.py     # Extraction, supersession
│   │   └── queue.py     # Job enqueueing
│   ├── llm/             # LLM provider abstraction
│   └── errors.py        # Custom exceptions
├── memoire/              # Python SDK
│   ├── client.py        # Memoire, MemoireAsync
│   ├── types.py         # Pydantic models
│   ├── wrappers/        # LLM client wrappers
│   └── utils.py         # Helpers
├── alembic/             # Database migrations
├── tests/               # Test suite
└── docker-compose.yml   # Local development
```

### Contribution Guidelines

1. **Create an issue first** — Discuss before implementing
2. **One feature per PR** — Keep changes focused
3. **Write tests** — Maintain coverage
4. **Update docs** — Keep documentation current
5. **Follow conventions** — Match existing code style

### Commit Messages

Use conventional commits:

```
feat(recall): add category filtering
fix(worker): handle embedding timeout
docs(sdk): add async usage examples
test(api): add recall edge cases
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make changes and add tests
4. Run `pytest` and `ruff check`
5. Commit with conventional message
6. Push and create PR
7. Address review feedback

### Getting Help

- **GitHub Issues** — Bug reports and feature requests
- **GitHub Discussions** — Questions and ideas
- **Discord** — Real-time chat (link in README)

---

Thank you for contributing to Mémoire! 🧠

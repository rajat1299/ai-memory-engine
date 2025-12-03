# 🚀 Mémoire Pre-Launch Audit Report

**Date:** December 2, 2025  
**Status:** Review Required Before Launch  
**Components Audited:** `app/` (Backend), `memoire/` (SDK), `memoire-playground/` (Website)

---

## 🔴 CRITICAL - Must Fix Before Launch

### 1. Missing LICENSE File
**Severity:** CRITICAL  
**Location:** Repository root  
**Issue:** No LICENSE file exists. The README claims "MIT" but there's no actual license file.  
**Impact:** Legal ambiguity for open-source users.  
**Fix:**
```bash
# Create LICENSE file with MIT license text
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2025 Mémoire

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
```

### 2. Missing .env.example File
**Severity:** CRITICAL  
**Location:** Repository root  
**Issue:** README references `cp .env.example .env` but no `.env.example` exists.  
**Impact:** Users cannot configure the application.  
**Fix:** Create `.env.example`:
```env
# Database (auto-configured by Docker Compose)
DATABASE_URL=postgresql+asyncpg://memori:memori@db:5432/memori
REDIS_URL=redis://redis:6379

# LLM Provider - Choose one: openai, anthropic, gemini, openrouter
LLM_PROVIDER=openai

# API Keys (set the one matching your LLM_PROVIDER)
OPENAI_API_KEY=sk-your-openai-key-here
# ANTHROPIC_API_KEY=sk-ant-your-key-here
# GEMINI_API_KEY=your-gemini-key-here
# OPENROUTER_API_KEY=sk-or-your-key-here

# Optional: OpenRouter site info
# OPENROUTER_SITE_URL=https://your-app.com
# OPENROUTER_SITE_NAME=Your App Name

# Optional: Model overrides
# CHAT_MODEL=gpt-4o-mini
# EMBEDDING_MODEL=text-embedding-3-small

# Optional: Rate limiting (requests per minute per user)
# RATE_LIMIT_REQUESTS_PER_MIN=60

# Optional: Debug mode
# DEBUG=false
```

### 3. Missing /health Endpoint
**Severity:** CRITICAL  
**Location:** `app/main.py`  
**Issue:** Docs reference `/health` endpoint but it doesn't exist. The root `/` returns health-like response but Docker healthchecks expect `/health`.  
**Impact:** Production health checks will fail.  
**Fix:** Add dedicated health endpoint:
```python
@app.get("/health")
async def health():
    """Health check endpoint for container orchestration."""
    return {"status": "healthy"}
```

---

## 🟠 HIGH - Should Fix Before Launch

### 4. Personal Email Exposed
**Severity:** HIGH  
**Location:** 
- `memoire-playground/src/components/Footer.jsx` (line 38)
- `memoire-playground/src/pages/PrivacyPage.jsx` (line 79)
- `memoire-playground/src/components/Navbar.jsx` (line 75)

**Issue:** Personal email `rajattiwari1099@gmail.com` and GitHub username hardcoded.  
**Recommendation:** 
- Create a dedicated project email (e.g., `hello@memoire.dev` or `contact@memoire.dev`)
- Update GitHub links to the organization repo if applicable
- Or keep personal contact if this is intentional

### 5. Hardcoded Localhost in Frontend API Client
**Severity:** HIGH  
**Location:** `memoire-playground/src/lib/api.js` (line 6)
```javascript
const API_BASE = 'http://localhost:8000/v1'
```
**Issue:** API base URL is hardcoded to localhost.  
**Impact:** Website won't work in production.  
**Fix:** Use environment variable:
```javascript
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/v1'
```

### 6. CORS Origins Hardcoded for Development
**Severity:** HIGH  
**Location:** `app/main.py` (lines 28-33)
```python
allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
],
```
**Issue:** Only development URLs allowed. Production frontend won't work.  
**Fix:** Make CORS configurable via environment:
```python
# In app/config.py
CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5174"]

# In app/main.py
allow_origins=settings.CORS_ORIGINS,
```
Then users can set `CORS_ORIGINS='["https://memoire.dev","https://app.memoire.dev"]'` in production.

### 7. Alembic.ini Has Placeholder DB URL
**Severity:** HIGH  
**Location:** `alembic.ini` (line 3)
```ini
sqlalchemy.url = postgresql://user:pass@localhost/db
```
**Issue:** Misleading placeholder URL. Though `env.py` overrides it, this could confuse users.  
**Fix:** Update to a clearer placeholder or comment:
```ini
# This URL is overridden by env.py using settings.DATABASE_URL
sqlalchemy.url = driver://user:pass@localhost/dbname
```

---

## 🟡 MEDIUM - Recommended Before Launch

### 8. Missing CONTRIBUTING.md
**Severity:** MEDIUM  
**Issue:** No contribution guidelines for open-source contributors.  
**Fix:** Create `CONTRIBUTING.md` with:
- Development setup instructions
- Code style guidelines
- PR process
- Issue templates

### 9. Missing CHANGELOG.md
**Severity:** MEDIUM  
**Issue:** No changelog to track versions.  
**Fix:** Create `CHANGELOG.md`:
```markdown
# Changelog

## [0.1.0] - 2025-12-XX
### Added
- Initial release
- Python SDK with OpenAI wrapper support
- REST API for memory operations
- Slot-based supersession
- Temporal awareness
- Semantic + fuzzy search
```

### 10. PyPI Package Metadata Incomplete
**Severity:** MEDIUM  
**Location:** `pyproject.toml`
**Issues:**
- Missing `homepage`, `repository`, `documentation` URLs
- Missing `keywords`
- Missing `classifiers`

**Fix:**
```toml
[project]
name = "memoire"
version = "0.1.0"
description = "Python SDK for the Mémoire memory engine"
readme = "memoire/README.md"  # Point to SDK README, not root
requires-python = ">=3.9"
authors = [{ name = "Memoire Team", email = "hello@memoire.dev" }]
license = { text = "MIT" }
keywords = ["memory", "llm", "ai", "openai", "agents", "context"]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Topic :: Scientific/Engineering :: Artificial Intelligence",
]

[project.urls]
Homepage = "https://memoire.dev"
Documentation = "https://memoire.dev/docs"
Repository = "https://github.com/rajat1299/memoire"
Issues = "https://github.com/rajat1299/memoire/issues"
```

### 11. TODO Comment in Code
**Severity:** LOW  
**Location:** `app/api/recall.py` (line 229)
```python
# 2. TODO: Implement semantic search using query
```
**Issue:** Leftover TODO in production code. The feature actually IS implemented.  
**Fix:** Remove or update the comment.

### 12. .gitignore Excludes Important Files
**Severity:** MEDIUM  
**Location:** `.gitignore`
**Issue:** The following are excluded but probably shouldn't be for an open-source repo:
```
README.md
ROADMAP.md
frontend/README.md
frontend/
docscontent.md
docscontent-memoire.md
```
**Impact:** Contributors won't see the README, frontend code, or roadmap.  
**Recommendation:** Remove these from `.gitignore` unless there's a specific reason.

---

## 🟢 LOW - Nice to Have

### 13. No Dedicated /health Endpoint (Reminder)
Already covered in Critical #3.

### 14. Package Name in playground
**Severity:** LOW  
**Location:** `memoire-playground/package.json`
```json
"name": "memory-app",
```
**Recommendation:** Rename to `memoire-playground` for consistency.

### 15. SDK README Path in pyproject.toml
**Severity:** LOW  
**Location:** `pyproject.toml` (line 5)
```toml
readme = "README.md"
```
**Issue:** Points to root README which includes Docker setup, not SDK-specific docs.  
**Fix:** Point to `memoire/README.md` for PyPI:
```toml
readme = "memoire/README.md"
```

### 16. Test Database URLs in Test Files
**Severity:** LOW  
**Location:** Multiple test files
```python
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/db")
```
**Issue:** Test files set placeholder URLs. Not a security issue but could be cleaner.  
**Recommendation:** Use pytest fixtures or a test config file.

---

## ✅ SECURITY AUDIT - Passed

### API Keys & Secrets
- ✅ No hardcoded API keys found (sk-*, memori_*, etc.)
- ✅ No passwords in source code (only placeholder examples in docs)
- ✅ `.env` is properly gitignored
- ✅ Secrets use `SecretStr` in Pydantic settings
- ✅ API keys are hashed before storage (SHA-256)

### Infrastructure
- ✅ Rate limiting implemented (`_enforce_rate_limit`)
- ✅ Non-root Docker user (`appuser`)
- ✅ No exposed database credentials in code

### Authentication
- ✅ API key validation with constant-time comparison
- ✅ Per-user authorization checks

---

## 📦 PyPI Publishing Checklist

Before running `pip install build && python -m build && twine upload dist/*`:

- [ ] LICENSE file created
- [ ] .env.example created  
- [ ] pyproject.toml metadata complete (URLs, keywords, classifiers)
- [ ] `readme` points to `memoire/README.md`
- [ ] Version is correct (0.1.0)
- [ ] All tests pass: `pytest tests/test_sdk.py tests/test_utils.py -v`
- [ ] Package builds cleanly: `pip install build && python -m build`
- [ ] Test install works: `pip install dist/memoire-0.1.0-py3-none-any.whl`

---

## 🚀 Deployment Checklist

### Backend
- [ ] .env.example provided to users
- [ ] /health endpoint exists
- [ ] CORS configured for production domains
- [ ] Alembic migrations tested

### SDK
- [ ] PyPI package published
- [ ] Documentation is accurate
- [ ] Examples work out of the box

### Website (Playground)
- [ ] API_BASE uses environment variable
- [ ] Personal email reviewed/updated
- [ ] GitHub links point to correct repo

---

## Summary

| Category | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 4 |
| 🟡 Medium | 5 |
| 🟢 Low | 4 |
| ✅ Security Passed | All |

**Recommendation:** Fix all CRITICAL and HIGH items before launch. MEDIUM and LOW can be addressed post-launch.

---

*Generated by pre-launch audit on December 2, 2025*


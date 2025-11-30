## SDK Installation

```bash
# Basic SDK
pip install memoire

# With OpenAI wrapper
pip install memoire[openai]

# Development (from source)
cd memoire
pip install -e ".[openai,dev]"
```

### Configuration

**Option 1: Environment Variables**
```bash
export MEMOIRE_API_KEY="memori_xxx"
export MEMOIRE_BASE_URL="http://localhost:8000"
export MEMOIRE_TIMEOUT="2.0"
```

**Option 2: Explicit Configuration**
```python
from memoire import Memoire

memoire = Memoire(
    api_key="memori_xxx",
    base_url="http://localhost:8000",
    timeout=5.0
)
```

# Mémoire
**Production-Grade Memory Engine for AI Agents**

### Philosophy

A sidecar brain for your AI applications. Mémoire runs alongside your app, handling the complexity of memory extraction, storage, and retrieval—so your agents can remember what matters.

### What is Mémoire?

Mémoire is an **open-source, self-hosted memory layer** that gives your LLM applications persistent, contextual memory. Unlike SaaS solutions, you own your data and infrastructure.

It extracts atomic facts from conversations, understands when information changes over time, and retrieves relevant context using hybrid semantic + fuzzy search.

### Why Mémoire?

**The Problem:**
```python
# Without memory: Repeating context every single time
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "User is John, lives in Austin, works at OpenAI as ML Engineer, loves hiking..."},
        {"role": "user", "content": "What should I do this weekend?"}
    ]
)
# You manually manage all context. It doesn't scale.
```

**The Solution:**
```python
# With Mémoire: Memory is automatic
from memoire import Memoire
import openai

memoire = Memoire(api_key="memori_xxx")
client = memoire.wrap(openai.OpenAI())

response = client.chat.completions.create(
    model="gpt-4",
    user="john-123",
    messages=[{"role": "user", "content": "What should I do this weekend?"}]
)
# Mémoire automatically recalls: lives in Austin, loves hiking
# Response: "Since you're in Austin and love hiking, check out the Barton Creek Greenbelt..."
```

### Key Differentiators

| Feature | Mémoire | Typical Memory Solutions |
|---------|---------|--------------------------|
| **Deployment** | Self-hosted (Docker) | SaaS / Cloud-only |
| **Data Ownership** | You own everything | Vendor lock-in |
| **Semantic Search** | pgvector embeddings | Basic keyword matching |
| **Temporal Awareness** | Tracks past vs. current facts | No temporal understanding |
| **Supersession** | "New job" replaces "old job" automatically | Duplicate facts accumulate |
| **Slot-Based Updates** | Granular: employer ≠ role | Coarse category-level |
| **Background Processing** | Async workers for extraction | Blocking API calls |

### Key Features

- **Semantic Recall** — Vector search finds relevant memories by meaning, not keywords
- **Slot-Based Supersession** — "New job at Apple" automatically supersedes "Works at Google"
- **Temporal Awareness** — Distinguishes current facts from past, future, and recurring
- **Fail-Open SDK** — Your app continues working even if the memory backend is down
- **Streaming Support** — Works with streaming LLM responses
- **Multi-Provider** — OpenAI, Anthropic, Gemini, OpenRouter for extraction
- **Production Architecture** — PostgreSQL + pgvector + Redis + async workers

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Application                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           memoire.wrap(openai.OpenAI())             │    │
│  │  • Auto-recalls relevant facts before each call      │    │
│  │  • Auto-ingests conversations after each call        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Mémoire Backend (Docker)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   FastAPI    │  │    Redis     │  │  ARQ Worker  │       │
│  │   REST API   │  │    Queue     │  │  Background  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│  ┌────────────────────────┴────────────────────────────┐    │
│  │              PostgreSQL + pgvector                   │    │
│  │  • Users, Sessions, ChatLogs, MemoryFacts            │    │
│  │  • Vector embeddings for semantic search             │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

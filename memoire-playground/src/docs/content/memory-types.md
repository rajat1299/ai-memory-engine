## Memory Types & Categories

### Fact Categories

Every extracted fact is classified into one of five categories:

| Category | Description | Examples |
|----------|-------------|----------|
| `biographical` | Personal identity, location, education | "Lives in Austin", "Has a PhD in Physics" |
| `work_context` | Employment, role, projects | "Works at OpenAI", "Is a Staff Engineer" |
| `relationship` | People connections | "Partner is Sarah", "Best friend is Mike" |
| `user_preference` | Likes, dislikes, preferences | "Loves hiking", "Prefers dark mode" |
| `learning` | Studies, goals, courses | "Learning Rust", "Studying for AWS cert" |

### Slot Hints

Within categories, facts have **slot hints** for granular supersession:

**work_context slots:**
- `employer` — "Works at OpenAI"
- `role` — "Is a Staff Engineer"
- `team` — "On the GPT team"
- `project` — "Building memory systems"

**biographical slots:**
- `location` — "Lives in Austin"
- `age` — "Is 32 years old"
- `education` — "Has a CS degree from MIT"

**relationship slots:**
- `partner` — "Partner is Sarah"
- `family` — "Has two kids"

### Confidence Scores

Each fact has a confidence score (0.0 - 1.0):

- **0.9+** — Explicit statements ("I am a software engineer")
- **0.7-0.9** — Strong implications ("I've been coding for 10 years")
- **0.5-0.7** — Inferences ("Seems to prefer Python")
- **< 0.5** — Not saved (filtered out)

### Essential Facts

Facts can be marked as **essential** (`is_essential=true`). These are:

- Loaded into "conscious memory" for every session
- Never decayed or deprioritized
- Promoted by the periodic optimization task

Access essential facts via:
```python
conscious = memoire.get_conscious(user_id="user-123")
```

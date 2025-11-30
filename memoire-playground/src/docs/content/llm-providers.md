## LLM Providers

Mémoire uses LLMs for fact extraction. Configure your preferred provider:

### OpenAI (Recommended)

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
EXTRACTION_MODEL=gpt-4o-mini  # Cost-effective
EMBEDDING_MODEL=text-embedding-3-small
```

### OpenRouter (100+ Models)

```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-your-key
EXTRACTION_MODEL=openai/gpt-4o-mini
# Many free models available for testing
```

### Anthropic

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key
EXTRACTION_MODEL=claude-3-haiku-20240307
```

### Google Gemini

```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-key
EXTRACTION_MODEL=gemini-1.5-flash
```

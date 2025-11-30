## Async Usage

For async applications:

```python
from memoire import MemoireAsync
import openai

async def main():
    async with MemoireAsync(api_key="memori_xxx") as memoire:
        # All methods are async
        facts = await memoire.recall("work history", user_id="user-123")
        
        await memoire.ingest(
            role="user",
            content="I got promoted!",
            user_id="user-123",
            session_id="session-456"
        )
        
        conscious = await memoire.get_conscious(user_id="user-123")
        
        # Wrap async OpenAI client
        client = memoire.wrap(openai.AsyncOpenAI())
        
        response = await client.chat.completions.create(
            model="gpt-4",
            user="user-123",
            messages=[{"role": "user", "content": "What level am I now?"}]
        )

import asyncio
asyncio.run(main())
```

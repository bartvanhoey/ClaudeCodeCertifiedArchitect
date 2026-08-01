import os
import asyncio
from dotenv import load_dotenv
from anthropic import AsyncAnthropic, DefaultAioHttpClient

load_dotenv()


async def main() -> None:
    model="claude-haiku-4-5-20251001"
    async with AsyncAnthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
        http_client=DefaultAioHttpClient(),
    ) as client:
        response = await client.messages.create(
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": "Hello, Claude",
                }
            ],
            model=model,
        )
        import json
        print(json.dumps([block.model_dump() for block in response.content]))


asyncio.run(main())
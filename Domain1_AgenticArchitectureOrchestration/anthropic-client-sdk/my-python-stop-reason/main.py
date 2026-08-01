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
        message = await client.messages.create(
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": "Hello, Claude",
                }
            ],
            model=model,
        )
        print(message.content)


asyncio.run(main())
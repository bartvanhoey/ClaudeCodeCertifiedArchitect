import os
import json
import asyncio
from dotenv import load_dotenv
from anthropic import AsyncAnthropic, DefaultAioHttpClient

load_dotenv()

# Code-driven pattern: no tools involved.
# Claude only classifies the request in plain text. All branching logic
# (the decision tree) is hard-coded in Python and reacts to that text.

messages = [
    {
        "role": "user",
        "content": (
            "Classify this support request into exactly one word - "
            "BILLING, TECHNICAL, or GENERAL - and reply with only that word.\n\n"
            # "Request: \"I was charged twice for my subscription this month.\""
            "Request: \"I have a problem with my printer, it shows empty cartridge.\""
        ),
    }
]

def handle_billing():
    print("Decision: route to billing team, open refund ticket.")

def handle_technical():
    print("Decision: route to technical support queue.")

def handle_general():
    print("Decision: route to general inquiries mailbox.")

# The decision tree: fixed branches, no LLM involvement beyond the classification text
def route(category: str) -> None:
    category = category.strip().upper()
    if category == "BILLING":
        handle_billing()
    elif category == "TECHNICAL":
        handle_technical()
    elif category == "GENERAL":
        handle_general()
    else:
        print(f"Decision: unrecognized category '{category}', routing to a human.")


async def classifyByClaude(client: AsyncAnthropic) -> str:
    response = await client.messages.create(
        max_tokens=1024,
        messages=messages,
        model="claude-haiku-4-5-20251001",
    )
    print("Response from Claude:")
    print(json.dumps(response.model_dump(), indent=2))

    classification = next(
        block.text for block in response.content if block.type == "text"
    )
    print(f"Claude classified the request as: {classification.strip()}")

    return classification


async def main() -> None:
    async with AsyncAnthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
        http_client=DefaultAioHttpClient(),
    ) as client:

        category = await classifyByClaude(client)

        route(category)


asyncio.run(main())

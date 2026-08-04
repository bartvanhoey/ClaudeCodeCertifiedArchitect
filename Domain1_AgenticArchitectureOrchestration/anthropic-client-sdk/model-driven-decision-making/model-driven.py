import os
import json
import asyncio
from dotenv import load_dotenv
from anthropic import AsyncAnthropic, DefaultAioHttpClient

load_dotenv()

# Model-driven pattern: Claude makes the decision, not the Python code.
# Claude is given a tool for each possible action and decides which one
# to call and with what arguments. There is no hard-coded decision tree -
# the Python side just executes whatever tool call Claude chose.

messages = [
    {
        "role": "user",
        "content": (
            "A customer submitted this support request:\n\n"
            "\"I have a problem with my printer, it shows empty cartridge.\"\n\n"
            "Decide how to route it and call the appropriate tool."
        ),
    }
]

tools = [
    {
        "name": "route_to_billing",
        "description": "Route the request to the billing team and open a refund ticket.",
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "Brief explanation of why this is a billing issue.",
                },
            },
            "required": ["reason"],
        },
    },
    {
        "name": "route_to_technical",
        "description": "Route the request to the technical support queue.",
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "Brief explanation of why this is a technical issue.",
                },
                "urgency": {
                    "type": "string",
                    "enum": ["low", "medium", "high"],
                    "description": "How urgently the issue needs to be handled.",
                },
            },
            "required": ["reason", "urgency"],
        },
    },
    {
        "name": "route_to_general",
        "description": "Route the request to the general inquiries mailbox.",
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "Brief explanation of why this is a general inquiry.",
                },
            },
            "required": ["reason"],
        },
    },
]


def route_to_billing(reason: str) -> None:
    print(f"Decision: route to billing team, open refund ticket. Reason: {reason}")


def route_to_technical(reason: str, urgency: str) -> None:
    print(f"Decision: route to technical support queue (urgency: {urgency}). Reason: {reason}")


def route_to_general(reason: str) -> None:
    print(f"Decision: route to general inquiries mailbox. Reason: {reason}")


# Dispatch table only maps tool name -> function. Which entry gets used
# is entirely up to Claude's tool choice - no branching logic here.
handlers = {
    "route_to_billing": route_to_billing,
    "route_to_technical": route_to_technical,
    "route_to_general": route_to_general,
}


def execute_tool_call(tool_name: str, tool_input: dict) -> None:
    handler = handlers.get(tool_name)
    if handler is None:
        print(f"Decision: unrecognized tool '{tool_name}', routing to a human.")
        return
    handler(**tool_input)


async def decideByClaude(client: AsyncAnthropic) -> list:
    response = await client.messages.create(
        max_tokens=1024,
        messages=messages,
        model="claude-haiku-4-5-20251001",
        tools=tools,
    )
    print("Response from Claude:")
    print(json.dumps(response.model_dump(), indent=2))

    tool_calls = [block for block in response.content if block.type == "tool_use"]
    if not tool_calls:
        print("Claude did not choose to call a tool.")
    return tool_calls


async def main() -> None:
    async with AsyncAnthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
        http_client=DefaultAioHttpClient(),
    ) as client:

        tool_calls = await decideByClaude(client)

        for call in tool_calls:
            print(f"Claude decided to call: {call.name} with input: {call.input}")
            execute_tool_call(call.name, call.input)


asyncio.run(main())

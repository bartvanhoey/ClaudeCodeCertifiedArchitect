import os
import json
import asyncio
from dotenv import load_dotenv
from anthropic import AsyncAnthropic, DefaultAioHttpClient

load_dotenv()

# Tutorial: Build a tool-using agent
# https://platform.claude.com/docs/en/agents-and-tools/tool-use/build-a-tool-using-agent
# Define one tool. The input_schema is a JSON Schema object describing
# the arguments Claude should pass when it calls this tool. 
tools = [
    {
        "name": "magic_eyeball",
        "description": "When the user asks a yes or no fortune telling question call this function",
        "input_schema": {
            "type": "object",
            "properties": {
                "question": {"type": "string"}
            },
            "required": ["question" ]
        },
    }
]
def run_tool(name, tool_input):
    if name == "magic_eyeball":
        return { "magic_eyeball_id" : "meb_123", "question": tool_input["question"] }
    return {"error": f"Unknown tool:{name}"}

# Keep the full conversation history in a list so each turn sees prior context

messages =[
    {
        "role": "user",
        "content": "Hey Claude, will I be a billionaire living on Mars in 2026?",
    }
]


async def main() -> None:
    model="claude-haiku-4-5-20251001"
    async with AsyncAnthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
        http_client=DefaultAioHttpClient(),
    ) as client:
        async def create_response():
            return await client.messages.create(
                max_tokens=1024,
                messages=messages,
                model=model,
                tools=tools,
                tool_choice={"type": "auto", "disable_parallel_tool_use": True}
            )

        response = await create_response()
        print('Response from Claude:')
        print(json.dumps(response.model_dump(), indent=2))
        tool_use = next((block for block in response.content if block.type == "tool_use"), None)
        # print(tool_use)

        # messages.append({ "role": "assistant", "content": response.content})
        # messages.append({ "role": "user",
        #                             "content": [
        #                                 {
        #                                     "type" : "tool_result",
        #                                     "tool_use_id" : tool_use.id,
        #                                     "content": json.dumps(run_tool(tool_use.name, tool_use.input))
        #                                 }
        #                             ]
        #                })
        # print('Follow-up response from Claude:')
        # followup_response = await create_response()
        # print(json.dumps(followup_response.model_dump(), indent=2))

        # Loop until Claude stops asking for tools.
        # Each iteration runs the requested tool, appends the result to history
        # and asks Claude to continue
        while response.stop_reason == "tool_use":
            tool_use = next(block for block in response.content if block.type == "tool_use")
            result = run_tool(tool_use.name, tool_use.input)

            messages.append({ "role": "assistant", "content": response.content})
            messages.append({ "role": "user",
                             "content": [
                                 {
                                     "type" : "tool_result",
                                     "tool_use_id" : tool_use.id,
                                     "content": json.dumps(result)
                                 }
                             ]
                             })
            response = await create_response()
            print(json.dumps(response.model_dump(), indent=2))

    # final_text = next(block for block in response.content if block.type == "text")
    # print(final_text.text)


asyncio.run(main())
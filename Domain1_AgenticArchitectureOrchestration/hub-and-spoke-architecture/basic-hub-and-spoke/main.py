import anthropic
import json
from typing import Any
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic()

def math_agent(expression: str) -> str:
    """Simple math agent that evaluates mathematical expressions."""
    try:
        result = eval(expression)
        return f"Math result: {result}"
    except Exception as e:
        return f"Math error: {str(e)}"


def text_agent(text: str, operation: str) -> str:
    """Text processing agent."""
    if operation == "uppercase":
        return text.upper()
    elif operation == "reverse":
        return text[::-1]
    elif operation == "length":
        return f"Length: {len(text)}"
    else:
        return f"Unknown operation: {operation}"


def data_agent(data: dict) -> str:
    """Data formatting agent."""
    return json.dumps(data, indent=2)


def coordinator_agent(task: str) -> str:
    """
    Hub coordinator agent that delegates work to specialist agents.
    Uses Claude to decide which agents to call and how to combine results.
    """
    tools = [
        {
            "name": "math_tool",
            "description": "Performs mathematical calculations on expressions",
            "input_schema": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Mathematical expression to evaluate"
                    }
                },
                "required": ["expression"]
            }
        },
        {
            "name": "text_tool",
            "description": "Performs text processing operations",
            "input_schema": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "Text to process"
                    },
                    "operation": {
                        "type": "string",
                        "enum": ["uppercase", "reverse", "length"],
                        "description": "Operation to perform on text"
                    }
                },
                "required": ["text", "operation"]
            }
        },
        {
            "name": "data_tool",
            "description": "Formats and structures data",
            "input_schema": {
                "type": "object",
                "properties": {
                    "data": {
                        "type": "object",
                        "description": "Data to format"
                    }
                },
                "required": ["data"]
            }
        }
    ]

    messages = [
        {
            "role": "user",
            "content": f"You are a coordinator agent managing specialized worker agents. Please complete this task by delegating to appropriate agents: {task}"
        }
    ]

    while True:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            tools=tools,
            messages=messages
        )

        if response.stop_reason == "end_turn":
            for block in response.content:
                if hasattr(block, "text"):
                    return block.text
            return "Task completed"

        if response.stop_reason == "tool_use":
            tool_results = []

            for block in response.content:
                if block.type == "tool_use":
                    tool_name = block.name
                    tool_input = block.input

                    if tool_name == "math_tool":
                        result = math_agent(tool_input["expression"])
                    elif tool_name == "text_tool":
                        result = text_agent(tool_input["text"], tool_input["operation"])
                    elif tool_name == "data_tool":
                        result = data_agent(tool_input["data"])
                    else:
                        result = "Unknown tool"

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result
                    })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})


def main():
    """Run example hub-and-spoke tasks."""
    print("=" * 60)
    print("Hub-and-Spoke Architecture Demo")
    print("=" * 60)

    tasks = [
        "Calculate 15 * 3 and then convert the result to text in uppercase",
        "Process the text 'hello world' by reversing it and then finding its length",
        "Create a data structure with name='Alice', age=30, city='NYC' and format it nicely"
    ]

    for i, task in enumerate(tasks, 1):
        print(f"\nTask {i}: {task}")
        print("-" * 60)
        result = coordinator_agent(task)
        print(f"Result:\n{result}")
        print()


if __name__ == "__main__":
    main()

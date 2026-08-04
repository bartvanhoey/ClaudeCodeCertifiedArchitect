# Model-Driven Decision Making with Anthropic Claude

Minimal async Python example that calls the Anthropic Claude API using the `anthropic` SDK.

## Prerequisites

- Python 3.9+
- An Anthropic API key

## Installation

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Configuration

Create a `.env` file in the project root with your API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

## Usage

```bash
python model-driven.py
```

`model-driven.py` demonstrates the **model-driven decision-making** pattern: instead of Claude producing plain text that Python then branches on with an `if/elif` tree, Claude is given a tool for each possible routing outcome (`route_to_billing`, `route_to_technical`, `route_to_general`) and decides for itself which tool to call and with what arguments. The Python side has no decision tree - it only executes whichever tool call Claude chose, via a simple name-to-function dispatch table.

```python
response = await client.messages.create(
    max_tokens=1024,
    messages=messages,
    model=model,
    tools=tools,
)

tool_calls = [block for block in response.content if block.type == "tool_use"]
for call in tool_calls:
    execute_tool_call(call.name, call.input)
```

Contrast this with the **code-driven** pattern (see the sibling `code-driven-decision-making` example), where Claude only classifies the request as text and all routing logic is hard-coded in Python.

## Dependencies

- [`anthropic`](https://pypi.org/project/anthropic/) (with `aiohttp` extra) — Anthropic Python SDK
- `python-dotenv` — loads `ANTHROPIC_API_KEY` from `.env`

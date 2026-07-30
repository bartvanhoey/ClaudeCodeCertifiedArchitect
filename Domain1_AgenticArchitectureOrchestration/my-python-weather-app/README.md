# AgenticArchitectureOrchestration

A minimal, single-file demo of an **agentic loop** built on the Anthropic Claude API's tool-use feature. Claude decides which tools to call; a local Python process executes them and feeds the results back until Claude reaches a final answer.

## Features

- Demonstrates the core request → tool-call → execute → respond loop used in agentic systems
- Tool execution happens **locally**, never inside Anthropic's API — only the reasoning step (`client.messages.create`) is remote
- Includes a real external API call (`get_weather`, via [Open-Meteo](https://open-meteo.com/), no key required) alongside mocked tools (`book_flight`, `book_hotel`) to illustrate mixing live and stubbed tools
- Several example prompts included to exercise multi-step reasoning, ambiguous geography resolution, and conditional tool use

## Prerequisites

- Python 3.10+
- An [Anthropic API key](https://console.anthropic.com/)

## Installation

```bash
python -m venv .venv
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Copy the example environment file and add your API key:

```bash
cp .env.example .env
```

```
ANTHROPIC_API_KEY=your-api-key-here
```

## Usage

Run the demo:

```bash
python agent_loop.py
```

By default it runs the prompt:

> "I have an aunt living in Boston, Lincolnshire, UK, but I am not sure in which country, and I also don't know what the weather is like there at the moment, then book a flight there if it's sunny."

Additional example prompts are included as commented-out lines at the bottom of `agent_loop.py` — uncomment one (and comment out the others) to try a different scenario:

```python
if __name__ == "__main__":
    run("I have an aunt living in Boston, Lincolnshire, UK, ...")
    # run("Check the weather in Rome, and if it's sunny, book a flight and a hotel for 3 nights.")
    # run("I have an aunt living in Seoul, South Korea but I don't know what the weather is like there at the moment, then book a flight there if it's sunny.")
    # run("Is there a letter A in the word school, then book a flight there if it's sunny.")
    # run("What's the weather in London, then book a flight there if it's sunny.")
```

The script prints each step of the loop: Claude's reasoning, tool calls it requests, and the results returned by those tools.

## How it works

1. A user message is sent to Claude along with a list of available tools (`get_weather`, `book_flight`, `book_hotel`).
2. If Claude's response has `stop_reason == "tool_use"`, the script executes the requested tool(s) locally via `execute_tool` and sends the results back as a `tool_result` message.
3. This repeats until Claude's response has `stop_reason == "end_turn"`, at which point the loop ends.

Tools are defined twice: once as a JSON schema (what Claude sees, in the `tools` list) and once as a real Python function (what actually runs, dispatched by `execute_tool`).

| Tool | Behavior |
|------|----------|
| `get_weather` | Real lookup via the Open-Meteo API (geocoding + current weather) |
| `book_flight` | Mocked — returns a fabricated confirmation code, no real API call |
| `book_hotel` | Mocked — returns a fabricated confirmation code, no real API call |

## Dependencies

- [`anthropic`](https://pypi.org/project/anthropic/) — Claude API client
- [`requests`](https://pypi.org/project/requests/) — HTTP calls to Open-Meteo
- [`python-dotenv`](https://pypi.org/project/python-dotenv/) — loads `ANTHROPIC_API_KEY` from `.env`

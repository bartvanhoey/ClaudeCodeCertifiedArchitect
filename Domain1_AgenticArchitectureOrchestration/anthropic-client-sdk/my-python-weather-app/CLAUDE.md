# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A minimal, single-file demo of an agentic loop using the Anthropic API's tool-use feature (referenced in the repo as "Domain1-AgenticArchitecture.md"). It exists to illustrate the core loop pattern, not as a production application.

## Setup and running

```bash
python -m venv .venv
.venv/Scripts/activate       # Windows
pip install -r requirements.txt
cp .env.example .env         # then set ANTHROPIC_API_KEY
python agent_loop.py
```

There is no test suite, linter, or build step in this repo — it's a single script.

## Architecture

Everything lives in `agent_loop.py`. The key concept to preserve when editing this file:

- **Tool execution happens locally, never inside Anthropic's API.** The API call (`client.messages.create`) only does reasoning/decides which tool to call; `execute_tool` runs the actual Python function in-process. Keep this separation explicit — it's the point of the demo.
- **The loop** (`run`): send messages → if `stop_reason == "tool_use"`, execute each requested tool locally, append results as a `tool_result` message, and loop again → if `stop_reason == "end_turn"`, stop. This request/execute/respond cycle is the entire architecture.
- **Tools are defined twice**: once as JSON schema in the `tools` list (what Claude sees) and once as a real Python function (what actually runs). `execute_tool` dispatches by name between the two. When adding a new tool, both halves must be added and kept in sync.
- `get_weather` calls a real external API (Open-Meteo, no key required). `book_flight` and `book_hotel` are intentionally mocked — they return fabricated confirmation codes rather than calling any real booking service.
- The `if __name__ == "__main__"` block has several example prompts commented out; they exist as scenarios for manually exercising different agentic behaviors (multi-step reasoning, ambiguous geography, conditional booking logic). Swap which line is uncommented to try a different scenario rather than deleting the others.

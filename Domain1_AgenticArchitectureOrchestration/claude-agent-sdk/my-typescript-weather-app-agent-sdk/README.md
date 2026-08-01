# Weather / Booking Agent (Claude Agent SDK)

A Claude Agent SDK port of [`../my-python-weather-app/agent_loop.py`](../my-python-weather-app/agent_loop.py). Same 3 tools and same example prompts, but built on `query()` from `@anthropic-ai/claude-agent-sdk` instead of a hand-written agentic loop over the raw Anthropic Messages API.

## What changed vs. the Python version

| | `agent_loop.py` (Anthropic SDK) | `agent.ts` (Claude Agent SDK) |
|---|---|---|
| Package | `anthropic` | `@anthropic-ai/claude-agent-sdk` |
| The loop | Hand-written `while True`, checks `stop_reason`, appends `tool_result` blocks manually | Handled internally by `query()` — you `for await` over the message stream |
| Tools | JSON schema + Python function, dispatched by `execute_tool` | Defined with `tool()` (Zod schema + async handler), registered via `createSdkMcpServer` and exposed through `mcpServers` / `allowedTools` |
| Tool execution | Runs your Python function directly in `execute_tool` | SDK invokes the registered handler internally |

The three tools (`get_weather`, `book_flight`, `book_hotel`) behave identically — `get_weather` calls the real Open-Meteo API, `book_flight`/`book_hotel` are still mocked and return fabricated confirmation codes.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- An [Anthropic API key](https://console.anthropic.com/)

## Installation

```sh
npm install
```

## Configuration

Copy the example env file and set your API key:

```sh
cp .env.local.example .env.local
```

```
ANTHROPIC_API_KEY=your-api-key-here
```

`.env.local` is excluded from version control via `.gitignore` — never commit real API keys.

## Usage

```sh
npm start
```

or directly with [`tsx`](https://github.com/privatenumber/tsx):

```sh
npx tsx agent.ts
```

The default scenario checks the weather in Rome and books a flight + 3-night hotel stay if it's sunny. Other example prompts (ambiguous geography, conditional booking, unrelated questions) are commented out at the bottom of `agent.ts` — swap which line is active to try a different scenario.

## Project Structure

```
.
├── agent.ts               # Entry point — tool definitions + query() call
├── package.json
├── .env.local.example     # Template for required environment variables
└── .env.local             # Local secrets (not committed)
```

## License

ISC

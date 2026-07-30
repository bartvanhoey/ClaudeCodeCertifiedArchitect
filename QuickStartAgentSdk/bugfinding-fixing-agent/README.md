# Bugfinding & Fixing Agent

A minimal example agent built with the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) that reviews a TypeScript file for bugs and automatically fixes what it finds.

## Features

- Runs an autonomous agentic loop via `query()` from `@anthropic-ai/claude-agent-sdk`
- Reviews `utils.ts` for bugs that would cause runtime crashes
- Automatically applies fixes using the `Read`, `Edit`, and `Glob` tools
- Streams Claude's reasoning, tool calls, and final result to the console in real time

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- An [Anthropic API key](https://console.anthropic.com/)

## Installation

```sh
npm install
```

## Configuration

Create a `.env.local` file in the project root with your API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

`.env.local` is excluded from version control via `.gitignore` — never commit real API keys.

## Usage

Run the agent with [`tsx`](https://github.com/privatenumber/tsx):

```sh
npx tsx agent.ts
```

The agent will:
1. Read `utils.ts`
2. Look for bugs that would cause the program to crash
3. Edit the file in place to fix any issues it finds (edits are auto-approved via `permissionMode: "acceptEdits"`)
4. Print its reasoning, tool usage, and a final `Done: <subtype>` result to the console

To point the agent at a different file or task, edit the `prompt` in `agent.ts`.

## Project Structure

```
.
├── agent.ts       # Entry point — configures and runs the Claude agent
├── utils.ts       # Example file the agent reviews and fixes
├── package.json
└── .env.local     # Local secrets (not committed)
```

## License

ISC

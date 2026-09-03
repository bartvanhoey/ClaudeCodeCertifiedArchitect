# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**ClaudeCodeCertifiedArchitect** is a learning and experimentation repository exploring Claude AI, agentic architecture patterns, and the Anthropic SDKs. It contains multiple independent projects organized by domain and SDK type, alongside study materials for understanding agentic systems.

### High-Level Structure

```
Domain1_AgenticArchitectureOrchestration/
├── anthropic-client-sdk/          # Projects using the Anthropic Client SDK
│   ├── code-driven-decision-making/
│   ├── model-driven-decision-making/
│   ├── my-python-event-creator-app/
│   ├── my-python-stop-reason/
│   ├── my-python-weather-app/
│   └── my-nextjs-weather-app/     # Next.js example
├── claude-agent-sdk/              # Projects using the Claude Agent SDK
│   ├── bugfinding-fixing-agent/
│   └── my-typescript-weather-app-agent-sdk/
├── hub-and-spoke-architecture/    # Multi-agent orchestration demos
│   ├── basic-hub-and-spoke/
│   ├── customer-support-system/   # Latest: hub-and-spoke with autonomous subagents
│   └── job-application-screener/
├── Domain1-AgenticArchitecture.md
├── Domain1-Quiz.md
└── Multi-Agent-Topologies.md
```

## Key Architectural Concepts

This repository demonstrates two fundamentally different approaches to building with Claude:

### 1. Anthropic Client SDK (`anthropic` / `@anthropic-ai/sdk`)
- **What it is**: Thin HTTP wrapper around the Claude Messages API — no built-in tools
- **Pattern**: Send request → get completion back (or manage your own tool-use loop)
- **Best for**: Custom agents, one-off completions, workflows you fully control
- **Languages**: Python, TypeScript, Java, Go, Ruby, C#, PHP

**Example projects**:
- `my-python-weather-app/` — Synchronous Python agent with manual tool loop
- `my-nextjs-weather-app/` — Next.js + React frontend calling Claude API routes
- `code-driven-decision-making/` — Demonstrates code-driven vs model-driven choices

### 2. Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- **What it is**: Claude Code's harness packaged as a library — complete agentic loop + built-in tools
- **Built-in tools**: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
- **Pattern**: Call `query(prompt)` → SDK drives the entire loop autonomously
- **Best for**: Batteries-included coding/filesystem agent on your infrastructure
- **Languages**: Python and TypeScript/Node.js only

**Example projects**:
- `bugfinding-fixing-agent/` — TypeScript agent that finds and fixes bugs in code
- `my-typescript-weather-app-agent-sdk/` — Weather agent using built-in tools

### 3. Hub-and-Spoke Architecture (Orchestration)
Multi-agent systems with a central orchestrator:
- **Hub**: Routes requests and synthesizes responses
- **Spokes**: Specialized subagents (billing, technical support, hiring, etc.)
- **Pattern**: Each agent has its own autonomous reasoning loop; not simple function calls
- **Latest example**: `customer-support-system/` — Three subagents (Billing, Technical, Account) coordinated by an orchestrator

**Key insight**: Subagents are autonomous entities with their own reasoning, not just tool dispatchers.

## Development Commands

### Python Projects

For any Python project (e.g., `my-python-weather-app/`, `code-driven-decision-making/`):

```bash
cd Domain1_AgenticArchitectureOrchestration/anthropic-client-sdk/<project-name>

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py  # Check the specific project's structure

# Set API key (required)
export ANTHROPIC_API_KEY=sk-...
```

### Node.js / TypeScript Projects

For Next.js projects (e.g., `my-nextjs-weather-app/`, `customer-support-system/`):

```bash
cd Domain1_AgenticArchitectureOrchestration/<sdk-type>/<project-name>

# Install dependencies
npm install

# Set API key (required)
export ANTHROPIC_API_KEY=sk-...

# Start development server
npm run dev

# Build for production
npm build

# Lint code
npm run lint
```

For TypeScript CLI agents (e.g., `bugfinding-fixing-agent/`):

```bash
cd Domain1_AgenticArchitectureOrchestration/claude-agent-sdk/<project-name>

# Install dependencies
npm install

# Run with tsx (TypeScript executor)
npx tsx <entry-file>.ts
```

## Understanding SDK Differences

Before working on a project, identify which SDK it uses:

| Pattern | SDK | Key Indicator |
|---------|-----|---|
| Imports `anthropic` / `@anthropic-ai/sdk` | Client SDK | Thin API wrapper; you manage tool loops |
| Imports `claude-agent-sdk` | Agent SDK | Full agentic loop; built-in tools |
| Multiple agents + routing logic | Orchestration | Multi-agent system; often combined with Client SDK |

See `CLAUDE_SDKS_EXPLAINED.md` for deeper comparison and decision logic.

## Project-Specific Notes

### Customer Support System (`hub-and-spoke-architecture/customer-support-system/`)

The most recent and complete example of hub-and-spoke architecture:

**Running it**:
```bash
npm install
export ANTHROPIC_API_KEY=sk-...
npm run dev
# Visit http://localhost:3000
```

**Key architecture**:
- `lib/agents/orchestrator.ts` — Routes issues to appropriate subagent and synthesizes response
- `lib/agents/subagents.ts` — Billing, Technical, Account agents (each autonomous)
- `lib/agents/base-agent.ts` — Base reasoning loop for all agents
- `app/api/support/route.ts` — API endpoint that orchestrates the flow

**Important**: Each subagent runs its own **independent reasoning loop** using Claude, not just calling functions. The orchestrator uses `claude-opus-5` for intelligent routing and synthesis.

### Study Materials

Located in `Domain1_AgenticArchitectureOrchestration/`:
- `Domain1-AgenticArchitecture.md` — Deep conceptual guide
- `Domain1-Quiz.md` — Certification exam questions
- `Multi-Agent-Topologies.md` — Patterns: sequential, parallel, hierarchical, mesh
- `Model-Driven-vs-Code-Driven-Decision-Making.md` — When Claude decides vs. code decides

## Common Tasks

### Adding a new agentic project

1. Choose the SDK (Client or Agent) based on `CLAUDE_SDKS_EXPLAINED.md`
2. Create directory under `anthropic-client-sdk/` or `claude-agent-sdk/` 
3. If using Python: create `requirements.txt` with dependencies (see existing projects)
4. If using Node: create `package.json` with `@anthropic-ai/sdk` or `@anthropic-ai/claude-agent-sdk`
5. Store `ANTHROPIC_API_KEY` in `.env` file (already in `.gitignore`)

### Exploring multi-agent patterns

- **Hub-and-spoke**: See `hub-and-spoke-architecture/customer-support-system/`
- **Sequential agents**: Each project has independent reasoning; compose via orchestrator
- **Autonomous reasoning loops**: See `base-agent.ts` for the pattern — loop until `stop_reason === "end_turn"`

### Understanding tool-use loops

- **Manual loop (Client SDK)**: See `my-python-weather-app/` for explicit `while` loop checking `stop_reason`
- **Automated loop (Agent SDK)**: `query()` handles the loop internally; you provide tools via MCP
- **Orchestrated loops**: See `customer-support-system/` where orchestrator manages multiple agent loops

## Model Versions

Projects in this repo use:
- `claude-opus-5` — Reasoning-heavy tasks (multi-turn autonomous workflows, orchestration)
- `claude-sonnet-5` — Lighter tasks (can substitute where latency matters)

The latest models are specified in code or package files; avoid pinning to older models without confirming the trade-off (cost vs. reasoning capability).

## Environment Setup

All projects require `ANTHROPIC_API_KEY`. Set it:

```bash
# Command line
export ANTHROPIC_API_KEY=sk-...

# Or in .env file (automatically loaded by python-dotenv / dotenv)
ANTHROPIC_API_KEY=sk-...
```

The `.env` files in hub-and-spoke projects are gitignored; create them locally.

## Git Conventions

- Commits are atomic and follow conventional commit format (feat:, fix:, docs:, chore:)
- Branch name: typically `main`
- Recent commits add features (weather apps, decision-making examples, hub-and-spoke systems)

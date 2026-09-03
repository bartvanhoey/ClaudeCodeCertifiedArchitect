# ClaudeCodeCertifiedArchitect

A comprehensive learning repository for understanding Claude AI, agentic architecture patterns, and building multi-agent systems using Anthropic's SDKs.

## Overview

This repository contains hands-on examples and study materials for mastering:
- **Agentic architecture** — Building AI agents that reason autonomously
- **Anthropic Client SDK** — The official Claude API wrapper for custom agents
- **Claude Agent SDK** — A batteries-included agent framework with built-in tools
- **Multi-agent orchestration** — Hub-and-spoke and other topologies for coordinating specialized agents
- **Tool-use patterns** — How agents interact with external systems

## What's Inside

### Domain 1: Agentic Architecture & Orchestration

Located in `Domain1_AgenticArchitectureOrchestration/`:

#### Anthropic Client SDK Examples
Build custom agents using the Claude API directly:
- **`my-python-weather-app/`** — Synchronous Python agent with manual tool-use loop
- **`my-nextjs-weather-app/`** — Next.js frontend calling Claude API routes
- **`my-python-event-creator-app/`** — Event scheduling agent
- **`my-python-stop-reason/`** — Demonstrates stop reason handling
- **`code-driven-decision-making/`** — Explores when code decides vs. model decides
- **`model-driven-decision-making/`** — Companion example with model-driven approach

#### Claude Agent SDK Examples
Use the Agent SDK's built-in tools and autonomous loop:
- **`bugfinding-fixing-agent/`** — TypeScript agent that autonomously finds and fixes bugs in code
- **`my-typescript-weather-app-agent-sdk/`** — Weather agent using built-in tools (Read, Bash, Grep)

#### Hub-and-Spoke Architecture
Multi-agent systems with orchestration:
- **`basic-hub-and-spoke/`** — Minimal orchestration pattern
- **`customer-support-system/`** — Full-featured example: hub routes issues to specialized subagents (Billing, Technical, Account)
- **`job-application-screener/`** — Demonstrates screening workflow with multiple agents

#### Study Materials
- **`Domain1-AgenticArchitecture.md`** — Deep conceptual guide to agentic systems
- **`Domain1-Quiz.md`** — Certification exam preparation questions
- **`Multi-Agent-Topologies.md`** — Patterns including sequential, parallel, hierarchical, and mesh
- **`Model-Driven-vs-Code-Driven-Decision-Making.md`** — When to let Claude decide vs. hardcode logic

### Reference Materials

- **`CLAUDE_SDKS_EXPLAINED.md`** — Comprehensive comparison of the two Anthropic SDKs, with decision logic
- **`CLAUDE.md`** — Developer guide for working within this repository
- **`ExamGuide.pdf`** — Certification preparation materials
- **`StudyGuide.pdf`** — Complete learning guide for the domain

## Quick Start

### Python Projects

```bash
# Choose a project
cd Domain1_AgenticArchitectureOrchestration/anthropic-client-sdk/my-python-weather-app

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set your API key
export ANTHROPIC_API_KEY=sk-...

# Run the agent
python main.py
```

### Node.js / Next.js Projects

```bash
# Choose a project
cd Domain1_AgenticArchitectureOrchestration/hub-and-spoke-architecture/customer-support-system

# Install dependencies
npm install

# Set your API key
export ANTHROPIC_API_KEY=sk-...

# Start development server
npm run dev

# Visit http://localhost:3000
```

### Claude Agent SDK Projects

```bash
cd Domain1_AgenticArchitectureOrchestration/claude-agent-sdk/bugfinding-fixing-agent

npm install
export ANTHROPIC_API_KEY=sk-...

# Run with tsx (TypeScript executor)
npx tsx index.ts
```

## Key Concepts

### Anthropic Client SDK
- **What**: Thin HTTP wrapper around Claude Messages API
- **Pattern**: Send request → get completion (or manage tool-use loop yourself)
- **Best for**: Custom agents, one-off completions, full control
- **Languages**: Python, TypeScript, Java, Go, Ruby, C#, PHP

### Claude Agent SDK
- **What**: Claude Code's harness as a library
- **Built-in tools**: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
- **Pattern**: Call `query(prompt)` → SDK drives entire loop autonomously
- **Best for**: Batteries-included coding/filesystem agent
- **Languages**: Python, TypeScript/Node.js only

### Hub-and-Spoke Architecture
- **Hub**: Orchestrator that routes requests and synthesizes responses
- **Spokes**: Specialized autonomous agents with independent reasoning loops
- **Key insight**: Each agent runs its own Claude conversation, not just function calls
- **Example**: Customer support system with Billing, Technical, and Account subagents

## Repository Structure

```
Domain1_AgenticArchitectureOrchestration/
├── anthropic-client-sdk/          # Projects using Anthropic Client SDK
│   ├── my-python-weather-app/
│   ├── my-nextjs-weather-app/
│   ├── code-driven-decision-making/
│   └── ...other examples
├── claude-agent-sdk/              # Projects using Claude Agent SDK
│   ├── bugfinding-fixing-agent/
│   └── my-typescript-weather-app-agent-sdk/
├── hub-and-spoke-architecture/    # Multi-agent orchestration
│   ├── basic-hub-and-spoke/
│   ├── customer-support-system/   # Most complete example
│   └── job-application-screener/
├── Domain1-AgenticArchitecture.md
├── Domain1-Quiz.md
├── Multi-Agent-Topologies.md
└── Model-Driven-vs-Code-Driven-Decision-Making.md
```

## Development Guide

### Before Starting

1. **Choose your SDK**: Read `CLAUDE_SDKS_EXPLAINED.md` to understand which SDK fits your use case
2. **Set up Python/Node**: Ensure Python 3.8+ and Node.js 18+ are installed
3. **Get an API key**: Obtain your `ANTHROPIC_API_KEY` from [console.anthropic.com](https://console.anthropic.com)

### Common Commands

**Python projects**:
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

**Node.js projects**:
```bash
npm install
npm run dev        # Start dev server (Next.js)
npm run lint       # Lint code
npm run build      # Build for production
```

### Models Used

Projects in this repository use:
- `claude-opus-5` — For reasoning-heavy tasks (autonomous workflows, orchestration)
- `claude-sonnet-5` — For lighter tasks (substitute when latency matters)

Check individual project files for the model version being used.

## Example Projects Walkthrough

### Customer Support System (Most Complete Example)

A hub-and-spoke architecture demonstrating multi-agent orchestration:

```bash
cd Domain1_AgenticArchitectureOrchestration/hub-and-spoke-architecture/customer-support-system
npm install && export ANTHROPIC_API_KEY=sk-... && npm run dev
```

**Architecture**:
- `orchestrator.ts` — Analyzes issue, routes to correct subagent, synthesizes response
- `subagents.ts` — Billing, Technical, and Account agents (each autonomous)
- `base-agent.ts` — Base reasoning loop (loops until stop_reason === "end_turn")
- `tools.ts` — Shared tool registry

**Try these test issues**:
1. Billing: "I was charged twice for my subscription"
2. Technical: "My API keeps timing out"
3. Account: "How do I upgrade my tier?"

### Bugfinding & Fixing Agent (Agent SDK Example)

An autonomous TypeScript agent that finds and fixes bugs:

```bash
cd Domain1_AgenticArchitectureOrchestration/claude-agent-sdk/bugfinding-fixing-agent
npm install && export ANTHROPIC_API_KEY=sk-... && npx tsx index.ts
```

Uses Claude Agent SDK's built-in tools (Read, Edit, Bash) to autonomously debug code.

## Study Materials

This repository includes comprehensive learning resources:

- **Conceptual guides** (`Domain1-AgenticArchitecture.md`) — Understand agent design patterns
- **Topology patterns** (`Multi-Agent-Topologies.md`) — Sequential, parallel, hierarchical, mesh
- **Decision-making patterns** (`Model-Driven-vs-Code-Driven-Decision-Making.md`) — When to use each approach
- **Quiz questions** (`Domain1-Quiz.md`) — Test your understanding

## Comparing the SDKs

| Feature | Client SDK | Agent SDK |
|---------|-----------|----------|
| **What it is** | API client | Full harness |
| **Built-in tools** | None | Read/Write/Edit/Bash/Glob/Grep |
| **Tool loops** | You manage | Automatic |
| **Languages** | 7+ | Python, Node.js only |
| **Deployment** | You host | You host |
| **Complexity** | Higher control, more code | Lower control, faster to build |

See `CLAUDE_SDKS_EXPLAINED.md` for detailed comparison and decision guide.

## Environment Setup

All projects require the Anthropic API key:

```bash
# Set in shell
export ANTHROPIC_API_KEY=sk-your-key-here

# Or create .env file (automatically loaded)
ANTHROPIC_API_KEY=sk-your-key-here
```

API keys are automatically excluded from git via `.gitignore`.

## Contributing

This is a learning repository. To extend it:

1. Create a new project directory following the existing naming pattern
2. Choose the appropriate SDK (`anthropic-client-sdk/` or `claude-agent-sdk/`)
3. Add a `README.md` specific to your project
4. Include a `requirements.txt` (Python) or `package.json` (Node.js)
5. Document how to run the project in your `README.md`

## License

This repository is provided as-is for educational purposes.

## Resources

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Claude Agent SDK on GitHub](https://github.com/anthropics/anthropic-sdk-python)
- [Claude Models](https://docs.anthropic.com/claude/reference/models-overview)
- [Building Agents](https://docs.anthropic.com/anthropic/reference/basic-tool-use)

## Next Steps

1. **New to agentic AI?** Start with `CLAUDE_SDKS_EXPLAINED.md` then pick a simple example like `my-python-weather-app/`
2. **Want multi-agent patterns?** Explore `hub-and-spoke-architecture/customer-support-system/`
3. **Building custom agents?** Read `Domain1-AgenticArchitecture.md` then modify an existing example
4. **Preparing for certification?** Study `Domain1-Quiz.md` and `StudyGuide.pdf`

# Customer Support System - Project Guide

## Overview
This is a hub-and-spoke AI architecture demonstration using Next.js, TypeScript, and Claude API.

## Key Files

### Agent Infrastructure
- `lib/agents/types.ts` - TypeScript interfaces for agents and tools
- `lib/agents/tools.ts` - Tool registry and definitions
- `lib/agents/base-agent.ts` - Base class with autonomous reasoning loop
- `lib/agents/subagents.ts` - Billing, Technical, and Account agents
- `lib/agents/orchestrator.ts` - Hub that routes and synthesizes

### Frontend & API
- `app/page.tsx` - Main UI for submitting support requests
- `app/api/support/route.ts` - POST endpoint that triggers orchestration
- `app/layout.tsx` - Root layout with metadata
- `app/globals.css` - Tailwind styles

### Configuration
- `package.json` - Dependencies (Next.js, React, Anthropic SDK)
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS setup
- `.eslintrc.json` - ESLint rules

## Running the Application

```bash
# Install dependencies
npm install

# Set your API key
export ANTHROPIC_API_KEY=your_key_here

# Start dev server
npm run dev

# Visit http://localhost:3000
```

## How It Works

1. **User submits issue** at `/` with customer ID and description
2. **API route** (`/api/support`) receives request
3. **Orchestrator** routes issue to appropriate subagent
4. **Subagent** autonomously processes using available tools
5. **Orchestrator** synthesizes response
6. **Response** displayed to user

## Architecture Notes

- Each subagent has **independent reasoning loops** (not simple function calls)
- Tools are **shared infrastructure** with per-agent permissions
- Routing is **dynamic** based on issue content
- Synthesis ensures **consistent customer experience**

See `ARCHITECTURE.md` for deeper technical details.

## Testing

Try these example issues:
1. Billing: "I was charged twice for my subscription this month"
2. Technical: "My API service keeps timing out"
3. Account: "I need to update my email and upgrade my tier"

## Model

Uses `claude-opus-5` for:
- Routing decisions
- Subagent autonomous processing
- Response synthesis

This model provides strong reasoning needed for multi-turn autonomous workflows.

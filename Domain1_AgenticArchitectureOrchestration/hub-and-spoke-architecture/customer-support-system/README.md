# Customer Support System

A hub-and-spoke AI architecture for customer support with specialized subagents.

## Architecture

This application demonstrates a true hub-and-spoke pattern with:

- **Orchestrator Agent (Hub)**: Routes customer issues to appropriate specialized agents and synthesizes responses
- **Billing Agent (Spoke)**: Handles billing inquiries, refunds, invoices, payments
- **Technical Agent (Spoke)**: Diagnoses and resolves technical issues
- **Account Agent (Spoke)**: Manages account information and complex issues

## Key Features

✅ **Dynamic Routing** - Issues are intelligently routed based on content
✅ **Autonomous Subagents** - Each agent has independent reasoning loops and tool access
✅ **Tool-Based Actions** - Agents can call tools to check balances, restart services, etc.
✅ **Intelligent Synthesis** - Hub synthesizes agent findings into customer-facing responses
✅ **Scalable Design** - Easy to add new agents or tools

## Difference from Simple Spoke Functions

Unlike simple function calls:
- Agents **decide** what tools to use based on the issue
- Agents **reason** through problems autonomously
- Agents **iterate** if they need more information
- Each agent has **domain-specific expertise** and tools

This is true hub-and-spoke with real subagents, not just function dispatch.

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to test the system.

## Example Issues to Try

1. **Billing**: "I was charged twice for my subscription this month. Can I get a refund?"
2. **Technical**: "My API service keeps timing out. I'm getting connection refused errors."
3. **Account**: "I need to update my email address and upgrade my account tier."

## Environment

Add your Anthropic API key:
```
ANTHROPIC_API_KEY=your_key_here
```

# Claude Agent SDK vs. Anthropic Client SDK

Anthropic ships two different things that both get called "the SDK." They solve different problems and are not interchangeable.

## Anthropic Client SDK (`anthropic` / `@anthropic-ai/sdk` / `Anthropic` for .NET / etc.)

This is the official API client for the Claude API (the Messages API). It's a thin wrapper around `POST /v1/messages` and the other Claude API endpoints.

Use it to:
- Send a single request and get a completion back
- Build your own tool-use loop, or use the beta **Tool Runner** helper to automate that loop for tools *you define*
- Handle streaming, prompt caching, batch processing, file uploads, structured outputs, token counting, etc.

**It has no built-in tools.** No filesystem access, no bash, no sandbox. You define every tool yourself and you host all the compute. It's the foundation everything else (including the Agent SDK and Managed Agents) is built on.

Available for: Python, TypeScript/JavaScript, Java, Go, Ruby, C#, PHP, and raw HTTP/cURL.

```python
import anthropic
client = anthropic.Anthropic()
response = client.messages.create(
    model="claude-opus-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
)
```

```csharp
using Anthropic;
using Anthropic.Models.Messages;

AnthropicClient client = new();
var response = await client.Messages.Create(new MessageCreateParams
{
    Model = "claude-opus-5",
    MaxTokens = 1024,
    Messages = [ new() { Role = Role.User, Content = "Hello, Claude" } ],
});
```

## Claude Agent SDK (`claude-agent-sdk` / `@anthropic-ai/claude-agent-sdk`)

This is a **separate package** — it's Claude Code (the CLI coding agent) packaged as a library. It ships:
- The full agentic loop, already built
- Built-in tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
- Context management, hooks, subagents, permissions, and sessions — the same harness logic Claude Code itself runs on

You call `query(prompt, options)` and it drives the entire loop, including deciding which built-in tool to use and executing it.

Available for: **Python and TypeScript/Node.js only.** There is no official .NET/C#, Java, Go, Ruby, or PHP binding.

```python
from claude_agent_sdk import query

async for message in query(prompt="Fix the failing tests in this repo"):
    print(message)
```

### Adding custom tools to the Agent SDK: `createSdkMcpServer`

The Agent SDK exposes *every* tool to Claude through one uniform interface: MCP. Built-ins, remote MCP servers, and your own functions all end up looking the same (`mcp__<server>__<tool>`). Since `query()` owns the agentic loop internally, there's no `execute_tool()`-style dispatch hook like you'd write with the Client SDK — MCP is the only registration path.

`createSdkMcpServer` lets your own functions join that system without actually running a separate MCP server: it wraps `tool()` definitions into something that behaves like an MCP server to the SDK, but stays in-process — no subprocess, no port, no network hop.

```ts
const travelServer = createSdkMcpServer({
  name: "travel-tools",
  tools: [weatherTool, bookFlightTool, bookHotelTool], // each built with tool()
});

query({ prompt, options: { mcpServers: { "travel-tools": travelServer } } });
```

Only needed when Claude must call a tool that isn't already a built-in or a real external MCP server — an agent using only `Read`/`Bash`/`Grep` never touches it.

## Side-by-side

| | Client SDK (+ Tool Runner) | Claude Agent SDK |
|---|---|---|
| What it is | API wrapper, optionally with a tool-calling loop helper | Claude Code's harness, packaged as a library |
| Built-in tools | None — you define every tool | Read / Write / Edit / Bash / Glob / Grep / WebSearch / WebFetch out of the box |
| Languages | Python, TypeScript, Java, Go, Ruby, C#, PHP, cURL | Python, TypeScript only |
| Deployment | You host and run it | You host and run it (same as Client SDK) |
| Best for | Custom agents, one-off completions, workflows you fully control | A batteries-included coding/filesystem agent running on your own infra |

Both are **harness-only** — in both cases, you own the hosting and deployment. Neither is **Managed Agents**, which is Anthropic's separate hosted-agent product where Anthropic runs the agent loop *and* provisions the sandbox container for you.

## Quick decision guide

- **Need to call Claude for text generation, classification, extraction, or a simple chat feature?** → Client SDK, plain `messages.create()`.
- **Building a custom agent with your own tools (e.g. calling internal APIs, a specific database)?** → Client SDK + Tool Runner (or a manual loop).
- **Want a ready-made coding/filesystem agent — essentially Claude Code without the terminal — embedded in your app?** → Claude Agent SDK (Python or Node only).
- **Working in C#/.NET, Java, Go, Ruby, or PHP and want an agent with built-in file/bash tools?** → No direct Agent SDK option. Either shell out to the Python/Node Agent SDK as a subprocess, or use the Client SDK's Tool Runner and define your own tools, or use Managed Agents (Anthropic-hosted loop + sandbox), which the C# SDK supports via its beta `client.Beta.Agents` / `Sessions` surface.

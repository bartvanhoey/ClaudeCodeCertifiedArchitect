import { query } from "@anthropic-ai/claude-agent-sdk";
// Agentic loop: streams messages as Claude works
// This code has 3 main parts:
// 1. query: main entry point that creates the agentic loop and streams messages as Claude works.
// 2. prompt: what you want Claude to do. Claude figures out which tools to use and how to use them.
// 3. options: configuration for the agent:
// - allowedTools: specifies which tools Claude can use, and permissionMode specifies whether
// to auto-approve tool calls or ask for approval.
// - permissionMode: acceptEdits.

// The async for loop keeps running as Claude thinks, calls tools, observes results, and decides what to do next.
// Each iteration yields a message: Claude’s reasoning, a tool call, a tool result, or the final outcome.
// The SDK handles the orchestration, tool execution, context management, and retries, so you consume the stream.
// The loop ends when Claude finishes the task or hits an error.

// The message handling inside the loop filters for human-readable output.
// Without filtering, you’d see raw message objects including system initialization and internal state,
// which is useful for debugging but noisy otherwise.

for await (const message of query({
  prompt:
    "Review utils.ts for bugs that would cause crashes. Fix any issues you find.",
  options: {
    allowedTools: ["Read", "Edit", "Glob"], // Auto-approve these tools
    permissionMode: "acceptEdits", // Auto-approve file edits
  },
})) {
  // Print human-readable output
  if (message.type === "assistant" && message.message?.content) {
    for (const contentBlock of message.message.content) {
      console.log("Claude contentBlock:", contentBlock); // Claude's reasoning or tool call
      if (contentBlock.type === "text") {
        console.log(contentBlock.text); // Claude's reasoning
      } else if ("name" in contentBlock) {
        console.log(`Tool: ${contentBlock.name}`); // Tool being called
      }
    }
  } else if (message.type === "result") {
    console.log(`Done: ${message.subtype}`); // Final result
  }
}

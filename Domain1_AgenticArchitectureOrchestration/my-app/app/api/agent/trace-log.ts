import type { ContentBlock } from "@anthropic-ai/sdk/resources/messages";

export type TraceEntry = {
  type: "text" | "tool_call" | "tool_result";
  content: string;
};

export class TraceLog {
  private entries: TraceEntry[] = [];

  addText(content: string) {
    this.entries.push({ type: "text", content });
  }

  addToolCall(name: string, input: unknown) {
    this.entries.push({
      type: "tool_call",
      content: `${name}(${JSON.stringify(input)})`,
    });
  }

  

  addToolResult(content: string) {
    console.log("Tool result:", content);
    this.entries.push({ type: "tool_result", content });
  }

  addPauseTurn() {
    console.log("Pause turn received.");
    this.addText("[Pause turn]");
  }

  addMaxTokens() {
    console.log("Max tokens reached.");
    this.addText("[Response truncated due to max tokens]");
  }

  addStopSequence() {
    console.log("Stop sequence reached.");
    this.addText("[Response stopped due to stop sequence]");
  }

  addEndTurn() {
    console.log("End of turn reached.");
    this.addText("[End of turn]");
  }

  addRefusal() {
    console.log("Refusal received.");
    this.addText("[Refusal]");
  }

  toArray(): TraceEntry[] {
    return this.entries;
  }
}

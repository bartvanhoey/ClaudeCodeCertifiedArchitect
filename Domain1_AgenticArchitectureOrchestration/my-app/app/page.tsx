"use client";

import { useState } from "react";
import type { TraceEntry } from "./api/agent/trace-log";

export default function Home() {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [traceLog, setTraceLog] = useState<TraceEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!instruction.trim()) return;
    setLoading(true);
    setError(null);
    setTraceLog(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setTraceLog(data.traceLog);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 font-sans dark:bg-black">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="e.g. Book me a flight and a 5-night hotel stay in Paris if it does not rain and the temperature is above 18°C"
          className="h-12 w-lg rounded-full border border-black/8 bg-white px-5 text-base text-black outline-none transition-colors focus:border-black/20 dark:border-white/[.145] dark:bg-black dark:text-zinc-50 dark:focus:border-white/30"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="h-12 rounded-full bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {loading ? "Working..." : "Submit"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {traceLog && (
        <div className="w-full max-w-lg space-y-2 rounded-2xl border border-black/8 bg-white p-4 text-sm dark:border-white/[.145] dark:bg-zinc-900">
          {traceLog.map((entry, i) => (
            <div key={i} className="text-black dark:text-zinc-50">
              <span className="mr-2 font-medium text-zinc-500 dark:text-zinc-400">
                {entry.type === "text" ? "Claude:" : entry.type === "tool_call" ? "Tool call:" : "Tool result:"}
              </span>
              <span className="font-mono text-xs">{entry.content}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

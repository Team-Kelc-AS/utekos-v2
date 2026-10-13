import type { ToolCallPart } from "@tanstack/ai/client";

export function ToolCallDisplay({ part }: { part: ToolCallPart }) {
  if (part.state === "awaiting-input") {
    return <div>🔄 Waiting for arguments...</div>;
  }

  if (part.state === "input-streaming") {
    return <div>📥 Receiving arguments...</div>;
  }

  if (part.state === "input-complete") {
    return <div>✓ Arguments received, running tool...</div>;
  }

  // Completion shows up as a populated `part.output` (and as a sibling
  // `tool-result` part whose state is `complete` / `error`).
  if (part.output) {
    return <div>✅ Tool complete</div>;
  }

  return null;
}

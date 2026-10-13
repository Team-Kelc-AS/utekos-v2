import { clientTools } from "@tanstack/ai-react";
import { toolDefinition } from "@tanstack/ai/client";

const notify = toolDefinition({
  name: "notify",
  description: "Show a notification",
}).client(() => ({ ok: true }));

// Equivalent to `export const tools = [notify]` — just captured explicitly.
export const tools = clientTools(notify);

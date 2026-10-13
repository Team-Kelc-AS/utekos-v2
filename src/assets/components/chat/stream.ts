import "server-only";

import { anthropicText } from "@tanstack/ai-anthropic";
import { chat, type ModelMessage } from "@tanstack/ai";
import { webSearchTool } from "@tanstack/ai-anthropic/tools";

export function createNewsStream(messages: ModelMessage[]) {
  return chat({
    adapter: anthropicText("claude-opus-4-6"),
    messages,
    tools: [webSearchTool({ name: "web_search", type: "web_search_20250305", max_uses: 3 })],
  });
}

import "server-only";

import { chat, type ModelMessage } from "@tanstack/ai";
import { createMCPClient } from "@tanstack/ai-mcp";
import { openaiText } from "@tanstack/ai-openai";

export async function* createMcpChatStream({ url, messages }: {
  url: string;
  messages: ModelMessage[];
}) {
  const mcp = await createMCPClient({ transport: { type: "http", url } });
  try {
    // Forward every event, including MCP input interrupts, to the caller.
    yield* chat({ adapter: openaiText("gpt-5.5"), messages, mcp: { clients: [mcp] } });
  } finally {
    await mcp.close();
  }
}

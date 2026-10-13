import "server-only";

import { createMCPClient } from "@tanstack/ai-mcp";

export function createSseMcpClient(url: string, headers?: Record<string, string>) {
  return createMCPClient({ transport: { type: "sse", url, headers } });
}

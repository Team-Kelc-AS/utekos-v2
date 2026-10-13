import "server-only";

import { createMCPClient } from "@tanstack/ai-mcp";
import { stdioTransport } from "@tanstack/ai-mcp/stdio";

// A process is started only when the caller explicitly opens this client.
export function createStdioMcpClient(options: Parameters<typeof stdioTransport>[0]) {
  return createMCPClient({ transport: stdioTransport(options) });
}

import "server-only";

import { createMCPServer, inMemoryTaskStore } from "@tanstack/ai-mcp/server";

import { toolDefinition } from "@tanstack/ai";

const taskStore = inMemoryTaskStore();

const buildReport = toolDefinition({
  name: "build_report",
  description: "Build a long report",
  execution: "task",
}).server(async () => {
  const text = await writeReport();
  return { text };
});

async function writeReport() {
  await new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });
  return "Quarterly report";
}

const handler = {
  async fetch(
    request: Request,
    _env: unknown,
    ctx: { waitUntil(promise: Promise<unknown>): void },
  ) {
    const server = createMCPServer({
      name: "reports",
      version: "1.0.0",
      tools: [buildReport],
      taskStore,
      waitUntil: (promise) => ctx.waitUntil(promise),
    });
    return server.fetch(request);
  },
};

export default handler;

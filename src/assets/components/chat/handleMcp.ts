import {
  createMCPServer,
  promptDefinition,
  resourceDefinition,
} from "@tanstack/ai-mcp/server";

import { z } from "zod";

const readme = resourceDefinition({
  name: "readme",
  mimeType: "text/markdown",
  uri: "file:///readme.md",
}).read(async () => ({ text: "# Hello" }));

const file = resourceDefinition({
  name: "file",
  mimeType: "text/plain",
  uriTemplate: "file:///{path}",
  argsSchema: z.object({ path: z.string() }),
}).read(async (_uri, { path }) => ({ text: `The body of ${path}` }));

const summarize = promptDefinition({
  name: "summarize",
  description: "Summarize a topic",
  argsSchema: z.object({ topic: z.string() }),
}).render(async (args) => [{ role: "user", content: args.topic }]);

const server = createMCPServer({
  name: "library",
  version: "1.0.0",
  resources: [readme, file],
  prompts: [summarize],
});

export function handleMcp(request: Request) {
  return server.fetch(request);
}

import "server-only";

import { createMCPServer, jwtVerifier } from "@tanstack/ai-mcp/server";

const server = createMCPServer({
  name: "notes",
  version: "1.0.0",
  auth: {
    verifier: jwtVerifier({
      jwksUrl: "https://auth.example.com/.well-known/jwks.json",
      issuer: "https://auth.example.com/",
      audience: "https://mcp.example.com/mcp",
    }),
  },
});

const handler = {
  async fetch(request: Request) {
    return server.fetch(request);
  },
};

export default handler;

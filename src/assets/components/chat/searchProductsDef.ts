import { toolDefinition } from "@tanstack/ai/client";
import { z } from "zod";

export const searchProductsDef = toolDefinition({
  name: "search_products",
  description: "Search the Utekos product catalog by keyword",
  inputSchema: z.object({
    query: z.string().trim().min(1).max(200),
    limit: z.number().int().min(1).max(20).default(10),
  }),
  outputSchema: z.object({
    results: z.array(z.object({ title: z.string(), href: z.string() })),
  }),
});

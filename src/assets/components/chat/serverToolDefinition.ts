import "server-only";

import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";
import { getSearchIndex } from "@/lib/search/getSearchIndex";
import { filterSearchGroups } from "@/lib/search/filter";
import { searchProductsDef } from "./searchProductsDef";

export const getUserDataDef = toolDefinition({
  name: "get_user_data",
  description: "Get user information from an authorized data source",
  inputSchema: z.object({
    userId: z.string().meta({ description: "The user ID to look up" }),
  }),
  outputSchema: z.object({
    name: z.string(),
    email: z.email(),
    createdAt: z.string(),
  }),
});

type UserRecord = { name: string; email: string; createdAt: Date };

// The caller must supply a lookup scoped to the authenticated user.
// No user-data tool is exposed by the public chat routes.
export function createGetUserDataTool(
  findAuthorizedUser: (userId: string) => Promise<UserRecord | null>,
) {
  return getUserDataDef.server(async ({ userId }) => {
    const user = await findAuthorizedUser(userId);
    if (!user) throw new Error("User not found");
    return {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  });
}

export const searchProducts = searchProductsDef.server(async ({ query, limit }) => {
  const index = await getSearchIndex();
  const groups = filterSearchGroups(
    index.groups.filter((group) => group.label === "Produkter"),
    query,
  );
  return {
    results: groups.flatMap((group) => group.items).slice(0, limit)
      .map(({ title, href }) => ({ title, href })),
  };
});

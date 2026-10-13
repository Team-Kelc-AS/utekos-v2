"use client";

import { loadSearchIndex } from "@/lib/search/client";
import { filterSearchGroups } from "@/lib/search/filter";
import { searchProductsDef } from "./searchProductsDef";

export const searchProducts = searchProductsDef.client(async ({ query, limit }) => {
  const index = await loadSearchIndex();
  const groups = filterSearchGroups(
    index.groups.filter((group) => group.label === "Produkter"),
    query,
  );
  return {
    results: groups.flatMap((group) => group.items).slice(0, limit)
      .map(({ title, href }) => ({ title, href })),
  };
});

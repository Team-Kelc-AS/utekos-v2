import type { SearchIndex } from "./types";

const MAX_AGE = 5 * 60 * 1000;
let cached: { value: SearchIndex; expiresAt: number } | undefined;
let pending: Promise<SearchIndex> | undefined;

// Loaded with the search dialog only. No provider, polling or eager catalog fetch.
export function loadSearchIndex(): Promise<SearchIndex> {
  if (cached && Date.now() < cached.expiresAt) return Promise.resolve(cached.value);
  if (pending) return pending;
  pending = fetch("/api/search-index", { signal: AbortSignal.timeout(15_000), cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Search index unavailable");
      const value: SearchIndex = await response.json();
      if (!Array.isArray(value.groups)) throw new Error("Invalid search index");
      cached = { value, expiresAt: Date.now() + MAX_AGE };
      return value;
    }).finally(() => { pending = undefined; });
  return pending;
}

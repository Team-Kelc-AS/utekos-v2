export type SearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZE = 24;

export function parsePage(value: SearchParams["page"]): number | null {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : null;
}

function isUnusedListingParam(key: string): boolean {
  return /^(?:sort|sort_by|order|q|filter(?:\..*)?|farge|storrelse|kjonn|variant)$/.test(key);
}

// Listings only implement pagination. Remove misleading filter/variant URLs
// while retaining campaign attribution, click IDs and Next's internal params.
// Product-detail routes never use this policy: their option URLs stay crawlable.
export function listingRedirectPath(path: string, params: SearchParams): string | null {
  if (parsePage(params.page) === null) return null;
  const removeFirstPage = params.page === "1";
  if (!removeFirstPage && !Object.keys(params).some(isUnusedListingParam)) return null;

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (isUnusedListingParam(key) || (key === "page" && removeFirstPage) || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
  }
  return query.size ? `${path}?${query}` : path;
}

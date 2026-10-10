import type { CursorConnection } from "@/lib/catalog/paginateConnection";

export async function completeConnection<T>(first: CursorConnection<T>, next: (after: string) => Promise<CursorConnection<T>>) {
  const nodes = [...first.nodes];
  const seen = new Set<string>();
  let page = first;
  while (page.pageInfo.hasNextPage) {
    const cursor = page.pageInfo.endCursor;
    if (!cursor || seen.has(cursor)) throw new Error('Product pagination did not advance');
    seen.add(cursor);
    page = await next(cursor);
    nodes.push(...page.nodes);
  }
  return { nodes };
}


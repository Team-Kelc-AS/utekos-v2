export type CursorConnection<T> = {
  nodes: T[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

// Public URLs use stable page numbers. Shopify cursors stay on the server.
export async function readConnectionPage<T>(
  page: number,
  read: (after: string | null) => Promise<CursorConnection<T>>,
): Promise<{ products: T[]; hasNextPage: boolean }> {
  if (!Number.isSafeInteger(page) || page < 1) throw new Error("Invalid listing page");
  let after: string | null = null;
  const cursors = new Set<string>();

  for (let current = 1; current <= page; current++) {
    const connection = await read(after);
    const { hasNextPage, endCursor } = connection.pageInfo;
    if (hasNextPage && (!endCursor || cursors.has(endCursor))) {
      throw new Error("Shopify listing pagination did not advance");
    }
    if (current === page) return { products: connection.nodes, hasNextPage };
    if (!hasNextPage) return { products: [], hasNextPage: false };
    cursors.add(endCursor!);
    after = endCursor;
  }

  throw new Error("Listing page could not be resolved");
}

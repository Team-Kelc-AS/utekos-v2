import 'server-only';

import { shopifyFetch } from './client';
import { PRODUCT_HANDLES_QUERY } from './queries/products';

type ProductHandlesQuery = {
  products: {
    nodes: Array<{ handle: string }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
};

// Enumerate build-time paths and sitemap URLs. Product data has its own cache.
export async function getProductHandles(): Promise<string[]> {
  const handles = new Set<string>();
  const cursors = new Set<string>();
  let after: string | null = null;

  while (true) {
    const { products }: ProductHandlesQuery = await shopifyFetch<
      ProductHandlesQuery,
      { after: string | null }
    >({
      query: PRODUCT_HANDLES_QUERY,
      variables: { after },
    });

    for (const { handle } of products.nodes) {
      handles.add(handle);
    }

    if (!products.pageInfo.hasNextPage) {
      return [...handles];
    }

    const nextCursor: string | null = products.pageInfo.endCursor;

    if (!nextCursor || cursors.has(nextCursor)) {
      throw new Error('Shopify product pagination did not advance');
    }

    cursors.add(nextCursor);
    after = nextCursor;
  }
}

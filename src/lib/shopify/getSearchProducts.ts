import "server-only";

import { assertProductHandles } from "@/lib/catalog/categories";
import type { CursorConnection } from "@/lib/catalog/paginateConnection";
import type { ProductSummary } from "./getProductListing";
import { shopifyFetch } from "./client";
import { PRODUCT_LIST_QUERY } from "./queries/listings";

export async function getSearchProducts(): Promise<ProductSummary[]> {
  const products = new Map<string, ProductSummary>();
  const cursors = new Set<string>();
  let after: string | null = null;
  while (true) {
    const data: { products: CursorConnection<ProductSummary> } = await shopifyFetch<
      { products: CursorConnection<ProductSummary> },
      { first: number; after: string | null }
    >({ query: PRODUCT_LIST_QUERY, variables: { first: 100, after } });
    assertProductHandles(data.products.nodes.map(({ handle }) => handle));
    for (const product of data.products.nodes) products.set(product.handle, product);
    if (!data.products.pageInfo.hasNextPage) return [...products.values()];
    const cursor = data.products.pageInfo.endCursor;
    if (!cursor || cursors.has(cursor)) throw new Error("Shopify search pagination did not advance");
    cursors.add(cursor);
    after = cursor;
  }
}

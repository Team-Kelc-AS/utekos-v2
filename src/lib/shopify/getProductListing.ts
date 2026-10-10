import "server-only";

import { cache } from "react";
import { cacheLife } from "next/dist/server/use-cache/cache-life";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { assertProductHandles, categories, type ListingKey } from "@/lib/catalog/categories";
import { PAGE_SIZE } from "@/lib/catalog/pagination";
import { readConnectionPage, type CursorConnection } from "@/lib/catalog/paginateConnection";
import { shopifyFetch } from "./client";
import { COLLECTION_LIST_QUERY, PRODUCT_LIST_QUERY, PRODUCT_SUMMARY_QUERY } from "./queries/listings";

export type ProductSummary = {
  handle: string;
  title: string;
  description: string;
};

type Connection = CursorConnection<ProductSummary>;

async function getConnection(collection: string | null, after: string | null): Promise<Connection> {
  "use cache";
  cacheLife("minutes");
  cacheTag("shopify:products", "shopify:collections");

  if (collection !== null) {
    cacheTag(`shopify:collection:${collection}`);
    const data = await shopifyFetch<
      { collection: { products: Connection } | null },
      { handle: string; first: number; after: string | null }
    >({ query: COLLECTION_LIST_QUERY, variables: { handle: collection, first: PAGE_SIZE, after } });

    // A missing publication or API failure is not an empty, indexable category.
    if (!data.collection) throw new Error(`Required Storefront collection unavailable: ${collection}`);
    return data.collection.products;
  }

  const data = await shopifyFetch<{ products: Connection }, { first: number; after: string | null }>({
    query: PRODUCT_LIST_QUERY,
    variables: { first: PAGE_SIZE, after },
  });
  return data.products;
}

async function getSummary(handle: string): Promise<ProductSummary | null> {
  "use cache";
  cacheTag("shopify:products", `shopify:product:${handle}`);
  const { product } = await shopifyFetch<{ product: ProductSummary | null }, { handle: string }>({
    query: PRODUCT_SUMMARY_QUERY,
    variables: { handle },
  });
  if (product) cacheLife("minutes");
  else cacheLife("seconds");
  return product;
}

// Memoize metadata + page reads in one render. Each Shopify cursor page has its own cache.
export const getProductListing = cache(async (key: ListingKey, page: number) => {
  if (!Number.isSafeInteger(page) || page < 1) throw new Error("Invalid listing page");
  const source = key === "all" ? null : categories[key].source;

  if (source?.kind === "selection") {
    const summaries = await Promise.all(source.handles.map(getSummary));
    const products = summaries.filter((product) => product !== null);
    assertProductHandles(products.map(({ handle }) => handle));
    const offset = (page - 1) * PAGE_SIZE;
    return { products: products.slice(offset, offset + PAGE_SIZE), hasNextPage: offset + PAGE_SIZE < products.length };
  }

  const collection = source?.kind === "collection" ? source.handle : null;
  return readConnectionPage(page, async (after) => {
    const connection = await getConnection(collection, after);
    assertProductHandles(connection.nodes.map(({ handle }) => handle));
    return connection;
  });
});

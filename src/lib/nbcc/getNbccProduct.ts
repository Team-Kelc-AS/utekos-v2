import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { shopifyFetch } from "@/lib/shopify/client";
import type { NbccVariant } from "./variants";

const NBCC_PRODUCT_QUERY = `#graphql
  query NbccProduct($handle: String!) {
    product(handle: $handle) {
      handle
      variants(first: 100) {
        nodes {
          id
          availableForSale
          selectedOptions { name value }
          price { amount currencyCode }
        }
        pageInfo { hasNextPage }
      }
    }
  }
`;

export async function getNbccProduct(handle: string) {
  "use cache";
  cacheTag("shopify:products", `shopify:product:${handle}`);
  const { product } = await shopifyFetch<{
    product: { handle: string; variants: { nodes: NbccVariant[]; pageInfo: { hasNextPage: boolean } } } | null;
  }, { handle: string }>({ query: NBCC_PRODUCT_QUERY, variables: { handle } });
  if (product?.variants.pageInfo.hasNextPage) throw new Error("NBCC variant list was truncated");
  if (product) cacheLife("minutes");
  else cacheLife("seconds");
  return product;
}

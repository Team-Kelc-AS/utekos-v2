import "server-only";

import type { Money, ProductCollection, ProductVariant } from "@/lib/shopify/product-types";
import type { CommerceProduct } from "@/lib/shopify/commerce";
import type { CursorConnection } from "@/lib/catalog/paginateConnection";
import { shopifyFetch } from "@/lib/shopify/client";

export type RawLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: Money };
  merchandise: ProductVariant & {
    __typename: string;
    product: CommerceProduct & {
      collections: CursorConnection<ProductCollection>;
    };
  };
};
export type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money; totalAmount: Money };
  lines: CursorConnection<RawLine>;
};
export const LINE_FIELDS = `id quantity cost { totalAmount { amount currencyCode } } merchandise { __typename ... on ProductVariant { id title availableForSale currentlyNotInStock quantityAvailable taxable sku barcode price { amount currencyCode } compareAtPrice { amount currencyCode } selectedOptions { name value } image { url altText width height } product { id handle title vendor productType collections(first: 100) { nodes { id title } pageInfo { hasNextPage endCursor } } } } }`;
export const CART_FIELDS = `id checkoutUrl totalQuantity cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } } lines(first: 100) { nodes { ${LINE_FIELDS} } pageInfo { hasNextPage endCursor } }`;

export async function cartRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  buyerIp?: string,
) {
  return shopifyFetch<T, Record<string, unknown>>({
    query,
    variables,
    buyerIp,
    cache: "no-store",
  });
}

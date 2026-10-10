import "server-only";

import type { Cart } from "./types";
import type { ProductCollection } from "@/lib/shopify/product-types";
import type { CursorConnection } from "@/lib/catalog/paginateConnection";
import { authoritativeCartCommerce, cartLineCommerce } from "./commerce";
import { PRODUCT_COLLECTIONS_QUERY } from "@/lib/shopify/queries/products";
import { completeConnection } from "@/lib/shopify/completeConnection";
import { productTitle } from "@/lib/catalog/productTitle";
import { cartCheckoutIdentity } from "./checkout-identity";
import { cartIdentity } from "./identity";
import { CartError } from "./error";
import { CART_FIELDS, LINE_FIELDS, cartRequest, type RawCart, type RawLine } from "./graphql";
import { emptyCart } from "./types";

export { CART_COOKIE } from "./identity";
export { CartError } from "./error";
export type { RawCart } from "./graphql";

export async function readCart(
  id: string,
  buyerIp?: string,
): Promise<RawCart | null> {
  const result = await cartRequest<{ cart: RawCart | null }>(
    `query Cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`,
    { id },
    buyerIp,
  );
  return result.cart;
}
export async function cartView(
  raw: RawCart | null,
  buyerIp?: string,
): Promise<Cart> {
  if (!raw) return emptyCart;
  const lines = [...raw.lines.nodes];
  let page = raw.lines;
  const cursors = new Set<string>();
  while (page.pageInfo.hasNextPage) {
    const after = page.pageInfo.endCursor;
    if (!after || cursors.has(after))
      throw new Error("Cart pagination did not advance");
    cursors.add(after);
    const result = await cartRequest<{
      cart: { lines: CursorConnection<RawLine> } | null;
    }>(
      `query CartLines($id: ID!, $after: String!) { cart(id: $id) { lines(first: 100, after: $after) { nodes { ${LINE_FIELDS} } pageInfo { hasNextPage endCursor } } }`,
      { id: raw.id, after },
      buyerIp,
    );
    if (!result.cart)
      throw new CartError("Handlekurven er utløpt. Åpne den på nytt.", 409);
    page = result.cart.lines;
    lines.push(...page.nodes);
  }
  if (lines.some((l) => l.merchandise.__typename !== "ProductVariant"))
    throw new Error("Unsupported cart merchandise");
  const identity = cartIdentity(raw.id);
  if (!identity) throw new CartError("Handlekurven kunne ikke bekreftes.", 409);
  const mappedLines = await Promise.all(
    lines.map(async (l) => {
      const product = l.merchandise.product;
      const collections = await completeConnection(
        product.collections,
        async (after) => {
          const data = await cartRequest<{
            product: {
              collections: CursorConnection<ProductCollection>;
            } | null;
          }>(
            PRODUCT_COLLECTIONS_QUERY,
            { handle: product.handle, after },
            buyerIp,
          );
          if (!data.product)
            throw new Error(
              "Product disappeared during cart collection pagination",
            );
          return data.product.collections;
        },
      );
      return {
        id: l.id,
        variantId: l.merchandise.id,
        quantity: l.quantity,
        title: productTitle(product),
        handle: product.handle,
        variantTitle: l.merchandise.title,
        available: l.merchandise.availableForSale,
        image: l.merchandise.image,
        total: l.cost.totalAmount,
        commerce: cartLineCommerce(
          { ...product, collections },
          l.merchandise,
          l.quantity,
          l.cost.totalAmount,
        ),
      };
    }),
  );
  return {
    id: identity.publicId,
    checkout: cartCheckoutIdentity(identity.fullId, raw.checkoutUrl),
    totalQuantity: raw.totalQuantity,
    subtotal: raw.cost.subtotalAmount,
    total: raw.cost.totalAmount,
    lines: mappedLines,
    commerce: authoritativeCartCommerce(
      mappedLines.map((line) => line.commerce),
      raw.cost.totalAmount,
    ),
  };
}

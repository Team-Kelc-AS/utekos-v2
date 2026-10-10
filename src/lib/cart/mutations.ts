import "server-only";

import { randomUUID } from "node:crypto";
import { getProduct } from "@/lib/shopify/getProduct";
import { publicVariants } from "@/lib/products/variants";
import { confirmedCartMutation } from "./commerce";
import { CartError } from "./error";
import { CART_FIELDS, cartRequest, type RawCart } from "./graphql";
import { cartView, readCart } from "./server";
import { emptyCart, type CartOperation, type CartResult } from "./types";

export async function mutateCart(
  operation: CartOperation,
  id: string | undefined,
  buyerIp?: string,
): Promise<CartResult & { id: string }> {
  if (operation.action === "add") {
    const product = await getProduct(operation.handle);
    if (
      !product ||
      !publicVariants(product).some((v) => v.id === operation.variantId)
    )
      throw new CartError("Denne varianten kan ikke legges i handlekurven.");
  }
  const existingId = id;
  const before = id
    ? await cartView(await readCart(id, buyerIp), buyerIp)
    : emptyCart;
  if (!existingId && operation.action !== "add")
    throw new CartError("Handlekurven er utløpt. Åpne den på nytt.", 409);
  let name: string,
    declaration: string,
    args: string,
    variables: Record<string, unknown>;
  if (operation.action === "add" && !existingId) {
    name = "cartCreate";
    declaration = "$input: CartInput!";
    args = "input: $input";
    variables = {
      input: {
        buyerIdentity: { countryCode: "NO" },
        lines: [
          { merchandiseId: operation.variantId, quantity: operation.quantity },
        ],
      },
    };
  } else if (operation.action === "add") {
    name = "cartLinesAdd";
    declaration = "$id: ID!, $lines: [CartLineInput!]!";
    args = "cartId: $id, lines: $lines";
    variables = {
      id: existingId,
      lines: [
        { merchandiseId: operation.variantId, quantity: operation.quantity },
      ],
    };
  } else if (operation.action === "update") {
    name = "cartLinesUpdate";
    declaration = "$id: ID!, $lines: [CartLineUpdateInput!]!";
    args = "cartId: $id, lines: $lines";
    variables = {
      id: existingId,
      lines: [{ id: operation.lineId, quantity: operation.quantity }],
    };
  } else {
    name = "cartLinesRemove";
    declaration = "$id: ID!, $lineIds: [ID!]!";
    args = "cartId: $id, lineIds: $lineIds";
    variables = { id: existingId, lineIds: [operation.lineId] };
  }
  const result = await cartRequest<
    Record<
      string,
      {
        cart: RawCart | null;
        userErrors: {
          code: string | null;
          field: string[] | null;
          message: string;
        }[];
        warnings: { message: string }[];
      }
    >
  >(
    `mutation CartMutation(${declaration}) { ${name}(${args}) { cart { ${CART_FIELDS} } userErrors { code field message } warnings { message } } }`,
    variables,
    buyerIp,
  );
  const payload = result[name];
  // Shopify user errors confirm a failed mutation. Only recreate after a fresh
  // read also confirms that the cart is absent; never retry transport failures,
  // whose write outcome is unknown. Existing carts need one request to add.
  if (
    operation.action === "add" &&
    existingId &&
    !payload.cart &&
    payload.userErrors.length &&
    !(await readCart(existingId, buyerIp))
  ) {
    return mutateCart(operation, undefined, buyerIp);
  }
  if (payload.userErrors.length)
    throw new CartError(payload.userErrors.map((e) => e.message).join(" "));
  if (!payload.cart)
    throw new CartError("Handlekurven kunne ikke oppdateres. Prøv igjen.", 409);
  const cart = await cartView(payload.cart, buyerIp);
  return {
    id: payload.cart.id,
    cart,
    warnings: payload.warnings?.map((w) => w.message) ?? [],
    mutation: confirmedCartMutation(
      before,
      cart,
      randomUUID(),
      new Date().toISOString(),
      operation,
    ),
  };
}

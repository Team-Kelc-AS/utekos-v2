import "server-only";

import { CartError } from "./error";
import { cartRequest } from "./graphql";
import { cartIdentity } from "./identity";

type DiscountCart = {
  id: string;
  discountCodes: { code: string; applicable: boolean }[];
};
const fields = "id discountCodes { code applicable }";

export function discountCode(value: string): string {
  const code = value.trim();
  if (!code || code.length > 255 || /[\x00-\x1f\x7f/\\]/u.test(code)) {
    throw new CartError("Ugyldig rabattkode.", 400);
  }
  return code;
}

export function discountDestination(requestUrl: string): URL {
  const source = new URL(requestUrl);
  let target: URL;
  try {
    target = new URL(source.searchParams.get("redirect") || "/", source.origin);
  } catch {
    target = new URL("/", source.origin);
  }
  if (
    target.origin !== source.origin || target.username || target.password ||
    /^\/discount(?:\/|$)/i.test(target.pathname)
  ) target = new URL("/", source.origin);
  for (const [key, value] of source.searchParams) {
    if (key !== "redirect" && !target.searchParams.has(key)) {
      target.searchParams.append(key, value);
    }
  }
  return target;
}

// Use the existing Storefront cart. Shopify alone decides applicability,
// combinations and prices; a shareable link must not replace other codes.
export async function applyDiscountCode(
  value: string,
  cookieId: string | undefined,
  buyerIp?: string,
): Promise<DiscountCart> {
  const code = discountCode(value);
  const id = cartIdentity(cookieId)?.fullId;
  const existing = id ? (await cartRequest<{ cart: DiscountCart | null }>(
    `query DiscountCart($id: ID!) { cart(id: $id) { ${fields} } }`,
    { id }, buyerIp,
  )).cart : null;
  if (existing?.discountCodes.some(item => item.code.toLowerCase() === code.toLowerCase())) return existing;
  const codes = [...(existing?.discountCodes.map(item => item.code) ?? []), code];
  if (codes.length > 250) throw new CartError("Handlekurven har for mange rabattkoder.", 400);
  const name = existing ? "cartDiscountCodesUpdate" : "cartCreate";
  const result = await cartRequest<Record<string, {
    cart: DiscountCart | null;
    userErrors: { message: string }[];
  }>>(
    existing
      ? `mutation ApplyDiscount($id: ID!, $codes: [String!]!) { cartDiscountCodesUpdate(cartId: $id, discountCodes: $codes) { cart { ${fields} } userErrors { message } } }`
      : `mutation CreateDiscountCart($input: CartInput!) { cartCreate(input: $input) { cart { ${fields} } userErrors { message } } }`,
    existing ? { id: existing.id, codes } : { input: { buyerIdentity: { countryCode: "NO" }, discountCodes: codes } },
    buyerIp,
  );
  const payload = result[name];
  if (payload.userErrors.length || !payload.cart || !cartIdentity(payload.cart.id)) {
    throw new CartError("Rabattkoden kunne ikke legges til. Prøv igjen.", 422);
  }
  return payload.cart;
}

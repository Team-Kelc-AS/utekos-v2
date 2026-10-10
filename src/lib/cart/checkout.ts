import "server-only";
import {
  canonicalBeginCheckoutSchema,
  type CanonicalBeginCheckout,
} from "@/lib/analytics/beginCheckoutEvent";
import {
  BEGIN_CHECKOUT_EVENT_ATTRIBUTE,
  FACEBOOK_LOGIN_ID_ATTRIBUTE,
  createCheckoutAttributionSnapshot,
  checkoutAttributionSnapshotToShopifyAttributes,
} from "@/lib/analytics/checkoutAttributionSnapshot";
import { checkoutProductContextToShopifyAttributes } from "@/lib/analytics/checkoutProductContext";
import { resolveTrackingAuthorization } from "@/lib/consent/resolveTrackingAuthorization";
import type { CampaignAttribution } from "@/lib/analytics/campaignAttribution";
import { shopifyFetch } from "@/lib/shopify/client";
import type { Cart } from "./types";
import { CartError } from "./error";

type CheckoutMethod = "shopify" | "klarna";

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

export function parseCheckoutEvent(
  value: unknown,
  cart: Cart,
  origin: string,
  method: CheckoutMethod,
): CanonicalBeginCheckout | null {
  if (value === null || value === undefined) return null;
  const parsed = canonicalBeginCheckoutSchema.safeParse(value);
  if (!parsed.success)
    throw new CartError("Sporingsgrunnlaget for kassen er ugyldig.", 400);
  const event = parsed.data;
  const expectedEnvironment =
    process.env.VERCEL_ENV === "production"
      ? "production"
      : process.env.VERCEL_ENV === "preview"
        ? "preview"
        : "development";
  if (
    event.environment !== expectedEnvironment ||
    new URL(event.page_url).origin !== origin ||
    event.custom_data.cart_id !== cart.id ||
    event.checkout_method !==
      (method === "klarna" ? "klarna_express" : "shopify_checkout") ||
    event.custom_data.checkout_id !== cart.checkout?.checkout_id ||
    event.custom_data.creation_revision !== cart.checkout?.creation_revision
  ) {
    console.warn('checkout_preparation_rejected', {
      stage: 'identity',
      environment: event.environment === expectedEnvironment,
      origin: new URL(event.page_url).origin === origin,
      cart: event.custom_data.cart_id === cart.id,
      method: event.checkout_method === (method === 'klarna' ? 'klarna_express' : 'shopify_checkout'),
      checkout: event.custom_data.checkout_id === cart.checkout?.checkout_id,
      revision: event.custom_data.creation_revision === cart.checkout?.creation_revision,
    });
    throw new CartError("Kassen kunne ikke bekreftes. Prøv igjen.", 409);
  }
  // A newer cart in another tab must not attach stale product/value evidence.
  const {
    currency,
    value: net,
    gross_value,
    tax_value,
    items,
  } = event.custom_data;
  if (
    stable({ currency, value: net, gross_value, tax_value, items }) !==
    stable(cart.commerce)
  ) {
    throw new CartError(
      "Handlekurven ble endret. Kontroller den før du betaler.",
      409,
    );
  }
  return event;
}

export function checkoutAttributes(
  cart: Cart,
  event: CanonicalBeginCheckout | null,
  facebookLoginId?: string,
  campaign?: CampaignAttribution,
) {
  const consent = resolveTrackingAuthorization();
  // Facebook's app-scoped ID is accepted only from the verified, encrypted v2
  // session. Client payloads cannot assert that identity on an order.
  const userData = { ...event?.user_data };
  delete userData.facebook_login_id;
  const snapshot = createCheckoutAttributionSnapshot(
    {
      ...event,
      consent,
      ...(campaign && event ? { campaign } : {}),
      user_data: {
        ...userData,
        ...(facebookLoginId ? { facebook_login_id: facebookLoginId } : {}),
      },
    },
    event?.event_time,
  );
  return [
    ...checkoutAttributionSnapshotToShopifyAttributes(
      snapshot,
      event?.event_id,
    ),
    // Shopify preserves omitted cart keys. Explicitly remove prior identity or
    // checkout correlation when this preparation has no verified replacement.
    ...(!facebookLoginId
      ? [{ key: FACEBOOK_LOGIN_ID_ATTRIBUTE, value: "" }]
      : []),
    ...(!event ? [{ key: BEGIN_CHECKOUT_EVENT_ATTRIBUTE, value: "" }] : []),
    ...checkoutProductContextToShopifyAttributes(cart.commerce?.items ?? []),
    ...(event?.checkout_method
      ? [{ key: "utekos_checkout_method", value: event.checkout_method }]
      : []),
  ];
}

export async function persistCheckoutAttributes(
  fullId: string,
  cart: Cart,
  event: CanonicalBeginCheckout | null,
  facebookLoginId?: string,
  buyerIp?: string,
  campaign?: CampaignAttribution,
) {
  const attributes = checkoutAttributes(cart, event, facebookLoginId, campaign);
  const result = await shopifyFetch<
    {
      cartAttributesUpdate: {
        cart: {
          id: string;
          attributes: { key: string; value: string }[];
        } | null;
        userErrors: { message: string }[];
        warnings: { message: string }[];
      };
    },
    { cartId: string; attributes: typeof attributes }
  >({
    query: `mutation CheckoutAttributes($cartId: ID!, $attributes: [AttributeInput!]!) {
      cartAttributesUpdate(cartId: $cartId, attributes: $attributes) {
        cart { id attributes { key value } } userErrors { message } warnings { message }
      }
    }`,
    variables: { cartId: fullId, attributes },
    buyerIp,
    cache: "no-store",
  });
  const payload = result.cartAttributesUpdate;
  if (
    !payload.cart ||
    payload.cart.id !== fullId ||
    payload.userErrors.length ||
    payload.warnings.length
  )
    throw new CartError("Kassen kunne ikke forberedes. Prøv igjen.", 409);
  const actual = new Map(
    payload.cart.attributes.map((attribute) => [
      attribute.key,
      attribute.value,
    ]),
  );
  const mismatched = attributes.filter(attribute =>
    attribute.value === ''
      ? actual.has(attribute.key) && actual.get(attribute.key) !== ''
      : actual.get(attribute.key) !== attribute.value,
  );
  if (mismatched.length) {
    console.warn('checkout_preparation_rejected', {
      stage: 'attribute_readback', keys: mismatched.map(attribute => attribute.key),
    });
    throw new CartError("Kassen kunne ikke bekreftes. Prøv igjen.", 409);
  }
}

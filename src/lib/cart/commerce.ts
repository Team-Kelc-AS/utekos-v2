import type { CanonicalCommerceValue } from "@/lib/analytics/canonicalCommerceItem";
import { UTEKOS_NORWAY_PRICE_CONTEXT } from "@/lib/analytics/shopifyViewItemCommerce";
import { productCommerce, type CommerceProduct } from "@/lib/shopify/commerce";
import type { Money, ProductVariant } from "@/lib/shopify/product-types";
import type { Cart, CartMutation, CartOperation } from "./types";

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

// Same authoritative price adjustment as the pinned cart-value mapper. Keep
// the catalogue reference price so a real cart discount is not erased.
function applyLineCost(
  item: CanonicalCommerceValue["items"][number],
  grossLineTotal: number,
  quantity: number,
) {
  const gross = round(grossLineTotal / quantity);
  const net = round(gross / (1 + item.tax_rate));
  const reference =
    item.gross_compare_at_unit_price ??
    round(item.gross_unit_price + (item.gross_discount ?? 0));
  const grossDiscount = round(Math.max(reference - gross, 0));
  const discount = round(
    Math.max(round(reference / (1 + item.tax_rate)) - net, 0),
  );
  const result = {
    ...item,
    gross_unit_price: gross,
    unit_price: net,
    tax_amount: round(gross - net),
    ...(discount > 0 ? { discount } : {}),
    ...(grossDiscount > 0 ? { gross_discount: grossDiscount } : {}),
  };
  if (discount === 0) delete result.discount;
  if (grossDiscount === 0) delete result.gross_discount;
  return result;
}

// Shopify's accepted line total includes line discounts. Do not use catalogue
// price as checkout revenue. Event totals retain the exact line-level amount.
export function cartLineCommerce(
  product: CommerceProduct,
  variant: ProductVariant,
  quantity: number,
  total: Money,
): CanonicalCommerceValue {
  const gross = Number(total.amount);
  if (
    !Number.isFinite(gross) ||
    gross < 0 ||
    total.currencyCode !== variant.price.currencyCode
  )
    throw new Error("Invalid cart line money");
  const base = productCommerce(product, variant, quantity);
  const net = round(gross / (1 + base.items[0].tax_rate));
  return {
    ...base,
    gross_value: round(gross),
    value: net,
    tax_value: round(gross - net),
    items: base.items.map((item) => applyLineCost(item, gross, quantity)),
  };
}

export function authoritativeCartCommerce(
  values: CanonicalCommerceValue[],
  total: Money,
): CanonicalCommerceValue | null {
  const combined = combineCommerce(values);
  if (!combined) return null;
  const gross = Number(total.amount);
  if (
    !Number.isFinite(gross) ||
    gross < 0 ||
    total.currencyCode !== combined.currency
  )
    throw new Error("Invalid cart total");
  const ratio =
    combined.gross_value > gross && combined.gross_value > 0
      ? gross / combined.gross_value
      : 1;
  // Preserve the existing Norwegian cart-level tax/value policy from the
  // pinned mapper; Purchase remains the authoritative paid-order calculation.
  const net = round(gross / (1 + UTEKOS_NORWAY_PRICE_CONTEXT.taxRate));
  return {
    currency: combined.currency,
    value: net,
    gross_value: round(gross),
    tax_value: round(gross - net),
    items: values.flatMap((value) =>
      value.items.map((item) =>
        applyLineCost(item, round(value.gross_value * ratio), item.quantity),
      ),
    ),
  };
}

export function combineCommerce(
  values: CanonicalCommerceValue[],
): CanonicalCommerceValue | null {
  if (!values.length) return null;
  const currency = values[0].currency;
  if (values.some((value) => value.currency !== currency))
    throw new Error("Cart currencies differ");
  return {
    currency,
    value: round(values.reduce((sum, value) => sum + value.value, 0)),
    gross_value: round(
      values.reduce((sum, value) => sum + value.gross_value, 0),
    ),
    tax_value: round(values.reduce((sum, value) => sum + value.tax_value, 0)),
    items: values.flatMap((value) => value.items),
  };
}

// Compare confirmed snapshots, including partial Shopify adjustments. The
// requested quantity cannot prove what Shopify actually accepted.
export function confirmedCartMutation(
  before: Cart,
  after: Cart,
  id: string,
  eventTime: string,
  operation?: CartOperation,
): CartMutation {
  const changes: CartMutation["changes"] = [];
  let remaining =
    operation?.action === "add" ? operation.quantity : Number.POSITIVE_INFINITY;
  for (const lineId of new Set(
    [...before.lines, ...after.lines].map((line) => line.id),
  )) {
    const oldLine = before.lines.find((line) => line.id === lineId);
    const newLine = after.lines.find((line) => line.id === lineId);
    const delta = (newLine?.quantity ?? 0) - (oldLine?.quantity ?? 0);
    if (!delta) continue;
    const line = delta > 0 ? newLine! : oldLine!;
    if (operation) {
      if (
        operation.action === "add" &&
        (line.variantId !== operation.variantId || delta < 0)
      )
        continue;
      if (operation.action !== "add" && line.id !== operation.lineId) continue;
      if (operation.action === "remove" && delta > 0) continue;
      if (operation.action === "update") {
        const requestedDelta = operation.quantity - (oldLine?.quantity ?? 0);
        if (!requestedDelta || Math.sign(requestedDelta) !== Math.sign(delta))
          continue;
        remaining = Math.abs(requestedDelta);
      }
    }
    // Another tab's change must never be attributed to this mutation.
    const quantity = Math.min(Math.abs(delta), remaining);
    if (!quantity) continue;
    remaining -= quantity;
    const ratio = quantity / line.quantity;
    const commerce: CanonicalCommerceValue = {
      ...line.commerce,
      value: round(line.commerce.value * ratio),
      gross_value: round(line.commerce.gross_value * ratio),
      tax_value: round(line.commerce.tax_value * ratio),
      items: line.commerce.items.map((item) => ({ ...item, quantity })),
    };
    changes.push({
      event_name: delta > 0 ? "add_to_cart" : "remove_from_cart",
      commerce,
    });
  }
  return {
    id,
    event_time: eventTime,
    cart_id: after.id ?? before.id ?? "",
    changes,
  };
}

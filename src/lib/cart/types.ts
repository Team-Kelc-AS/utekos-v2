import type { Money, ProductImage } from "@/lib/shopify/product-types";

import type { CanonicalCommerceValue } from "@/lib/analytics/canonicalCommerceItem";
export type CartLine = {
  id: string;
  variantId: string;
  quantity: number;
  title: string;
  handle: string;
  variantTitle: string;
  available: boolean;
  image: ProductImage | null;
  total: Money;
  commerce: CanonicalCommerceValue;
};
export type Cart = {
  id: string | null;
  checkout: { checkout_id: string; creation_revision: string } | null;
  totalQuantity: number;
  lines: CartLine[];
  subtotal: Money;
  total: Money;
  commerce: CanonicalCommerceValue | null;
};
export type CartMutation = {
  id: string;
  event_time: string;
  cart_id: string;
  changes: {
    event_name: "add_to_cart" | "remove_from_cart";
    commerce: CanonicalCommerceValue;
  }[];
};
export type CartResult = {
  cart: Cart;
  warnings: string[];
  mutation?: CartMutation;
};
export type CartOperation =
  | { action: "add"; handle: string; variantId: string; quantity: number }
  | { action: "update"; lineId: string; quantity: number }
  | { action: "remove"; lineId: string };
export const emptyCart: Cart = {
  id: null,
  checkout: null,
  commerce: null,
  totalQuantity: 0,
  lines: [],
  subtotal: { amount: "0", currencyCode: "NOK" },
  total: { amount: "0", currencyCode: "NOK" },
};

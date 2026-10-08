'use client';
import type { CanonicalBeginCheckout } from '@/lib/analytics/beginCheckoutEvent';
import type { Cart, CartResult } from './types';
import { productionTrackingEnabled, isTrackingOrigin } from '@/lib/tracking/environment';
import { emitStorefrontAction } from '@/lib/tracking/browser-events';

export type CheckoutTrackingMethod = 'shopify' | 'klarna';
type CheckoutPreparer = (cart: Cart, method: CheckoutTrackingMethod) => Promise<CanonicalBeginCheckout | null>;
let checkoutPreparer: CheckoutPreparer | undefined;

export function registerCheckoutTrackingPreparer(prepare: CheckoutPreparer) {
  checkoutPreparer = prepare;
  return () => { if (checkoutPreparer === prepare) checkoutPreparer = undefined; };
}
export async function prepareCheckoutTracking(cart: Cart, method: CheckoutTrackingMethod) {
  if (!productionTrackingEnabled() || !isTrackingOrigin(window.location.href)) return null;
  if (checkoutPreparer) return checkoutPreparer(cart, method);
  // An immediate checkout click can precede the deferred runtime's effect.
  // Resolve the shared implementation on demand instead of losing attribution.
  const { prepareCanonicalCheckout } = await import('@/lib/tracking/runtime');
  return prepareCanonicalCheckout(cart, method);
}
export function reportCartMutation(result: CartResult) {
  if (result.mutation?.changes.length) emitStorefrontAction('utekos:cart-mutation-confirmed', result.mutation);
}
export function reportCartView(cart: Cart) {
  if (cart.commerce) emitStorefrontAction('utekos:cart-view', cart);
}

export async function persistCheckoutPreparation(cart: Cart, method: CheckoutTrackingMethod) {
  const event = await prepareCheckoutTracking(cart, method);
  const campaign = event
    ? (await import('@/lib/analytics/campaignAttributionSessionStore')).resolveCampaignAttribution(window.location.href)
    : undefined;
  const response = await fetch('/api/cart/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, event, ...(campaign ? { campaign } : {}) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Kassen kunne ikke åpnes.');
  // The same prepared identity is emitted only after a valid handoff and the
  // Shopify attribute write have both been confirmed by the server.
  if (event) {
    const { confirmCheckoutTracking } = await import('@/lib/tracking/runtime');
    await confirmCheckoutTracking(event);
  }
  return result as { checkoutUrl: string };
}

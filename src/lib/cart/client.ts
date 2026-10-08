'use client';
import { useSyncExternalStore } from 'react';
import type { Cart, CartOperation, CartResult } from './types';
import { persistCheckoutPreparation, reportCartMutation } from './tracking';
type State = { cart: Cart | null; open: boolean; pending: boolean; error: string | null; warnings: string[] };
const initial: State = { cart: null, open: false, pending: false, error: null, warnings: [] };
let state = initial;
let loading: Promise<void> | undefined;
let expressCheckoutUncertain = false;
const listeners = new Set<() => void>();
function publish(patch: Partial<State>) { state = { ...state, ...patch }; listeners.forEach(l => l()); }
export function useCartState() { return useSyncExternalStore(subscribe, () => state, () => initial); }
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function seedCart(cart: Cart) { if (!state.cart && !state.pending) publish({ cart }); }
async function responseData(response: Response): Promise<CartResult> {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Handlekurven kunne ikke oppdateres.');
  return data;
}
export function closeCart() { publish({ open: false }); }
// A page restored from the back-forward cache keeps module state, including a
// checkout's navigation lock. Refresh the cart before accepting more changes.
export async function restoreCartAfterNavigation() {
  if (expressCheckoutUncertain) return;
  publish({ pending: false });
  await refreshCart();
}
export async function refreshCart() {
  if (loading || state.pending) return loading;
  loading = fetch('/api/cart', { cache: 'no-store' }).then(responseData)
    .then(data => { publish({ ...data, error: null }); })
    .catch(() => { publish({ error: 'Handlekurven kunne ikke lastes. Prøv igjen.' }); })
    .finally(() => { loading = undefined; });
  return loading;
}
export function openCart() {
  publish({ open: true });
  if (!state.cart) void refreshCart();
}
export async function changeCart(operation: CartOperation): Promise<boolean> {
  if (state.pending) return false;
  publish({ pending: true, error: null, warnings: [] });
  try {
    // Finish any older read before mutating, so it cannot overwrite the response.
    await loading;
    const result = await responseData(await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(operation) }));
    publish({ ...result, open: true });
    reportCartMutation(result);
    return true;
  } catch (error) {
    publish({ error: error instanceof Error ? error.message : 'Prøv igjen.', open: true });
    return false;
  } finally { publish({ pending: false }); }
}
// Keep the cart fixed from Express preparation until Klarna returns. The same
// lock is shared by ordinary cart mutations and the standard checkout button.
export class ExpressPreparationError extends Error {
  constructor(message: string, public cartResult?: CartResult) { super(message); }
}
export async function prepareExpressCheckout<T extends CartResult>(prepare: () => Promise<T>): Promise<T> {
  if (state.pending) throw new Error('Vent til handlekurven er ferdig oppdatert.');
  publish({ pending: true, error: null, warnings: [] });
  try {
    await loading;
    const result = await prepare();
    publish({ cart: result.cart, warnings: result.warnings });
    reportCartMutation(result);
    // Persist the same begin_checkout ID and attribution before Klarna receives
    // its authorization payload. A failed write never submits a payment.
    await persistCheckoutPreparation(result.cart, 'klarna');
    return result;
  } catch (error) {
    // Shopify may have accepted the line before payload validation or the
    // response failed. Reconcile that cart while the shared lock is still held.
    if (error instanceof ExpressPreparationError && error.cartResult) {
      publish({ cart: error.cartResult.cart, warnings: error.cartResult.warnings });
      reportCartMutation(error.cartResult);
    } else {
      try {
        const result = await responseData(await fetch('/api/cart', { cache: 'no-store' }));
        publish({ cart: result.cart, warnings: result.warnings });
      } catch { publish({ error: 'Handlekurven kunne ikke lastes. Prøv igjen.' }); }
    }
    publish({ pending: false });
    throw error;
  }
}
export function finishExpressCheckout() { if (!expressCheckoutUncertain) publish({ pending: false }); }
export const UNCERTAIN_PAYMENT_MESSAGE = 'Betalingsstatus kunne ikke bekreftes. Kontroller kjøpet hos Klarna før du forsøker å betale igjen.';
export function markExpressCheckoutUncertain() {
  expressCheckoutUncertain = true;
  publish({ pending: true, error: UNCERTAIN_PAYMENT_MESSAGE });
}
export async function checkout() {
  if (state.pending) return;
  publish({ pending: true, error: null });
  try {
    await loading;
    const confirmed = await responseData(await fetch('/api/cart', { cache: 'no-store' }));
    publish({ cart: confirmed.cart, warnings: confirmed.warnings });
    const data = await persistCheckoutPreparation(confirmed.cart, 'shopify');
    window.location.assign(data.checkoutUrl);
  } catch (error) {
    publish({ pending: false, error: error instanceof Error ? error.message : 'Kassen kunne ikke åpnes.' });
  }
}

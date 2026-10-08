'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ExpressPreparationError, finishExpressCheckout, markExpressCheckoutUncertain, prepareExpressCheckout, useCartState } from '@/lib/cart/client';
import type { CartResult } from '@/lib/cart/types';
import type { KlarnaExpressOrderPayload } from '@/lib/klarna/contracts';
import { completeKlarnaExpressCheckout, KlarnaCompletionError } from './completeKlarnaExpressCheckout';
import { loadKlarnaExpressCheckoutSdk, loadKlarnaPublicConfig } from './loadKlarna';
import type { KlarnaAuthorize } from './types';
import styles from './KlarnaExpressCheckoutButton.module.css';

type Prepared = CartResult & { orderPayload: KlarnaExpressOrderPayload; shopifyCartId: string };
type Props = { handle: string; variantId: string; disabled?: boolean };

async function prepare(handle: string, variantId: string): Promise<Prepared> {
  const response = await fetch('/api/klarna/prepare', {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handle, variantId }),
  });
  const result = await response.json();
  if (!response.ok) throw new ExpressPreparationError(
    result.error || 'Klarna-kassen kunne ikke forberedes.',
    result.cart && Array.isArray(result.warnings) ? { cart: result.cart, warnings: result.warnings, mutation: result.mutation } : undefined,
  );
  return result;
}

// Migrated from headless's KlarnaProductExpressCheckout and
// KlarnaExpressCheckoutButton. Variant selection is fixed by the product card;
// preparation and order creation use v2's bridge to the existing backend.
export function KlarnaProductExpressCheckout({ handle, variantId, disabled = false }: Props) {
  const suffix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const containerId = `klarna-express-checkout-${suffix}`;
  const hostRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const { pending } = useCartState();
  const current = useRef({ handle, variantId, disabled, pending });
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { current.current = { handle, variantId, disabled, pending }; }, [handle, variantId, disabled, pending]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let inFlight = false;

    async function authorizePurchase(authorize: KlarnaAuthorize) {
      if (inFlight || current.current.disabled || current.current.pending) return;
      inFlight = true;
      let ownsCartLock = false;
      setError(null);
      try {
        const prepared = await prepareExpressCheckout(() => prepare(current.current.handle, current.current.variantId));
        ownsCartLock = true;
        let handled = false;
        authorize({ auto_finalize: true, collect_shipping_address: true }, prepared.orderPayload, result => {
          if (handled) return;
          handled = true;
          // A dismissed flow must release the shared cart lock, and only an
          // approved authorization token may reach the order backend.
          if (result.approved !== true || result.finalize_required === true ||
              typeof result.authorization_token !== 'string' || !result.authorization_token.trim()) {
            finishExpressCheckout();
            inFlight = false;
            if (result.show_form === false || result.finalize_required === true) setError('Klarna er ikke tilgjengelig for dette kjøpet akkurat nå.');
            return;
          }
          void completeKlarnaExpressCheckout(result, prepared).catch(error => {
            if (error instanceof KlarnaCompletionError && error.notSubmitted) {
              finishExpressCheckout();
              inFlight = false;
            } else {
              markExpressCheckoutUncertain();
            }
            setError(error instanceof Error ? error.message : 'Klarna-kjøpet kunne ikke fullføres.');
          });
        });
      } catch (error) {
        if (ownsCartLock) finishExpressCheckout();
        inFlight = false;
        setError(error instanceof Error ? error.message : 'Klarna-kassen kunne ikke forberedes.');
      }
    }

    async function initialize() {
      try {
        const config = await loadKlarnaPublicConfig();
        await loadKlarnaExpressCheckoutSdk();
        if (disposed || initialized.current || !window.Klarna?.Payments.Buttons) return;
        initialized.current = true;
        window.Klarna.Payments.Buttons.init({ client_id: config.client_id }).load({
          container: `#${containerId}`, theme: 'default', shape: 'pill', locale: 'nb-NO',
          on_click: authorize => { void authorizePurchase(authorize); },
        }, result => {
          if (disposed) return;
          if (result.show_form === false) setError('Klarna er ikke tilgjengelig akkurat nå.');
          else setReady(true);
        });
      } catch {
        if (!disposed) setError('Klarna kunne ikke lastes. Prøv igjen senere.');
      }
    }

    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      void initialize();
    }, { rootMargin: '240px 0px', threshold: 0 });
    observer.observe(host);
    return () => { disposed = true; observer.disconnect(); };
  }, [containerId]);

  return (
    <div className="w-full min-w-0 font-sans">
      <div ref={hostRef} inert={disabled || pending} aria-busy={!ready && !error}>
        <div id={containerId} className={styles.host} />
      </div>
      {error && <p role="alert" className="mt-2 text-sm leading-snug">{error}</p>}
    </div>
  );
}

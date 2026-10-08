import type {} from './types';

const SCRIPT_ID = 'klarna-express-checkout-sdk';
let sdkPromise: Promise<void> | undefined;
let configPromise: Promise<{ client_id: string; environment: 'production' | 'playground' }> | undefined;

export function loadKlarnaPublicConfig() {
  return configPromise ??= fetch('/api/klarna/client-config', {
    cache: 'no-store', credentials: 'same-origin', headers: { Accept: 'application/json' },
  }).then(async response => {
    if (!response.ok) throw new Error('Klarna er ikke tilgjengelig akkurat nå.');
    const value = await response.json();
    if (typeof value.client_id !== 'string' || !/^klarna_live_client_\S+$/.test(value.client_id) ||
        !['production', 'playground'].includes(value.environment)) {
      throw new Error('Klarna er ikke tilgjengelig akkurat nå.');
    }
    return value as { client_id: string; environment: 'production' | 'playground' };
  }).catch(error => { configPromise = undefined; throw error; });
}

// One SDK per document, as in headless. Wait for the documented ready callback
// as well as load: the library can finish downloading before Buttons is ready.
// https://docs.klarna.com/acquirer/klarna/express-checkout/integrate-express-checkout/integrate-one-step-express-checkout/
export function loadKlarnaExpressCheckoutSdk(): Promise<void> {
  if (window.Klarna?.Payments?.Buttons) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const priorCallback = window.klarnaAsyncCallback;
    let settled = false;
    const script = document.createElement('script');
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      script.removeEventListener('load', ready);
      script.removeEventListener('error', failed);
      if (window.klarnaAsyncCallback === ready) window.klarnaAsyncCallback = priorCallback;
      if (error) { script.remove(); sdkPromise = undefined; reject(error); }
      else resolve();
    };
    const ready = () => {
      if (settled || !window.Klarna?.Payments?.Buttons) return;
      finish();
      priorCallback?.();
    };
    const failed = () => finish(new Error('Klarna kunne ikke lastes. Prøv igjen senere.'));
    const timeout = window.setTimeout(failed, 15_000);
    window.klarnaAsyncCallback = ready;
    document.getElementById(SCRIPT_ID)?.remove();
    script.id = SCRIPT_ID;
    script.src = 'https://x.klarnacdn.net/kp/lib/v1/api.js';
    script.async = true;
    script.addEventListener('load', ready);
    script.addEventListener('error', failed);
    document.body.append(script);
  });
  return sdkPromise;
}

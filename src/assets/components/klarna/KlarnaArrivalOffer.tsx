'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const KlarnaIdentityModal = dynamic(() => import('./KlarnaIdentityModal').then(module => module.KlarnaIdentityModal));
const dismissedKey = 'utekos:klarna-arrival-dismissed:v1';

export function KlarnaArrivalOffer() {
  const [offer, setOffer] = useState<{ preview: boolean } | null>(null);

  useEffect(() => {
    // These routes complete an existing identity, preference or review task.
    if (/^\/(?:klarna\/identity|handlehjelp\/preferanser|anmeldelse)(?:\/|$)/.test(window.location.pathname)) return;
    try { if (sessionStorage.getItem(dismissedKey)) return; } catch { /* The offer still works without session storage. */ }
    const controller = new AbortController();
    let active = true;
    let timer: number;
    const delay = new Promise<void>(resolve => { timer = window.setTimeout(resolve, 2000); });
    const status = fetch('/api/identity/klarna/status', {
      credentials: 'same-origin', cache: 'no-store',
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
    }).then(async response => {
      if (!response.ok) throw new Error('Klarna status unavailable');
      return response.json() as Promise<{ available: boolean; connected: boolean; originSupported: boolean }>;
    });
    void Promise.all([delay, status]).then(([, identity]) => {
      if (!active || !identity.available || identity.connected || document.querySelector('[role="dialog"]')) return;
      setOffer({ preview: !identity.originSupported });
    }).catch(() => {
      // Optional arrival offer: a failed status request must not interrupt shopping.
    });
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, []);

  return offer && <KlarnaIdentityModal open preview={offer.preview} onOpenChange={open => {
    if (open) return;
    setOffer(null);
    try { sessionStorage.setItem(dismissedKey, '1'); } catch { /* Dismissal remains effective for this mounted visit. */ }
  }} />;
}

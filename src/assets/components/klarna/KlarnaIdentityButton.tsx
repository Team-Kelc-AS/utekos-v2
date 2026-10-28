'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { completeKlarnaIdentity } from './completeKlarnaIdentity';
import { klarnaIdentityIdToken, loadKlarnaIdentitySdk, type KlarnaIdentitySdk } from './loadKlarnaIdentitySdk';
import { KlarnaMarketingPreferences } from './KlarnaMarketingPreferences';

type Status = 'loading' | 'ready' | 'pending' | 'connected' | 'unavailable' | 'error';
type PrepareResponse = { clientId: string; scope: string; redirectUri: string };

export function KlarnaIdentityButton({ returnTo, showDisconnect = true }: {
  returnTo?: string;
  showDisconnect?: boolean;
}) {
  const id = useId().replaceAll(':', '');
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let active = true;
    let clicked = false;
    let button: ReturnType<KlarnaIdentitySdk['Identity']['button']> | undefined;
    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data === 'utekos:klarna-connected' && active) {
        setStatus('connected');
      }
    };
    window.addEventListener('message', onMessage);

    async function setup() {
      const statusResponse = await fetch('/api/identity/klarna/status', { cache: 'no-store' });
      if (!statusResponse.ok) throw new Error('Klarna status unavailable');
      const existing: { available: boolean; connected: boolean } = await statusResponse.json();
      if (!active) return;
      if (!existing.available) { setStatus('unavailable'); return; }
      if (existing.connected) { setStatus('connected'); return; }
      const prepareResponse = await fetch('/api/identity/klarna/prepare', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnTo: returnTo ?? window.location.pathname + window.location.search }), signal: AbortSignal.timeout(15000),
      });
      if (!prepareResponse.ok) throw new Error('Klarna preparation unavailable');
      const config: PrepareResponse = await prepareResponse.json();
      const klarna = await loadKlarnaIdentitySdk(config.clientId);
      if (!active || !container.current) return;
      klarna.Identity.on('signin', async (signinResponse) => {
        if (!active || !clicked) return;
        clicked = false;
        setStatus('pending');
        try {
          await completeKlarnaIdentity(klarnaIdentityIdToken(signinResponse));
          if (active) setStatus('connected');
        } catch {
          const statusResponse = await fetch('/api/identity/klarna/status', { cache: 'no-store' })
            .then(response => response.ok ? response.json() as Promise<{ connected: boolean }> : null)
            .catch(() => null);
          if (active) setStatus(statusResponse?.connected ? 'connected' : 'error');
        }
      });
      klarna.Identity.on('error', async () => { if (active) setStatus('error'); });
      button = klarna.Identity.button({
        clientType: 'public', id: `utekos-klarna-${id}`, locale: 'nb-NO',
        redirectUri: config.redirectUri, scope: config.scope, theme: 'default',
      });
      button.on('ready', async () => { if (active) setStatus('ready'); });
      button.on('click', async () => { clicked = true; });
      button.mount(container.current);
      if (active) setStatus('ready');
    }
    void setup().catch(() => { if (active) setStatus('error'); });
    return () => { active = false; window.removeEventListener('message', onMessage); button?.unmount(); };
  }, [id, returnTo]);

  async function disconnect() {
    setStatus('pending');
    try {
      const response = await fetch('/api/identity/klarna/disconnect', {
        method: 'POST', credentials: 'same-origin', signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('Disconnect failed');
      window.location.reload();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'unavailable') return null;
  return <div className="w-full max-w-sm">
    <div ref={container} className={status === 'loading' || status === 'ready' ? 'min-h-11 w-full [&>*]:w-full!' : 'hidden'} />
    {status === 'loading' && <p role="status">Laster Klarna-innlogging …</p>}
    {status === 'pending' && <p role="status">Bekrefter Klarna-innlogging …</p>}
    {status === 'connected' && <div className="space-y-2">
      <p role="status">Klarna er tilkoblet Utekos.</p>
      <KlarnaMarketingPreferences />
      {showDisconnect && <button type="button" onClick={() => { void disconnect(); }} className="underline underline-offset-4">Logg ut fra Utekos</button>}
    </div>}
    {status === 'error' && <p role="alert">Klarna-innloggingen kunne ikke fullføres. Last siden på nytt og prøv igjen.</p>}
  </div>;
}

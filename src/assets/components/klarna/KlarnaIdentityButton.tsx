'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { completeKlarnaIdentity } from './completeKlarnaIdentity';
import { klarnaIdentityIdToken, loadKlarnaIdentitySdk, type KlarnaIdentitySdk } from './loadKlarnaIdentitySdk';
import { KlarnaMarketingPreferences } from './KlarnaMarketingPreferences';

type Status = 'loading' | 'ready' | 'pending' | 'connected' | 'unavailable' | 'unsupported-origin' | 'error';
type LoadingStage = 'status' | 'prepare' | 'sdk-import' | 'sdk-init' | 'mount' | 'provider';
type PrepareResponse = { clientId: string; scope: string; redirectUri: string };

export function KlarnaIdentityButton({ returnTo, showDisconnect = true, fullWidth = false, customButton }: {
  returnTo?: string;
  showDisconnect?: boolean;
  fullWidth?: boolean;
  customButton?: { className: string; wrapperClassName?: string; children: ReactNode };
}) {
  const id = useId().replaceAll(':', '');
  const container = useRef<HTMLDivElement>(null);
  const customButtonRef = useRef<HTMLButtonElement>(null);
  const custom = !!customButton;
  const [status, setStatus] = useState<Status>('loading');
  const [stage, setStage] = useState<LoadingStage>('status');
  const [errorMessage, setErrorMessage] = useState('Klarna-innloggingen kunne ikke fullføres. Last siden på nytt og prøv igjen.');

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
      const statusResponse = await fetch('/api/identity/klarna/status', {
        cache: 'no-store', signal: AbortSignal.timeout(12000),
      });
      if (!statusResponse.ok) throw new Error('Klarna status unavailable');
      const existing: { available: boolean; connected: boolean; originSupported: boolean } = await statusResponse.json();
      if (!active) return;
      if (!existing.available) { setStatus('unavailable'); return; }
      if (!existing.originSupported) { setStatus('unsupported-origin'); return; }
      if (existing.connected) { setStatus('connected'); return; }
      setStage('prepare');
      const prepareResponse = await fetch('/api/identity/klarna/prepare', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnTo: returnTo ?? window.location.pathname + window.location.search }), signal: AbortSignal.timeout(15000),
      });
      if (!prepareResponse.ok) throw new Error('Klarna preparation unavailable');
      const config: PrepareResponse = await prepareResponse.json();
      const klarna = await loadKlarnaIdentitySdk(config.clientId, nextStage => {
        if (active) setStage(nextStage);
      });
      if (!active || !(custom ? customButtonRef.current : container.current)) return;
      setStage('mount');
      klarna.Identity.on('signin', async (signinResponse) => {
        if (!active || !clicked) return;
        clicked = false;
        setStatus('pending');
        try {
          await completeKlarnaIdentity(klarnaIdentityIdToken(signinResponse));
          if (active) setStatus('connected');
        } catch (error) {
          const statusResponse = await fetch('/api/identity/klarna/status', { cache: 'no-store' })
            .then(response => response.ok ? response.json() as Promise<{ connected: boolean }> : null)
            .catch(() => null);
          if (active) {
            if (!statusResponse?.connected && error instanceof Error) setErrorMessage(error.message);
            setStatus(statusResponse?.connected ? 'connected' : 'error');
          }
        }
      });
      klarna.Identity.on('error', async () => {
        if (active) { setStage('provider'); setStatus('error'); }
      });
      button = klarna.Identity.button({
        clientType: 'public', id: `utekos-klarna-${id}`, locale: 'nb-NO',
        redirectUri: config.redirectUri, scope: config.scope, theme: 'default',
      });
      button.on('ready', async () => { if (active) setStatus('ready'); });
      button.on('click', async () => { clicked = true; });
      if (custom) button.attach(`#utekos-klarna-target-${id}`);
      else button.mount(container.current!);
      if (active) setStatus('ready');
    }
    void setup().catch(() => { if (active) setStatus('error'); });
    return () => { active = false; window.removeEventListener('message', onMessage); button?.unmount(); };
  }, [id, returnTo, custom]);

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
  return <div className={customButton?.wrapperClassName ?? (fullWidth ? 'w-full' : 'w-full max-w-sm')} data-klarna-stage={stage}>
    {customButton ? <button
      ref={customButtonRef}
      id={`utekos-klarna-target-${id}`}
      type="button"
      aria-label="Fortsett med Klarna"
      className={customButton.className}
      disabled={status !== 'ready'}
    >{customButton.children}</button> : <div ref={container} className={status === 'loading' || status === 'ready' ? 'min-h-11 w-full [&>*]:w-full!' : 'hidden'} />}
    {status === 'loading' && <p role="status">Laster Klarna-innlogging …</p>}
    {status === 'pending' && <p role="status">Bekrefter Klarna-innlogging …</p>}
    {status === 'connected' && <div className="space-y-2">
      <p role="status">Klarna er tilkoblet Utekos.</p>
      <KlarnaMarketingPreferences />
      {showDisconnect && <button type="button" onClick={() => { void disconnect(); }} className="underline underline-offset-4">Logg ut fra Utekos</button>}
    </div>}
    {status === 'unsupported-origin' && <p role="status">Denne nettadressen er ikke registrert for Klarna-innlogging. <a href="https://utekos.no/" className="underline underline-offset-4">Fortsett på utekos.no</a>.</p>}
    {status === 'error' && <p role="alert">{errorMessage}</p>}
  </div>;
}

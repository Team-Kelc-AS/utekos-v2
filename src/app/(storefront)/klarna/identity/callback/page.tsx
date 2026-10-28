'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { completeKlarnaIdentity } from '@/components/klarna/completeKlarnaIdentity';
import { klarnaIdentityIdToken, loadKlarnaIdentitySdk } from '@/components/klarna/loadKlarnaIdentitySdk';

export default function KlarnaIdentityCallbackPage() {
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const finish = (returnTo: string) => {
      window.history.replaceState(null, '', '/klarna/identity/callback');
      if (window.opener) {
        window.opener.postMessage('utekos:klarna-connected', window.location.origin);
        window.close();
        window.setTimeout(() => { if (!window.closed) window.location.replace(returnTo); }, 200);
      } else {
        window.location.replace(returnTo);
      }
    };
    void fetch('/api/identity/klarna/status', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Klarna identity unavailable');
        const config: unknown = await response.json();
        if (!config || typeof config !== 'object' || !('clientId' in config) ||
            typeof config.clientId !== 'string') throw new Error('Klarna identity unavailable');
        return loadKlarnaIdentitySdk(config.clientId);
      })
      .then(klarna => {
        if (!active) return;
        klarna.Identity.on('signin', async (signinResponse) => {
          if (!active) return;
          try {
            const returnTo = await completeKlarnaIdentity(klarnaIdentityIdToken(signinResponse));
            if (!active) return;
            finish(returnTo);
          } catch {
            const status = await fetch('/api/identity/klarna/status', { cache: 'no-store' })
              .then(response => response.ok ? response.json() as Promise<{ connected: boolean }> : null)
              .catch(() => null);
            if (!active) return;
            if (status?.connected) finish('/konto');
            else setError(true);
          }
        });
        klarna.Identity.on('error', async () => { if (active) setError(true); });
      })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  return <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-start justify-center gap-4 bg-[#001a18] px-6 text-[#f0eee9]">
    <h1 className="text-2xl font-extrabold">{error ? 'Klarna-innloggingen kunne ikke fullføres' : 'Fullfører med Klarna'}</h1>
    {error ? <Link href="/konto" className="underline underline-offset-4">Tilbake til innlogging</Link> : <p role="status">Bekrefter identiteten din …</p>}
  </main>;
}

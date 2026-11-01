'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './WishlistDialog.module.css';

export function WishlistGoogleLogin({ returnTo }: { returnTo: string }) {
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/identity/google/status', { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) })
      .then(async response => {
        if (!response.ok) throw new Error('Google status unavailable');
        const data: { authenticated: boolean } = await response.json();
        if (!controller.signal.aborted) setConnected(data.authenticated);
      }).catch(() => { if (!controller.signal.aborted) setError('Kunne ikke kontrollere innloggingen. Du kan fortsatt prøve Google.'); });
    return () => controller.abort();
  }, []);

  async function disconnect() {
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/identity/google/disconnect', { method: 'POST', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Google disconnect failed');
      setConnected(false);
    } catch { setError('Kunne ikke logge ut. Prøv igjen.'); }
    finally { setPending(false); }
  }

  return <div className={styles.googleWrapper}>
    {connected ? <div className={styles.googleConnected}>
      <p role="status">Du er logget inn med Google.</p>
      <button type="button" disabled={pending} onClick={() => { void disconnect(); }}>{pending ? 'Logger ut …' : 'Logg ut'}</button>
    </div> : <a href={`/auth/google?${new URLSearchParams({ returnTo })}`} className={styles.google}>
      <Image src="/assets/auth/google-g.png" width={20} height={20} alt="" unoptimized />
      <span>Fortsett med Google</span>
    </a>}
    {error && <p role="alert" className={styles.status}>{error}</p>}
  </div>;
}

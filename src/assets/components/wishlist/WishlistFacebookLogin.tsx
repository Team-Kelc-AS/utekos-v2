'use client';
import { useEffect, useRef, useState } from 'react';
import styles from '@/components/commerce/commerce.module.css';
declare global { interface Window { utekosWishlistFacebookOnLogin?: () => void } }
export function WishlistFacebookLogin({ returnTo }: { returnTo: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'pending' | 'connected' | 'error'>('loading');
  useEffect(() => {
    // Cleanup ignores stale work; requests retain their own bounded lifetime.
    // Strict Mode's setup/cleanup replay must not turn cleanup into a request failure.
    const signal = AbortSignal.timeout(15000);
    let disposed = false;
    let timedOut = false;
    const inactive = () => disposed || timedOut || signal.aborted;
    const timeout = window.setTimeout(() => { timedOut = true; if (!disposed) setState('error'); }, 15000);
    async function prepare() {
      const statusResponse = await fetch('/api/identity/facebook/status', { signal, cache: 'no-store' });
      if (inactive()) return;
      if (!statusResponse.ok) throw new Error('Unavailable');
      const status = await statusResponse.json();
      if (inactive()) return;
      if (status.connected) { setState('connected'); window.clearTimeout(timeout); return; }
      const response = await fetch('/api/identity/facebook/prepare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnTo }), signal });
      if (inactive()) return;
      if (!response.ok) throw new Error('Unavailable');
      const { clientConfig } = await response.json();
      if (inactive()) return;
      const { loadFacebookJavaScriptSdk } = await import('@/lib/facebook-login/loadFacebookJavaScriptSdk');
      if (inactive()) return;
      const sdk = await loadFacebookJavaScriptSdk(clientConfig);
      if (inactive() || !ref.current) return;
      window.utekosWishlistFacebookOnLogin = () => {
        if (disposed || timedOut) return;
        setState('pending');
        sdk.getLoginStatus(result => {
          if (disposed) return;
          if (result.status !== 'connected' || !result.authResponse) { setState('error'); return; }
          void fetch('/api/identity/facebook/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken: result.authResponse.accessToken, userID: result.authResponse.userID }), signal: AbortSignal.timeout(15000) })
            .then(r => { if (!disposed) setState(r.ok ? 'connected' : 'error'); }).catch(() => { if (!disposed) setState('error'); });
        }, true);
      };
      const button = document.createElement('div');
      button.className = 'fb-login-button';
      for (const [key, value] of Object.entries({ size: 'large', width: String(Math.min(360, ref.current.clientWidth)), 'button-type': 'continue_with', 'use-continue-as': 'true', scope: 'public_profile,email', onlogin: 'utekosWishlistFacebookOnLogin();' })) button.setAttribute(`data-${key}`, value);
      ref.current.replaceChildren(button);
      sdk.XFBML.parse(ref.current, () => { window.clearTimeout(timeout); if (!inactive()) setState('ready'); });
    }
    void prepare().catch(() => { window.clearTimeout(timeout); if (!disposed) setState('error'); });
    return () => { disposed = true; window.clearTimeout(timeout); delete window.utekosWishlistFacebookOnLogin; };
  }, [attempt, returnTo]);
  return <div style={{ marginBottom: '1rem' }}>
    <div ref={ref} style={{ visibility: state === 'ready' ? 'visible' : 'hidden', height: state === 'ready' || state === 'loading' ? 'auto' : 0 }} />
    {state === 'loading' || state === 'pending' ? <p role="status">{state === 'loading' ? 'Laster Facebook …' : 'Bekrefter Facebook …'}</p> : null}
    {state === 'error' && <div><p role="status">Facebook er ikke tilgjengelig. Prøv igjen eller fortsett med e-post.</p><button className={styles.secondary} onClick={() => { setState('loading'); setAttempt(a => a + 1); }}>Prøv Facebook igjen</button></div>}
    {state === 'connected' && <div><p role="status">Facebook er tilkoblet. Bruk e-post nedenfor for å åpne kundekontoen din.</p><button className={styles.secondary} onClick={() => { void fetch('/api/identity/facebook/disconnect', { method: 'POST' }).then(r => { if (r.ok) { setState('loading'); setAttempt(a => a + 1); } }); }}>Fjern Facebook-tilkobling</button></div>}
  </div>;
}

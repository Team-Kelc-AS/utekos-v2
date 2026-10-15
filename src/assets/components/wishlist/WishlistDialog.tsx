'use client';
import type { Route } from 'next';
import { useState } from 'react';
import Dialog from '@/components/commerce/Dialog';
import { WishlistFacebookLogin } from './WishlistFacebookLogin';
import styles from '@/components/commerce/commerce.module.css';
const authorizePath = '/customer/account/authorize' satisfies Route;
export default function WishlistDialog({ returnTo, onClose }: { returnTo: string; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'create'>('login');
  const [pending, setPending] = useState(false);
  return <Dialog title="Utekos ønskeliste" onClose={onClose} className="bg-jungle! text-primary-foreground!">
    <p>Favoritten er lagret på denne enheten.</p>
    <WishlistFacebookLogin returnTo={returnTo} />
    <form className={styles.form} action={authorizePath} method="get" onSubmit={() => setPending(true)}>
      <input name="returnTo" value={returnTo} type="hidden" /><input name="mode" value={mode} type="hidden" />
      <label>E-postadresse<input name="email" type="email" autoComplete="email" required /></label>
      <small>Du får en kode på e-post i neste steg. Du trenger ikke passord.</small>
      <button type="submit" disabled={pending} className={styles.primary}>{pending ? 'Åpner innlogging …' : mode === 'create' ? 'Opprett konto' : 'Fortsett med e-post'}</button>
    </form>
    <button className={styles.secondary} onClick={() => setMode(mode === 'login' ? 'create' : 'login')}>{mode === 'login' ? 'Registrer deg' : 'Logg inn'}</button>
    <a href={`${authorizePath}?${new URLSearchParams({ returnTo })}`} className={styles.secondary}>Google</a>
    <p className={styles.muted}>Velg Google på innloggingssiden hvis det er tilgjengelig for kontoen din.</p>
  </Dialog>;
}

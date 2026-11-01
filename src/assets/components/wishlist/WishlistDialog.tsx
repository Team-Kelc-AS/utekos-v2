'use client';
import type { Route } from 'next';
import { useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import Dialog from '@/components/commerce/Dialog';
import { KlarnaIdentityButton } from '@/components/klarna/KlarnaIdentityButton';
import { WishlistFacebookLogin } from './WishlistFacebookLogin';
import { WishlistGoogleLogin } from './WishlistGoogleLogin';
import styles from './WishlistDialog.module.css';
const authorizePath = '/customer/account/authorize' satisfies Route;
export default function WishlistDialog({ returnTo, onClose }: { returnTo: string; onClose: () => void }) {
  const [pending, setPending] = useState(false);
  const accountHref = `${authorizePath}?${new URLSearchParams({ returnTo })}`;

  return <Dialog title="Utekos ønskeliste" onClose={onClose} className={styles.dialog}>
    <div className={styles.providers}>
      <KlarnaIdentityButton returnTo={returnTo} fullWidth showDisconnect={false} theme="light" shape="pill" wrapperClassName={styles.klarna} onConnected={onClose} />
      <WishlistFacebookLogin returnTo={returnTo} className={styles.facebook} />
      <WishlistGoogleLogin returnTo={returnTo} />
    </div>

    <form className={styles.form} action={authorizePath} method="post" onSubmit={() => setPending(true)} aria-busy={pending}>
      <label htmlFor="wishlist-email">E-postadresse</label>
      <div className={styles.emailField}>
        <Mail size={20} aria-hidden="true" />
        <input id="wishlist-email" name="email" type="email" autoComplete="email" placeholder="Din e-postadresse" required maxLength={254} readOnly={pending} />
        <button type="submit" disabled={pending} aria-label={pending ? 'Åpner innlogging …' : 'Fortsett med e-post'}>
          <ArrowRight size={22} aria-hidden="true" />
        </button>
      </div>
      {pending && <p className={styles.status} role="status">Åpner innlogging …</p>}
    </form>

    <div className={styles.createAccount}>
      <p>Har du ikke brukerkonto?</p>
      <a href={accountHref} className={styles.createButton}>Opprett konto <ArrowRight size={20} aria-hidden="true" /></a>
    </div>
  </Dialog>;
}

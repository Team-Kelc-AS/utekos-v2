'use client';
import { useActionState, useId, useEffect } from 'react';
import { emitStorefrontAction } from '@/lib/tracking/browser-events';
import Link from 'next/link';
import Dialog from '@/components/commerce/Dialog';
import { submitWaitlist, type WaitlistState } from '@/lib/waitlist/submit';
import styles from '@/components/commerce/commerce.module.css';
const initial: WaitlistState = { status: 'idle', message: '' };
export default function WaitlistDialog({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(submitWaitlist, initial);
  const id = useId();
  useEffect(() => {
    if (state.trackingEvent) emitStorefrontAction('utekos:accepted-lead', state.trackingEvent);
    if (state.status === 'error') emitStorefrontAction('utekos:form-error', { formId: 'product_waitlist_utekos_dun', attemptId: crypto.randomUUID(), category: state.errors ? 'validation' : 'submission_failed' });
  }, [state]);
  return <Dialog title="Venteliste for Utekos Dun™" onClose={onClose}>
    {state.status === 'success' ? <div role="status"><p>{state.message}</p><button className={styles.primary} onClick={onClose}>Fortsett å se</button></div> : <>
      <p>Meld deg på ventelisten, så kontakter vi deg når Utekos Dun™ er tilbake.</p>
      <form data-tracking-form="product_waitlist_utekos_dun" data-tracking-form-name="Venteliste Utekos Dun" action={action} className={styles.form}>
        {([{ name: 'name', label: 'Navn', type: 'text', autoComplete: 'name' }, { name: 'email', label: 'E-postadresse', type: 'email', autoComplete: 'email' }, { name: 'phone', label: 'Telefonnummer', type: 'tel', autoComplete: 'tel' }] as const).map(field => <label key={field.name} htmlFor={`${id}-${field.name}`}>{field.label}<input id={`${id}-${field.name}`} name={field.name} type={field.type} autoComplete={field.autoComplete} required maxLength={field.name === 'email' ? 254 : 100} aria-invalid={!!state.errors?.[field.name]} aria-describedby={state.errors?.[field.name] ? `${id}-${field.name}-error` : undefined} />{state.errors?.[field.name] && <small id={`${id}-${field.name}-error`}>{state.errors[field.name]?.join(' ')}</small>}</label>)}
        <label className={styles.honeypot} aria-hidden="true">Nettside<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <label className={styles.check}><input name="privacy" type="checkbox" required /><span>Jeg har lest <Link href="/personvern">personvernerklæringen</Link>.</span></label>
        <label className={styles.check}><input name="marketing" type="checkbox" /><span>Jeg ønsker nyheter og tilbud på e-post. Dette er valgfritt.</span></label>
        {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
        <button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Registrerer …' : 'Meld meg på ventelisten'}</button>
      </form>
    </>}
  </Dialog>;
}

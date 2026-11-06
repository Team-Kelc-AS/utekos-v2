'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { CloseIcon } from '@/components/utekos-icons/CloseIcon';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import styles from './commerce.module.css';
export default function Dialog({ title, children, footer, onClose, drawer = false, className = '' }: { title: string; children: ReactNode; footer?: ReactNode; onClose: () => void; drawer?: boolean; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = ref.current!;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = overflow; if (trigger?.isConnected) trigger.focus(); };
  }, []);
  const closeButton = <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Lukk"><CloseIcon /></button>;
  return <dialog ref={ref} aria-labelledby={titleId} className={`${styles.dialog} ${drawer ? styles.drawer : ''} ${footer ? styles.cardDialog : ''} ${className}`}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')]
        .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[inert]') && element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}
    onCancel={e => { e.preventDefault(); onClose(); }}
    onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>
    {footer ? <Card className={styles.dialogCard}>
      <CardHeader className={styles.cardDialogHeading}>
        <CardTitle><h2 id={titleId}>{title}</h2></CardTitle>
        <CardAction>{closeButton}</CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter className={styles.cardDialogFooter}>{footer}</CardFooter>
    </Card> : <>
      <div className={styles.dialogHeading}><h2 id={titleId}>{title}</h2>{closeButton}</div>
      {children}
    </>}
  </dialog>;
}

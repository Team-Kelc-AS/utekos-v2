'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { CloseIcon } from '@/components/utekos-icons/CloseIcon';
import styles from './commerce.module.css';
export default function Dialog({ title, children, onClose, drawer = false }: { title: string; children: ReactNode; onClose: () => void; drawer?: boolean }) {
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
  return <dialog ref={ref} aria-labelledby={titleId} className={`${styles.dialog} ${drawer ? styles.drawer : ''}`}
    onCancel={e => { e.preventDefault(); onClose(); }}
    onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>
    <div className={styles.dialogHeading}><h2 id={titleId}>{title}</h2><button type="button" className={styles.iconButton} onClick={onClose} aria-label="Lukk"><CloseIcon /></button></div>
    {children}
  </dialog>;
}

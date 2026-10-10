'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import styles from './camping.module.css';

const Dialog = dynamic(() => import('@/components/commerce/Dialog'), { ssr: false });

export function InfoDialogButton({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={styles.textButton} aria-haspopup="dialog" onClick={() => setOpen(true)}>{title} <span aria-hidden="true">↗</span></button>
    {open && <Dialog title={title} onClose={() => setOpen(false)}>{children}</Dialog>}
  </>;
}

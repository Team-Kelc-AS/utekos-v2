'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import styles from './camping.module.css';

const Dialog = dynamic(() => import('@/components/commerce/Dialog'), { ssr: false });

export function InfoDialogButton({ title, trigger, className, children }: { title: string; trigger?: ReactNode; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={className ?? styles.textButton} aria-haspopup="dialog" onClick={() => setOpen(true)}>{trigger ?? <>{title} <span aria-hidden="true">↗</span></>}</button>
    {open && <Dialog title={title} onClose={() => setOpen(false)}>{children}</Dialog>}
  </>;
}

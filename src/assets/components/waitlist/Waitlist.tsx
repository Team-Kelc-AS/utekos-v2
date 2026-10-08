'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from '@/components/commerce/commerce.module.css';
const WaitlistDialog = dynamic(() => import('./WaitlistDialog'), { ssr: false });
export function Waitlist() {
  const [open, setOpen] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setOpen(true), 3000); return () => window.clearTimeout(timer); }, []);
  return <><button type="button" className={styles.secondary} onClick={() => setOpen(true)}>Varsle meg når Dun er tilbake</button>{open && <WaitlistDialog onClose={() => setOpen(false)} />}</>;
}

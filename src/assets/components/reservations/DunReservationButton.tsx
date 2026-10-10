'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { DunSelection } from '@/lib/reservations/dun';
import styles from './dun-reservation.module.css';

const DunReservationDialog = dynamic(() => import('./DunReservationDialog'), { ssr: false });

export function DunReservationButton({ selection, className, label = 'Forhåndsbestill' }: { selection: DunSelection; className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={className ?? styles.trigger} aria-haspopup="dialog" onClick={() => setOpen(true)}>{label}</button>
    {open && <DunReservationDialog selection={selection} onClose={() => setOpen(false)} />}
  </>;
}

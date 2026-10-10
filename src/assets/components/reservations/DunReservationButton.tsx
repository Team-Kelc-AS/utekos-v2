'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { DunSelection } from '@/lib/reservations/dun';
import styles from './dun-reservation.module.css';

const DunReservationDialog = dynamic(() => import('./DunReservationDialog'), { ssr: false });

export function DunReservationButton({ selection, className }: { selection: DunSelection; className?: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={className ?? styles.trigger} aria-haspopup="dialog" onClick={() => setOpen(true)}>Forhåndsbestill</button>
    {open && <DunReservationDialog selection={selection} onClose={() => setOpen(false)} />}
  </>;
}

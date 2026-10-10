'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BagOutlineIcon } from '@/components/utekos-icons/BagOutlineIcon';
import { KlarnaProductExpressCheckout } from '@/components/klarna/KlarnaProductExpressCheckout';
import { changeCart, useCartState } from '@/lib/cart/client';
import { DunReservationButton } from '@/components/reservations/DunReservationButton';
import type { DunSelection } from '@/lib/reservations/dun';
import styles from './ProductOverview.module.css';

export function VariantCardActions({ handle, variantId, available, title, reservationSelection }: {
  handle: string; variantId: string; available: boolean; title: string; reservationSelection?: DunSelection;
}) {
  const unavailableLabel = handle === 'utekos-dun' ? 'Ventes i uke 43' : 'Utsolgt';
  const { pending } = useCartState();
  const [adding, setAdding] = useState(false);
  async function add() {
    setAdding(true);
    try { await changeCart({ action: 'add', handle, variantId, quantity: 1 }); }
    finally { setAdding(false); }
  }
  return <div className={styles.actions}>
    {handle === 'utekos-dun' && !available && reservationSelection && <DunReservationButton selection={reservationSelection} className={styles.buy} />}
    <Button className={styles.buy} disabled={!available || pending} aria-busy={adding}
      aria-label={available ? `Legg ${title} i handlekurv` : handle === 'utekos-dun' ? `${title} – ${unavailableLabel}` : `${title} er utsolgt`}
      onClick={() => { void add(); }}>
      {adding ? <Loader2 className="size-4 motion-safe:animate-spin" /> : <BagOutlineIcon className={styles.bag} size={16} />}
      <span>{adding ? 'Legger til …' : available ? 'Legg i handlekurv' : unavailableLabel}</span>
    </Button>
    {available && <div className={styles.klarna} aria-label={`Betal ${title} med Klarna`}>
      <KlarnaProductExpressCheckout handle={handle} variantId={variantId} />
    </div>}
  </div>;
}

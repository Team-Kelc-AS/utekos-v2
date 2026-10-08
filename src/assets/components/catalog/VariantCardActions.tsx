'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BagOutlineIcon } from '@/components/utekos-icons/BagOutlineIcon';
import { KlarnaProductExpressCheckout } from '@/components/klarna/KlarnaProductExpressCheckout';
import { changeCart, useCartState } from '@/lib/cart/client';
import styles from './ProductOverview.module.css';

export function VariantCardActions({ handle, variantId, available, title }: {
  handle: string; variantId: string; available: boolean; title: string;
}) {
  const { pending } = useCartState();
  const [adding, setAdding] = useState(false);
  async function add() {
    setAdding(true);
    try { await changeCart({ action: 'add', handle, variantId, quantity: 1 }); }
    finally { setAdding(false); }
  }
  return <div className={styles.actions}>
    <Button className={styles.buy} disabled={!available || pending} aria-busy={adding}
      aria-label={available ? `Legg ${title} i handlekurv` : `${title} er utsolgt`}
      onClick={() => { void add(); }}>
      {adding ? <Loader2 className="size-4 motion-safe:animate-spin" /> : <BagOutlineIcon className={styles.bag} size={16} />}
      <span>{adding ? 'Legger til …' : available ? 'Legg i handlekurv' : 'Utsolgt'}</span>
    </Button>
    {available && <div className={styles.klarna} aria-label={`Betal ${title} med Klarna`}>
      <KlarnaProductExpressCheckout handle={handle} variantId={variantId} />
    </div>}
  </div>;
}

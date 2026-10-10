'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KlarnaProductExpressCheckout } from '@/components/klarna/KlarnaProductExpressCheckout';
import { changeCart, useCartState } from '@/lib/cart/client';
import { DunReservationButton } from '@/components/reservations/DunReservationButton';
import type { DunSelection } from '@/lib/reservations/dun';

// Same purchase control sizing, shape and checkout styling as headless.
export function ProductCardFooter({ handle, variantId, available, reservationSelection }: { handle: string; variantId: string; available: boolean; reservationSelection?: DunSelection }) {
  const { pending } = useCartState();
  const [adding, setAdding] = useState(false);
  async function addToCart() {
    setAdding(true);
    try { await changeCart({ action: 'add', handle, variantId, quantity: 1 }); }
    finally { setAdding(false); }
  }
  return <div className="mx-auto flex w-full flex-col items-center gap-2 bg-night px-5 pt-3 pb-5 max-[360px]:px-3 md:gap-3 md:px-6 md:pt-4 md:pb-6">
    {handle === 'utekos-dun' && !available && reservationSelection && <DunReservationButton selection={reservationSelection} />}
    <CardFooter className="flex w-full flex-col border-0 bg-transparent p-0">
      <Button type="button" disabled={!available || pending} aria-busy={adding}
        onClick={() => { void addToCart(); }}
        className="h-10 min-h-10 w-full min-w-0 max-w-full touch-manipulation overflow-hidden rounded-full border-none bg-primary px-3 py-0 text-center font-sans text-sm leading-tight font-medium whitespace-normal text-foreground ring-0 hover:scale-103 hover:bg-primary hover:text-foreground/90 hover:opacity-60 motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-70 md:h-12 md:min-h-12 md:px-4 md:text-base">
        {!available ? handle === 'utekos-dun' ? 'Ventes i uke 43' : 'Utsolgt' : adding ? <><Loader2 className="size-4 motion-safe:animate-spin" /><span className="sr-only">Legger til …</span></> : 'Legg i handlekurv'}
      </Button>
    </CardFooter>
    {available && <KlarnaProductExpressCheckout handle={handle} variantId={variantId} />}
  </div>;
}

'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BagOutlineIcon } from '@/components/utekos-icons/BagOutlineIcon';
import { useCartState, openCart, seedCart, refreshCart, restoreCartAfterNavigation } from '@/lib/cart/client';
import type { Cart } from '@/lib/cart/types';
import styles from './commerce.module.css';
const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false });
export function CartHost({ initialCart }: { initialCart?: Cart }) {
  const state = useCartState();
  useEffect(() => { if (initialCart) seedCart(initialCart); }, [initialCart]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void refreshCart(); };
    const restore = (event: PageTransitionEvent) => { if (event.persisted) void restoreCartAfterNavigation(); };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', restore);
    return () => { document.removeEventListener('visibilitychange', refresh); window.removeEventListener('pageshow', restore); };
  }, []);
  const quantity = state.cart?.totalQuantity ?? initialCart?.totalQuantity;
  return <div className={styles.cartHost}>
    <button className={styles.iconButton} type="button" aria-label={`Åpne handlekurv${quantity ? `, ${quantity} varer` : ''}`} aria-haspopup="dialog" onClick={openCart}
      onPointerEnter={() => { void import('./CartDrawer'); }} onFocus={() => { void import('./CartDrawer'); }}>
      <BagOutlineIcon />{quantity ? <span className={styles.count}>{quantity}</span> : null}
    </button>
    {state.open && <CartDrawer />}
  </div>;
}

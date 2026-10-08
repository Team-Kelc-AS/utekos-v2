'use client';

import { changeCart, checkout, closeCart, refreshCart, useCartState } from '@/lib/cart/client';
import { useEffect, useRef } from 'react';

import Dialog from './Dialog';
import Image from 'next/image';
import Link from 'next/link';
import { formatMoney } from '@/lib/products/money';
import { reportCartView } from '@/lib/cart/tracking';
import { DeleteIcon } from '@/components/utekos-icons/DeleteIcon';
import { MinusIcon } from '@/components/utekos-icons/MinusIcon';
import { PlusIcon } from '@/components/utekos-icons/PlusIcon';
import styles from './commerce.module.css';
export default function CartDrawer() {
  const { cart, pending, error, warnings } = useCartState();
  const observed = useRef(false);
  useEffect(() => {
    if (!cart?.commerce || observed.current) return;
    const frame = requestAnimationFrame(() => { observed.current = true; reportCartView(cart); });
    return () => cancelAnimationFrame(frame);
  }, [cart]);
  return <Dialog title="Handlekurven din" onClose={closeCart} drawer>
    <div aria-live="polite">{error && <p role="alert" className={styles.message}>{error} <button onClick={() => { void refreshCart(); }}>Prøv igjen</button></p>}{warnings.map((w, i) => <p key={i} className={styles.message}>{w}</p>)}</div>
    {!cart ? <p role="status">Laster handlekurven …</p> : !cart.lines.length ? <div className={styles.empty}><p>Handlekurven er tom.</p><Link href="/produkter" className={styles.primary} onClick={closeCart}>Se produktene</Link></div> : <>
      <ul className={styles.cartLines}>{cart.lines.map(line => <li key={line.id} className={styles.cartLine}>
        {line.image && <Image src={line.image.url} alt={line.image.altText || line.title} width={line.image.width} height={line.image.height} sizes="80px" className={styles.lineImage} />}
        <div><Link href={`/produkter/${line.handle}?variant=${encodeURIComponent(line.variantId)}`} onClick={closeCart}>{line.title}</Link><p className={styles.muted}>{line.variantTitle}</p><strong>{formatMoney(line.total)}</strong>
          {!line.available && <p>Ikke tilgjengelig</p>}
          <div className={styles.lineActions}>
            <div className={styles.quantityControl} role="group" aria-label={`Antall ${line.title}, ${line.variantTitle}`} aria-busy={pending}>
              <button type="button" disabled={pending || line.quantity < 1} aria-label={`Reduser antall for ${line.title}`}
                onClick={() => { void changeCart(line.quantity === 1 ? { action: 'remove', lineId: line.id } : { action: 'update', lineId: line.id, quantity: line.quantity - 1 }); }}>
                <MinusIcon tone="orange" size={16} />
              </button>
              <span className={styles.quantityValue} aria-live="polite" aria-atomic="true"><span className="sr-only">Antall: </span>{line.quantity}</span>
              <button type="button" disabled={pending || line.quantity >= 99} aria-label={`Øk antall for ${line.title}`}
                onClick={() => { void changeCart({ action: 'update', lineId: line.id, quantity: line.quantity + 1 }); }}>
                <PlusIcon tone="orange" size={16} />
              </button>
            </div>
            <button type="button" className={styles.removeLine} disabled={pending} onClick={() => { void changeCart({ action: 'remove', lineId: line.id }); }} aria-label={`Fjern ${line.title}`}>
              <DeleteIcon tone="orange" size={18} />
            </button>
          </div>
        </div>
      </li>)}</ul>
      <div className={styles.cartTotal}><span>Sum varer</span><strong>{formatMoney(cart.subtotal)}</strong></div>
      <button className={styles.primary} disabled={pending || cart.lines.some(l => !l.available)} onClick={() => { void checkout(); }}>{pending ? 'Oppdaterer …' : 'Til kassen'}</button>
      <button className={styles.secondary} onClick={closeCart}>Fortsett å handle</button>
    </>}
  </Dialog>;
}

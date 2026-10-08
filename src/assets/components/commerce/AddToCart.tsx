'use client';
import { useCartState, changeCart } from '@/lib/cart/client';
import styles from './commerce.module.css';
export function AddToCart({ handle, variantId, available, compact = false }: { handle: string; variantId: string; available: boolean; compact?: boolean }) {
  const { pending } = useCartState();
  return <button type="button" className={styles.primary} disabled={!available || pending} aria-busy={pending}
    onClick={() => { void changeCart({ action: 'add', handle, variantId, quantity: 1 }); }}>
    {!available ? 'Utsolgt' : pending ? 'Legger til …' : compact ? 'Legg til' : 'Legg i handlekurven'}
  </button>;
}

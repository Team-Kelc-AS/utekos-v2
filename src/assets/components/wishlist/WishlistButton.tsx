'use client';
import { emitStorefrontAction } from '@/lib/tracking/browser-events';
import { useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { HeartIcon } from '@/components/utekos-icons/HeartIcon';
import { HeartOutlineIcon } from '@/components/utekos-icons/HeartOutlineIcon';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { addWishlistItem, hasWishlistVariant } from '@/lib/wishlist/wishlistStore';
import styles from '@/components/commerce/commerce.module.css';
import wishlistStyles from './WishlistButton.module.css';
const WishlistDialog = dynamic(() => import('./WishlistDialog'), { ssr: false });
const subscribe = (callback: () => void) => { window.addEventListener('storage', callback); window.addEventListener('utekos:wishlist', callback); return () => { window.removeEventListener('storage', callback); window.removeEventListener('utekos:wishlist', callback); }; };
export function WishlistButton({ productId, handle, variantId, title, returnTo, className = '', showLabel = false, showHoverCard = false }: { productId: string; handle: string; variantId: string; title: string; returnTo: string; className?: string; showLabel?: boolean; showHoverCard?: boolean }) {
  const wished = useSyncExternalStore(subscribe, () => hasWishlistVariant(variantId), () => false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [hoverOpen, setHoverOpen] = useState(false);
  const button = <button type="button" className={`${styles.iconButton} ${showHoverCard ? wishlistStyles.cardWishlist : ''} ${className}`} aria-label={`${wished ? 'Åpne ønskeliste for' : 'Legg til i ønskelisten:'} ${title}`} aria-pressed={wished} aria-haspopup="dialog" onClick={(event) => {
      setHoverOpen(false);
      const saved = addWishlistItem({ productId, productHandle: handle, variantId });
      if (!saved) { setError('Kunne ikke lagre ønskelisten på denne enheten.'); return; }
      if (saved.added) {
        const raw = event.currentTarget.closest('[data-tracking-commerce]')?.getAttribute('data-tracking-commerce');
        if (raw) { try { emitStorefrontAction('utekos:wishlist-added', { commerce: JSON.parse(raw), mutationId: saved.mutationId, eventTime: saved.entry.addedAt }); } catch {} }
      }
      setError(''); window.dispatchEvent(new Event('utekos:wishlist')); setOpen(true);
    }}>{showLabel && <span className="text-xs font-medium">Ønskeliste</span>}{wished ? <HeartIcon tone="orange" /> : showHoverCard ? <span className={wishlistStyles.heart}>
      <HeartOutlineIcon tone="orange" className={wishlistStyles.outline} />
      <HeartIcon tone="orange" className={wishlistStyles.filled} />
    </span> : <HeartOutlineIcon tone="orange" />}</button>;
  return <div>
    {showHoverCard ? <HoverCard open={hoverOpen && !open} onOpenChange={setHoverOpen}>
      <HoverCardTrigger render={button} delay={250} />
      <HoverCardContent side="top" align="end" alignOffset={0} sideOffset={8} className={wishlistStyles.hoverCard}>Legg i ønskeliste</HoverCardContent>
    </HoverCard> : button}
    {error && <p role="alert">{error}</p>}{open && <WishlistDialog returnTo={returnTo} onClose={() => setOpen(false)} />}
  </div>;
}

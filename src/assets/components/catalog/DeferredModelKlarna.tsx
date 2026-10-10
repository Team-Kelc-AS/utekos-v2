'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './camping.module.css';

const Klarna = dynamic(() => import('@/components/klarna/KlarnaProductExpressCheckout').then(module => module.KlarnaProductExpressCheckout), { ssr: false });

/** Payment code loads as the card's controls approach the viewport. */
export function DeferredModelKlarna({ handle, variantId, disabled }: { handle: string; variantId: string; disabled: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '160px' });
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={host} className={styles.klarnaSlot}>
    {visible ? <Klarna handle={handle} variantId={variantId} disabled={disabled} /> : <button type="button" disabled className={styles.klarnaPlaceholder}>Betal med Klarna</button>}
  </div>;
}

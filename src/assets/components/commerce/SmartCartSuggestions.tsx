'use client';
import { useEffect, useId, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { applyCartDiscount, changeCart, closeCart } from '@/lib/cart/client';
import type { Cart } from '@/lib/cart/types';
import { COMFY_SHIPPING_CODE, selectCartSuggestions, shippingStatus, type CartSuggestion } from '@/lib/cart/suggestions';
import { formatMoney } from '@/lib/products/money';
import styles from './commerce.module.css';

function PromotionCode({ code, applied, pending }: { code: string; applied: boolean; pending: boolean }) {
  return <button type="button" className={styles.secondary} disabled={pending || applied} onClick={() => { void applyCartDiscount(code); }}>
    {applied ? `${code} er lagt til` : `Bruk ${code}`}
  </button>;
}

function Suggestion({ product, pending }: { product: CartSuggestion; pending: boolean }) {
  const selectId = useId();
  const [chosenId, setChosenId] = useState(product.variants[0].id);
  const variant = product.variants.find(item => item.id === chosenId) ?? product.variants[0];
  return <li className={styles.suggestion}>
    <div className={styles.suggestionProduct}>
      {variant.image && <Image src={variant.image.url} alt={variant.image.altText || `${product.title}, ${variant.title}`} width={variant.image.width} height={variant.image.height} sizes="64px" className={styles.suggestionImage} />}
      <div>
        <Link onClick={closeCart} href={`/produkter/${product.handle}?variant=${encodeURIComponent(variant.id)}`}>{product.title}</Link>
        <p><strong>{formatMoney(variant.price)}</strong></p>
        {product.variants.length > 1 ? <>
          <label htmlFor={selectId} className={styles.muted}>Velg variant</label>
          <select id={selectId} value={variant.id} disabled={pending} onChange={event => setChosenId(event.target.value)}>
            {product.variants.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </> : <p className={styles.muted}>{variant.title}</p>}
      </div>
    </div>
    <button type="button" className={styles.secondary} disabled={pending} onClick={() => { void changeCart({ action: 'add', handle: product.handle, variantId: variant.id, quantity: 1 }); }}>Legg til {product.title}</button>
  </li>;
}

export default function SmartCartSuggestions({ cart, pending }: { cart: Cart; pending: boolean }) {
  const [products, setProducts] = useState<CartSuggestion[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/cart/suggestions', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Suggestions unavailable');
      const result = await response.json();
      if (!controller.signal.aborted) setProducts(result.products);
    }).catch(() => {}); // Optional suggestions must never block checkout or shipping information.
    return () => controller.abort();
  }, []);
  const shipping = shippingStatus(cart);
  if (!shipping) return null;
  const suggestions = selectCartSuggestions(cart, products);
  const codes = cart.discountCodes ?? [];
  const applied = (code: string) => codes.some(item => item.applicable && item.code.toUpperCase() === code);
  const hasComfyrobe = cart.lines.some(line => line.handle === 'comfyrobe');
  return <section className={styles.smartCart} aria-label="Frakt og tilbehør">
    <div className={styles.shippingNotice} role="status">
      {shipping.free ? <p>Gratulerer, du har gratis frakt!</p> : <>
        <p>Du er kun <strong>{formatMoney({ amount: shipping.remaining.toFixed(2), currencyCode: 'NOK' })}</strong> unna gratis frakt!</p>
        <progress value={shipping.progress} max={100} aria-label="Fremdrift mot gratis frakt" />
      </>}
    </div>
    {hasComfyrobe && !shipping.free && <div className={styles.promotion}>
      <p>Få gratis frakt på Comfyrobe™ med <strong>{COMFY_SHIPPING_CODE}</strong>.</p>
      <p className={styles.muted}>Kan ikke kombineres med andre rabatter.</p>
      <PromotionCode code={COMFY_SHIPPING_CODE} applied={applied(COMFY_SHIPPING_CODE)} pending={pending} />
    </div>}
    {suggestions.length > 0 && <>
      <h3>{suggestions.some(product => product.accessory) ? 'Fullfør din Utekos' : 'Andre livsnytere har også sett på'}</h3>
      <ul className={styles.suggestions}>{suggestions.map(product => <Suggestion key={product.id} product={product} pending={pending} />)}</ul>
    </>}
  </section>;
}

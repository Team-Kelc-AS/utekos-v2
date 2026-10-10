'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CardTitle } from '@/components/ui/card';
import { AddToCart } from '@/components/commerce/AddToCart';
import { DunReservationButton } from '@/components/reservations/DunReservationButton';
import { useCartState } from '@/lib/cart/client';
import { initialModelChoice, isSizeOption, modelOptions, modelOptionAvailable, selectedModelVariant, type ModelPurchase } from '@/lib/catalog/modelPurchase';
import { formatMoney } from '@/lib/products/money';
import { dunSelection } from '@/lib/reservations/dun';
import type { CanonicalCommerceValue } from '@/lib/analytics/canonicalCommerceItem';
import { emitStorefrontAction } from '@/lib/tracking/browser-events';
import { DeferredModelKlarna } from './DeferredModelKlarna';
import styles from './camping.module.css';

type Props = {
  product: ModelPurchase;
  waitlist: boolean;
  tracking: { previewVariantId: string; variants: Record<string, { href: string; commerce: CanonicalCommerceValue }> };
  initialImage: ReactNode;
  initialPrice: ReactNode;
  reviews: ReactNode;
  children: ReactNode;
};

/** Server-rendered content slots surround the small, explicit variant selector. */
export function ModelPurchaseControls({ product, waitlist, tracking, initialImage, initialPrice, reviews, children }: Props) {
  const [choice, setChoice] = useState(() => initialModelChoice(product.variants));
  const { pending } = useCartState();
  const selected = selectedModelVariant(product.variants, choice);
  const options = modelOptions(product.variants);
  const available = selected?.available === true;
  const presentation = tracking.variants[selected?.id ?? tracking.previewVariantId];
  const previousVariant = useRef(selected?.id);
  useEffect(() => {
    const previous = previousVariant.current;
    previousVariant.current = selected?.id;
    if (!selected || selected.id === previous) return;
    const item = presentation.commerce.items[0];
    emitStorefrontAction('utekos:variant-selection-confirmed', {
      interaction_id: crypto.randomUUID(),
      product_id: item.product_id,
      variant_id: selected.id,
      item_id: item.item_id,
      item_variant: item.item_variant ?? selected.id,
      availability: selected.available ? 'available' : 'unavailable',
    });
  }, [selected, presentation]);
  return <div data-selected-variant={selected?.id} data-product-card={selected?.id ?? tracking.previewVariantId}
    data-tracking-commerce={JSON.stringify(presentation.commerce)}>
    {(selected?.image || initialImage) && <Link href={presentation.href} prefetch={false} aria-label={`Se ${product.title}`} className={styles.imageLink}>
      {selected?.image ? <Image src={selected.image.url} alt={selected.image.altText || `${product.title} – ${selected.selectedOptions.map(option => option.value).join(', ')}`}
        width={selected.image.width} height={selected.image.height} sizes="(min-width: 1200px) 560px, (min-width: 760px) 46vw, 94vw" className={styles.productImage} />
        : initialImage}
    </Link>}
    <div className={styles.modelHeader}><CardTitle><h3><Link href={presentation.href} prefetch={false}>{product.title}</Link></h3></CardTitle><div aria-live="polite" aria-atomic="true">{selected ? <p className={styles.price}>{formatMoney(selected.price)}</p> : initialPrice}</div></div>
    <div className={styles.modelContent}>
      {reviews}
      <div className={styles.purchase}>
        {options.filter(option => !isSizeOption(option.name) && option.values.length === 1 && option.values[0] !== 'Default Title').map(option => <p key={option.name}>{option.name}: {option.values[0]}</p>)}
        {options.filter(option => isSizeOption(option.name) || option.values.length > 1).map(option => <fieldset key={option.name} disabled={pending}>
          <legend>{isSizeOption(option.name) ? 'Størrelse' : option.name}</legend>
          <div className={styles.choices}>{option.values.map(value => {
            const inStock = modelOptionAvailable(product.variants, choice, option.name, value);
            return <button key={value} type="button" aria-pressed={choice[option.name] === value}
              onClick={() => setChoice(previous => ({ ...previous, [option.name]: value }))}>
              {value}{!inStock && !waitlist && <span> Utsolgt</span>}
            </button>;
          })}</div>
        </fieldset>)}
        <p className={styles.selectionStatus} aria-live="polite" aria-atomic="true">{selected
          ? waitlist ? 'Ventes i uke 43' : available ? 'På lager' : 'Utsolgt i valgt størrelse og farge'
          : `Velg størrelse${options.some(option => option.values.length > 1 && !isSizeOption(option.name)) ? ' og farge' : ''}.`}</p>
        {waitlist ? selected ? <DunReservationButton key={selected.id} selection={dunSelection(selected)} className={styles.buyButton} label="Påmeldingsliste" /> : <button type="button" className={styles.buyButton} disabled>Påmeldingsliste</button> : <>
          <AddToCart handle={product.handle} variantId={selected?.id ?? ''} available={available} label="Legg i handlekurv" unavailableLabel={selected ? undefined : 'Legg i handlekurv'} />
          <DeferredModelKlarna handle={product.handle} variantId={selected?.id ?? ''} disabled={!available || pending} />
        </>}
        {children}
      </div>
    </div>
  </div>;
}

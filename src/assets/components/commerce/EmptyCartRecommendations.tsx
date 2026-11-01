'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent } from '@/components/ui/empty';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import { changeCart, closeCart } from '@/lib/cart/client';
import { emptyCartRecommendationsSchema, type EmptyCartRecommendation } from '@/lib/cart/empty-cart-recommendations';
import { formatMoney } from '@/lib/products/money';
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError';
import styles from './commerce.module.css';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; products: EmptyCartRecommendation[] };

export default function EmptyCartRecommendations({ pending }: { pending: boolean }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/cart/recommendations', {
      cache: 'no-store', credentials: 'same-origin',
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
    }).then(async response => {
      if (!response.ok) throw new Error('empty_cart_recommendations_unavailable');
      const result = emptyCartRecommendationsSchema.parse(await response.json());
      if (!controller.signal.aborted) setState({ status: 'ready', products: result.products });
    }).catch(() => {
      if (controller.signal.aborted) return;
      setState({ status: 'error' });
      reportClientCaughtError(new Error('empty_cart_recommendations_unavailable'), 'empty_cart_recommendations');
    });
    return () => controller.abort();
  }, [attempt]);

  async function add(product: EmptyCartRecommendation) {
    setAdding(product.variantId);
    try {
      await changeCart({ action: 'add', handle: product.handle, variantId: product.variantId, quantity: 1 });
    } finally {
      setAdding(null);
    }
  }

  return <Empty className={styles.emptyRecommendations}>
    <EmptyContent className={styles.emptyRecommendationsContent}>
      {state.status === 'loading' ? <div className={styles.emptyRecommendationLoading} role="status" aria-label="Laster produktforslag">
        {[0, 1, 2, 3].map(index => <Skeleton key={index} className="h-36 w-full" />)}
      </div> : state.status === 'error' ? <>
        <p role="status">Produktforslagene kunne ikke lastes.</p>
        <Button variant="outline" onClick={() => { setState({ status: 'loading' }); setAttempt(value => value + 1); }}>Prøv igjen</Button>
      </> : <ItemGroup aria-label="Populære produktvarianter" className={styles.emptyRecommendationList}>
        {state.products.map(product => <Item key={product.variantId} variant="outline" role="listitem" className={styles.emptyRecommendation} data-empty-cart-variant={product.variantId}>
          <ItemMedia className={styles.emptyRecommendationMedia}>
            <AspectRatio ratio={3 / 4} className="w-full">
              <Link href={`/produkter/${product.handle}?variant=${encodeURIComponent(product.variantId)}`} onClick={closeCart} className={styles.emptyRecommendationImageLink}>
                <Image src={product.image.url} alt={`${product.title}, ${product.size}`} fill sizes="(max-width: 448px) 25vw, 100px" className={styles.emptyRecommendationImage} />
              </Link>
            </AspectRatio>
          </ItemMedia>
          <ItemContent className={styles.emptyRecommendationDetails}>
            <ItemTitle className={styles.emptyRecommendationTitle}>
              <Link href={`/produkter/${product.handle}?variant=${encodeURIComponent(product.variantId)}`} onClick={closeCart}>{product.title}</Link>
            </ItemTitle>
            <ItemDescription className="font-medium text-foreground">{product.size}</ItemDescription>
            <p className={styles.emptyRecommendationPrice}>{formatMoney(product.price)}</p>
            <ItemActions className={styles.emptyRecommendationActions}>
              <Button disabled={pending} aria-busy={adding === product.variantId} aria-label={`Legg ${product.title}, ${product.size} i kurv`} className="min-h-11" onClick={() => { void add(product); }}>
                {adding === product.variantId ? 'Legger til …' : 'Legg i kurv'}
              </Button>
            </ItemActions>
          </ItemContent>
        </Item>)}
      </ItemGroup>}
      {(state.status === 'error' || (state.status === 'ready' && state.products.length === 0)) &&
        <Button variant="outline" nativeButton={false} render={<Link href="/produkter" onClick={closeCart} />}>Se produktene</Button>}
    </EmptyContent>
  </Empty>;
}

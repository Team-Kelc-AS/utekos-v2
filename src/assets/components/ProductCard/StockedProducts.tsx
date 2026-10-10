import 'server-only';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { unstable_rethrow } from 'next/dist/client/components/unstable-rethrow';
import { io } from 'next/dist/server/request/io';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import { ProductCarousel } from '@/components/ProductCard/ProductCarousel';
import { getProductCards, type ProductCardData } from '@/lib/shopify/getProductCards';
import { googleSansFlex } from '@/lib/fonts';
import { homeProducts } from '@/lib/catalog/homeProducts';
import { productVariantVideo } from '@/lib/products/variantVideos';
import styles from '@/components/ProductCard/ProductCarousel.module.css';

const sectionClassName = `${googleSansFlex.variable} ${styles.section} font-sans`;

type StockedProductsProps = {
  title: string;
  headingId: string;
  listId: string;
  route: string;
  excludeProductHandle?: string;
  introduction?: ReactNode;
};

export async function StockedProducts({ title, headingId, listId, route, excludeProductHandle, introduction }: StockedProductsProps) {
  // The seconds cache is request-time content. Make that boundary explicit to
  // avoid Next 16.3.8's cache-warming miss during the final prerender pass.
  // io() preserves prefetching and does not change inventory cache lifetimes.
  await io();
  let cards: ProductCardData[];
  try { cards = homeProducts(await getProductCards(), excludeProductHandle); }
  catch (error) {
    unstable_rethrow(error);
    console.error('Product cards unavailable', error);
    return <section className={sectionClassName} aria-labelledby={headingId} data-tracking-route={route} data-tracking-list={listId} data-tracking-list-name={title}>
      <h2 id={headingId}>{title}</h2>
      {introduction}
      <p className={styles.message}>Produktene kunne ikke lastes akkurat nå. <Link href="/produkter">Se alle produkter</Link></p>
    </section>;
  }

  return <section className={sectionClassName} aria-labelledby={headingId} data-tracking-route={route} data-tracking-list={listId} data-tracking-list-name={title}>
    <h2 id={headingId}>{title}</h2>
    {introduction}
    {cards.length ? <ProductCarousel>{cards.map(card => <ProductCard key={card.variant.id} {...card} video={productVariantVideo(card.product.handle, card.variant)} />)}</ProductCarousel>
      : <p className={styles.message}>Ingen produktvarianter er på lager akkurat nå. <Link href="/produkter">Se alle produkter</Link></p>}
  </section>;
}

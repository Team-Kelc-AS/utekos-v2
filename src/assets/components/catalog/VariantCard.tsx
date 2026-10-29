import 'server-only';
import { productCommerce } from '@/lib/shopify/commerce';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import type { OverviewCard } from '@/lib/catalog/overview';
import { formatMoney } from '@/lib/products/money';
import { optionParam, variantHref } from '@/lib/products/variants';
import { dunSelection } from '@/lib/reservations/dun';
import { productVariantColorSheet } from '@/lib/products/variantColorSheets';
import { ProductCardFlip } from '@/components/ProductCard/ProductCardFlip';
import { ProductCardColorSheet } from '@/components/ProductCard/ProductCardColorSheet';
import { VariantCardActions } from './VariantCardActions';
import styles from './ProductOverview.module.css';

const sizes = '(min-width: 1328px) 302px, (min-width: 1280px) 25vw, (min-width: 768px) 33vw, 67vw';

export function VariantCard({ card, eager = false }: { card: OverviewCard; eager?: boolean }) {
  const { product, variant, title, image, color } = card;
  const href = variantHref(product.handle, variant, product.variants.nodes);
  const gender = variant.selectedOptions.find(option => optionParam(option.name) === 'kjonn')?.value;
  const colorSheet = productVariantColorSheet(product.handle, variant);
  const front = <div className={styles.front}>
    <Link href={href} prefetch={false} className={styles.imageLink} aria-label={`Se ${title}`}>
      <Image src={image.url} alt={image.altText || title} width={image.width} height={image.height}
        className={styles.image} sizes={sizes} loading={eager ? 'eager' : 'lazy'} />
    </Link>
    {gender && <span className={styles.gender}>{gender}</span>}
    <div className={styles.wishlist}>
      <WishlistButton productId={product.id} handle={product.handle} variantId={variant.id}
        title={title} returnTo={href} showHoverCard className={styles.wishlistButton} />
    </div>
    <CardContent className={styles.content}>
      <CardHeader className={styles.cardHeader}>
        <CardTitle><h3 className={styles.title}><Link href={href} prefetch={false}>{title}</Link></h3></CardTitle>
        <CardDescription className={styles.price}>{formatMoney(variant.price)}</CardDescription>
      </CardHeader>
      <VariantCardActions handle={product.handle} variantId={variant.id} available={variant.availableForSale} title={title}
        reservationSelection={product.handle === 'utekos-dun' ? dunSelection(variant) : undefined} />
    </CardContent>
  </div>;
  return <Card className={styles.card} data-variant-card={variant.id} data-tracking-commerce={JSON.stringify(productCommerce(product, variant))} data-color={color} aria-label={title}>
    {colorSheet ? <ProductCardFlip label={title} back={<ProductCardColorSheet sheet={colorSheet} />}>{front}</ProductCardFlip> : front}
  </Card>;
}

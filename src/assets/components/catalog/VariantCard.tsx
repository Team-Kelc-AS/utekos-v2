import 'server-only';
import { productCommerce } from '@/lib/shopify/commerce';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import type { OverviewCard } from '@/lib/catalog/overview';
import { formatMoney } from '@/lib/products/money';
import { optionParam, variantHref } from '@/lib/products/variants';
import { VariantCardActions } from './VariantCardActions';
import styles from './ProductOverview.module.css';

const sizes = '(min-width: 1328px) 302px, (min-width: 1280px) 25vw, (min-width: 768px) 33vw, 67vw';

export function VariantCard({ card, eager = false }: { card: OverviewCard; eager?: boolean }) {
  const { product, variant, title, image, color } = card;
  const href = variantHref(product.handle, variant, product.variants.nodes);
  const gender = variant.selectedOptions.find(option => optionParam(option.name) === 'kjonn')?.value
    ?? (product.handle === 'utekos-svale' ? 'Unisex' : null);
  return <Card className={styles.card} data-variant-card={variant.id} data-tracking-commerce={JSON.stringify(productCommerce(product, variant))} data-color={color} aria-label={title}>
    <Link href={href} prefetch={false} className={styles.imageLink} aria-label={`Se ${title}`}>
      <Image src={image.url} alt={image.altText || title} width={image.width} height={image.height}
        className={styles.image} sizes={sizes} loading={eager ? 'eager' : 'lazy'} />
    </Link>
    {gender && <span className={styles.gender}>{gender}</span>}
    <div className={styles.wishlist}>
      <WishlistButton productId={product.id} handle={product.handle} variantId={variant.id}
        title={title} returnTo={href} className={styles.wishlistButton} />
    </div>
    <CardContent className={styles.content}>
      <CardHeader className={styles.cardHeader}>
        <CardTitle><h3 className={styles.title}><Link href={href} prefetch={false}>{title}</Link></h3></CardTitle>
        <CardDescription className={styles.price}>{formatMoney(variant.price)}</CardDescription>
      </CardHeader>
      <VariantCardActions handle={product.handle} variantId={variant.id} available={variant.availableForSale} title={title} />
    </CardContent>
  </Card>;
}

export function SvaleGuideCard() {
  return <Card className={styles.card} data-guide-card="svale">
    <Image src="/Svale_Hoodie_1000x1500.webp" alt="Hetten på Utekos Svale" width={1000} height={1500}
      className={styles.image} sizes={sizes} />
    <CardContent className={styles.content}>
      <CardHeader className={styles.cardHeader}>
        <CardTitle><h3 className={styles.title}>Utekos Svale</h3></CardTitle>
      </CardHeader>
      <div className={styles.guideActions}>
        <Link href="/handlehjelp/storrelsesguide" className={styles.guideLink}>Størrelsesguide</Link>
        <Link href="/produkter/utekos-svale" className={styles.detailLink}>Se Utekos Svale</Link>
      </div>
    </CardContent>
  </Card>;
}

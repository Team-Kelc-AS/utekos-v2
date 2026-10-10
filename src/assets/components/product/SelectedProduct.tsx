import 'server-only';
import { Fragment, Suspense } from 'react';
import { productCommerce } from '@/lib/shopify/commerce';
import { selectionKey } from '@/lib/tracking/selection-key';
import Link from 'next/link';
import { notFound } from 'next/dist/client/components/not-found';
import type { ShopifyProduct } from '@/lib/shopify/product-types';
import { productTitle } from '@/lib/catalog/productTitle';
import { productGallery } from '@/lib/products/gallery';
import { productVariantVideo } from '@/lib/products/variantVideos';
import { formatMoney } from '@/lib/products/money';
import { productAvailability } from '@/lib/products/availability';
import { optionParam, resolveVariant, variantHref, variantOptions, type ProductSearchParams } from '@/lib/products/variants';
import { ProductReviews } from './ProductReviews';
import { ProductDescription } from './ProductDescription';
import { ProductGallery } from './ProductGallery';
import { VariantOptions } from './VariantOptions';
import { OsCaravanSizeGuideDialog } from '@/components/size-guide/os-caravan/OsCaravanSizeGuideDialog';
import { getProductSizeGuideDialogContent } from '@/lib/products/getProductSizeGuideContent';
import { AddToCart } from '@/components/commerce/AddToCart';
import { KlarnaProductExpressCheckout } from '@/components/klarna/KlarnaProductExpressCheckout';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { DunReservationButton } from '@/components/reservations/DunReservationButton';
import { dunSelection } from '@/lib/reservations/dun';
import { CheckMarkIcon } from '@/components/utekos-icons/CheckMarkIcon';
import { TruckOutlineIcon } from '@/components/utekos-icons/TruckOutlineIcon';
import { ReturnsOutlineIcon } from '@/components/utekos-icons/ReturnsOutlineIcon';
import styles from './product.module.css';

export async function SelectedProduct({ product, searchParams }: { product: ShopifyProduct; searchParams: Promise<ProductSearchParams> }) {
  const params = await searchParams;
  const variant = resolveVariant(product, params);
  if (!variant) notFound();
  const title = productTitle(product);
  const images = productGallery(product, variant);
  const options = variantOptions(product, variant);
  const compare = variant.compareAtPrice && variant.compareAtPrice.currencyCode === variant.price.currencyCode && Number(variant.compareAtPrice.amount) > Number(variant.price.amount) ? variant.compareAtPrice : null;
  const availability = productAvailability(variant);
  const label = variant.selectedOptions.filter(o => o.value !== 'Default Title').map(o => o.value).join(' / ');
  return <>
    <div className={`${styles.grid} ${product.handle === 'utekos-techdown' ? styles.mobileSummaryFirst : ''}`} data-product-variant={variant.id} data-tracking-route={`/produkter/${product.handle}`} data-tracking-product={`/produkter/${product.handle}`} data-tracking-selection={selectionKey(params)} data-tracking-commerce={JSON.stringify(productCommerce(product, variant))}>
      <div className={styles.galleryColumn}><ProductGallery key={variant.id} {...images} title={title} video={productVariantVideo(product.handle, variant)} videoLabel={`${title} – ${label}`} showMobileControls={product.handle !== 'utekos-techdown'} /></div>
      <section className={styles.purchase} aria-labelledby="product-title" data-journey-section="purchase">
        <div className={styles.titleRow}><h1 id="product-title">{title}</h1><WishlistButton productId={product.id} handle={product.handle} variantId={variant.id} title={title} returnTo={variantHref(product.handle, variant, product.variants.nodes)} showLabel className={styles.wishlistButton} /></div>
        <div className={styles.price}><strong>{formatMoney(variant.price)}</strong>{compare && <del>{formatMoney(compare)}</del>}</div>
        <VariantOptions selectedId={variant.id}>{options.filter(o => o.values.some(v => v.value !== 'Default Title')).map(option => <Fragment key={option.name}><fieldset><legend>{option.name}</legend><div className={styles.optionValues}>{option.values.map(value => value.href && <Link key={value.value} href={value.href} scroll={false} data-variant aria-current={value.selected ? 'true' : undefined} data-available={value.available} className={`${styles.option} rounded-lg`}>{value.value}{!value.available && <span className="sr-only"> – utsolgt</span>}</Link>)}</div></fieldset>{optionParam(option.name) === 'storrelse' && <div data-tracking-size-guide className={styles.sizeGuideButton}>
          <OsCaravanSizeGuideDialog content={getProductSizeGuideDialogContent(product)} trackingData={{ product_handle: product.handle, placement: 'product-size-selector' }} triggerClassName="h-12 w-full min-w-0 justify-center gap-2 rounded-2xl px-6 font-sans font-semibold text-base" />
        </div>}</Fragment>)}</VariantOptions>
        <p className={styles.stock}>{availability.schema === 'https://schema.org/InStock' && <CheckMarkIcon />}{availability.label}</p>
        <div className={styles.purchaseActions}>
          <AddToCart handle={product.handle} variantId={variant.id} available={variant.availableForSale} />
          {variant.availableForSale && variant.currentlyNotInStock === false && (
            <KlarnaProductExpressCheckout key={variant.id} handle={product.handle} variantId={variant.id} />
          )}
        </div>
        {product.handle === 'utekos-dun' && !variant.availableForSale && <DunReservationButton selection={dunSelection(variant)} />}
        <ul className={styles.trust}><li><TruckOutlineIcon />Gratis frakt fra 999 kr</li><li><ReturnsOutlineIcon /><Link href="/frakt-og-retur">Gratis størrelsesbytte</Link></li></ul>
        <div className={styles.reviewSummary}><Suspense fallback={null}><ProductReviews productId={product.id} /></Suspense></div>
        <ProductDescription handle={product.handle} descriptionHtml={product.descriptionHtml} />
      </section>
    </div>
    <aside className={styles.sticky} aria-label="Kjøp valgt variant"><div><strong>{title}</strong><span>{label}{label ? ' · ' : ''}{formatMoney(variant.price)}</span></div><div><AddToCart handle={product.handle} variantId={variant.id} available={variant.availableForSale} compact /></div></aside>
  </>;
}

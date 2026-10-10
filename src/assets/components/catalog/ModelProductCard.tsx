import 'server-only';
import { Suspense } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { productTitle } from '@/lib/catalog/productTitle';
import { modelPriceRange, modelPreviewVariant, modelVariants } from '@/lib/catalog/modelPurchase';
import { formatMoney } from '@/lib/products/money';
import { variantHref } from '@/lib/products/variants';
import { productCommerce } from '@/lib/shopify/commerce';
import type { ShopifyProduct } from '@/lib/shopify/product-types';
import { ModelPurchaseControls } from './ModelPurchaseControls';
import { ModelProductReviews } from './ModelProductReviews';
import { ModelSizeGuide } from './ModelSizeGuide';
import styles from './camping.module.css';

/** A model card owns no selected purchase variant until the customer chooses one. */
export function ModelProductCard({ product }: { product: ShopifyProduct }) {
  const title = productTitle(product);
  const preview = modelPreviewVariant(product.variants.nodes);
  const range = modelPriceRange(product.variants.nodes);
  if (!preview || !range) return null;
  const image = preview.image;
  const variants = modelVariants(product);
  const tracking = {
    previewVariantId: preview.id,
    variants: Object.fromEntries(product.variants.nodes.map(variant => [variant.id, {
      href: variantHref(product.handle, variant, product.variants.nodes),
      commerce: productCommerce(product, variant),
    }])),
  };
  const waitlist = product.handle === 'utekos-dun' && !variants.some(variant => variant.available);
  return <Card className={styles.modelCard} data-product-model={product.handle} aria-label={title}>
    <ModelPurchaseControls product={{ handle: product.handle, title, variants }} waitlist={waitlist} tracking={tracking}
      initialImage={image && <Image src={image.url} alt={image.altText || title} width={image.width} height={image.height}
        sizes="(min-width: 1200px) 560px, (min-width: 760px) 46vw, 94vw" className={styles.productImage} />
      }
      initialPrice={<p className={styles.price}>{formatMoney(range.min)}{Number(range.max.amount) !== Number(range.min.amount) && <> – {formatMoney(range.max)}</>}</p>}
      reviews={<div className={styles.reviewRegion}><Suspense fallback={<p className={styles.reviewStatus}>Henter omtaler …</p>}><ModelProductReviews productId={product.id} /></Suspense></div>}>
      <ModelSizeGuide product={product} />
    </ModelPurchaseControls>
  </Card>;
}

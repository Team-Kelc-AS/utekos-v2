import 'server-only';
import { Suspense } from 'react';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import { modelPreviewVariant } from '@/lib/catalog/modelPurchase';
import dunCardImage from '../../../../public/images/kunnskap/dun_1440_1800.webp';
import { optionParam } from '@/lib/products/variants';
import { productVariantVideo } from '@/lib/products/variantVideos';
import type { ShopifyProduct } from '@/lib/shopify/product-types';
import { ModelProductReviews } from './ModelProductReviews';
import { ModelSizeGuide } from './ModelSizeGuide';
import styles from './camping.module.css';

/** One homepage card per product; the displayed variant is the purchase variant. */
export function ModelProductCard({ product }: { product: ShopifyProduct }) {
  const isDun = product.handle === 'utekos-dun';
  const variants = isDun ? product.variants.nodes.filter(variant => variant.selectedOptions.some(
    option => optionParam(option.name) === 'farge' && option.value === 'Fjellblå',
  )) : product.variants.nodes;
  const preview = modelPreviewVariant(variants);
  if (!preview) return null;
  // Preserve the category's fail-closed stock rule, including unknown inventory.
  const variant = {
    ...preview,
    image: isDun ? {
      url: dunCardImage.src,
      width: dunCardImage.width,
      height: dunCardImage.height,
      altText: 'Utekos Dun™ i Fjellblå i bruk ved en snødekt fjellutsikt',
    } : preview.image,
    availableForSale: preview.availableForSale && preview.currentlyNotInStock === false,
    currentlyNotInStock: preview.currentlyNotInStock !== false,
  };
  return <div data-product-model={product.handle}>
    <ProductCard product={product} variant={variant} video={productVariantVideo(product.handle, variant)} />
    <div className={styles.cardHelp}>
      <Suspense fallback={<p className={styles.reviewStatus}>Henter omtaler …</p>}>
        <ModelProductReviews productId={product.id} />
      </Suspense>
      <ModelSizeGuide product={product} />
    </div>
  </div>;
}

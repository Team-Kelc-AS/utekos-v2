import 'server-only';
import { Suspense } from 'react';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import dunCardImage from '../../../../public/images/kunnskap/dun_1440_1800.webp';
import { optionParam } from '@/lib/products/variants';
import { productVariantVideo } from '@/lib/products/variantVideos';
import type { ProductImage, ProductVariant, ShopifyProduct } from '@/lib/shopify/product-types';
import { ModelProductReviews } from './ModelProductReviews';
import styles from './camping.module.css';

// Dun's Shopify variant images can depict Mikrofiber; use the verified originals.
const dunImages: Readonly<Record<string, ProductImage>> = {
  Fjellblå: {
    url: dunCardImage.src,
    width: dunCardImage.width,
    height: dunCardImage.height,
    altText: 'Utekos Dun™ i Fjellblå i bruk ved en snødekt fjellutsikt',
  },
  Vargnatt: {
    url: 'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Dun-Vargnatt-Full-Front-1200x1200.webp?v=1786208128',
    width: 1600,
    height: 1600,
    altText: 'Utekos Dun™ i Vargnatt med oransje detaljer, sett forfra',
  },
};

/** The displayed variant is the purchase variant, including its size and color. */
export function ModelProductCard({ product, variant: preview }: { product: ShopifyProduct; variant: ProductVariant }) {
  const color = preview.selectedOptions.find(option => optionParam(option.name) === 'farge')?.value;
  // Preserve the category's fail-closed stock rule, including unknown inventory.
  const variant = {
    ...preview,
    image: product.handle === 'utekos-dun' ? dunImages[color ?? ''] ?? null : preview.image,
    availableForSale: preview.availableForSale && preview.currentlyNotInStock === false,
    currentlyNotInStock: preview.currentlyNotInStock !== false,
  };
  return <div data-product-model={product.handle}>
    <ProductCard product={product} variant={variant} video={productVariantVideo(product.handle, variant)} />
    <div className={styles.cardHelp}>
      <Suspense fallback={<p className={styles.reviewStatus}>Henter omtaler …</p>}>
        <ModelProductReviews productId={product.id} />
      </Suspense>
    </div>
  </div>;
}

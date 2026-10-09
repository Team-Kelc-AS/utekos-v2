import 'server-only';
import type { Metadata } from 'next';
import type { ShopifyProduct } from '@/lib/shopify/product-types';
import { productTitle } from '@/lib/catalog/productTitle';
import { getProductPageDescriptionText } from '@/lib/products/content';
import { descriptionPreview } from '@/lib/products/descriptionPreview';
import { productGallery } from '@/lib/products/gallery';
import { resolveVariant } from '@/lib/products/variants';
import { absoluteUrl, productPath } from './site';

/** Family-level metadata follows the family canonical, including on selector URLs. */
export function buildProductMetadata(product: ShopifyProduct): Metadata {
  const title = product.seo.title?.trim() || productTitle(product);
  // 200 is an editorial fallback budget, not a Google character requirement.
  const description = product.seo.description?.trim() || descriptionPreview(
    getProductPageDescriptionText(product.handle) || product.description, 200,
  ).text;
  const canonical = absoluteUrl(productPath(product.handle));
  const defaultVariant = resolveVariant(product);
  const gallery = defaultVariant ? productGallery(product, defaultVariant) : null;
  const primaryImage = gallery?.desktop[0] ?? gallery?.mobile[0];
  const image = primaryImage ? {
    url: absoluteUrl(primaryImage.url),
    alt: primaryImage.altText?.trim() || productTitle(product),
    ...(primaryImage.width > 0 && { width: primaryImage.width }),
    ...(primaryImage.height > 0 && { height: primaryImage.height }),
  } : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website', siteName: 'Utekos', locale: 'nb_NO', title, description, url: canonical,
      ...(image && { images: [image] }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary', title, description,
      ...(image && { images: [{ url: image.url, alt: image.alt }] }),
    },
  };
}

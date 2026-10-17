import 'server-only';
import type { Metadata } from 'next';
import type { ShopifyProduct } from '@/lib/shopify/product-types';
import { productTitle } from '@/lib/catalog/productTitle';
import { getProductPageDescriptionText } from '@/lib/products/content';
import { descriptionPreview } from '@/lib/products/descriptionPreview';
import { productGallery } from '@/lib/products/gallery';
import { optionParam, resolveVariant, type ProductSearchParams } from '@/lib/products/variants';
import { slugifyVariantOption } from '@/lib/products/slugifyVariantOption';
import { absoluteUrl, productPath } from './site';
import { productSocialImages } from './productSocialImages';

/** Google keeps the family canonical; supplied color images have their own OG identity. */
export function buildProductMetadata(product: ShopifyProduct, params: ProductSearchParams = {}): Metadata {
  const title = product.seo.title?.trim() || productTitle(product);
  // 200 is an editorial fallback budget, not a Google character requirement.
  const description = product.seo.description?.trim() || descriptionPreview(
    getProductPageDescriptionText(product.handle) || product.description, 200,
  ).text;
  const canonical = absoluteUrl(productPath(product.handle));
  const defaultVariant = resolveVariant(product);
  const gallery = defaultVariant ? productGallery(product, defaultVariant) : null;
  const primaryImage = gallery?.desktop[0] ?? gallery?.mobile[0];
  // A general or size-only URL must not acquire a color identity as stock changes.
  const selected = params.farge !== undefined || params.variant !== undefined
    ? resolveVariant(product, params) : undefined;
  const color = selected?.selectedOptions.find(option => optionParam(option.name) === 'farge')?.value;
  const colorSlug = color ? slugifyVariantOption(color) : undefined;
  const colorImage = colorSlug ? productSocialImages[product.handle]?.[colorSlug] : undefined;
  const sharingUrl = colorImage && colorSlug ? `${canonical}?farge=${encodeURIComponent(colorSlug)}` : canonical;
  const image = colorImage ? { ...colorImage, url: absoluteUrl(colorImage.url) } : primaryImage ? {
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
      type: 'website', siteName: 'Utekos', locale: 'nb_NO', title, description, url: sharingUrl,
      ...(image && { images: [image] }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary', title, description,
      ...(image && { images: [{ url: image.url, alt: image.alt }] }),
    },
  };
}

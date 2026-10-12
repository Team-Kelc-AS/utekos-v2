import type { ProductImage, ShopifyProduct } from '@/lib/shopify/product-types';
import { optionParam } from '@/lib/products/variants';

/** Keep purchase IDs intact; only use verified, color-specific Dun photography. */
export function prepareHytteProduct(
  product: ShopifyProduct | null,
  dunImages: Readonly<Record<string, ProductImage>>,
): ShopifyProduct | null {
  if (!product?.variants.nodes.length) return null;
  if (product.handle !== 'utekos-dun') return product;
  const color = (variant: ShopifyProduct['variants']['nodes'][number]) =>
    variant.selectedOptions.find(option => optionParam(option.name) === 'farge')?.value;
  const nodes = product.variants.nodes.map(variant => ({
    ...variant,
    // Shopify currently assigns some Dun variants a combination/Mikrofiber image.
    // Unknown colors receive no substitute image from another color or model.
    image: dunImages[color(variant) ?? ''] ?? null,
  })).sort((a, b) => Number(color(b) === 'Fjellblå') - Number(color(a) === 'Fjellblå'));
  return { ...product, variants: { ...product.variants, nodes } };
}

/** One card per confirmed in-stock SKU; unknown stock must not become purchasable. */
export function hytteVariantCards(products: readonly ShopifyProduct[]) {
  return products.flatMap(product => product.variants.nodes
    .filter(variant => variant.availableForSale && variant.currentlyNotInStock === false)
    .map(variant => ({ product, variant })));
}

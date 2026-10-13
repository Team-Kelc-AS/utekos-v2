import type { ProductImage, ShopifyProduct } from '@/lib/shopify/product-types';
import { optionParam } from '@/lib/products/variants';

/** Keep purchase IDs intact; only apply verified, variant-specific photography. */
export function prepareHytteProduct(
  product: ShopifyProduct | null,
  dunImages: Readonly<Record<string, ProductImage>>,
  mikrofiberImages: Readonly<Record<string, ProductImage>> = {},
  stapperImage: ProductImage | null = null,
): ShopifyProduct | null {
  if (!product?.variants.nodes.length) return null;
  const option = (
    variant: ShopifyProduct['variants']['nodes'][number],
    name: string,
  ) => variant.selectedOptions.find(item => optionParam(item.name) === name)?.value;

  if (product.handle === 'utekos-dun') {
    const nodes = product.variants.nodes.map(variant => ({
      ...variant,
      // Shopify currently assigns some Dun variants a combination/Mikrofiber image.
      // Unknown colors receive no substitute image from another color or model.
      image: dunImages[option(variant, 'farge') ?? ''] ?? null,
    })).sort((a, b) => Number(option(b, 'farge') === 'Fjellblå') - Number(option(a, 'farge') === 'Fjellblå'));
    return { ...product, variants: { ...product.variants, nodes } };
  }

  if (product.handle === 'utekos-mikrofiber') {
    const nodes = product.variants.nodes.map(variant => ({
      ...variant,
      image: mikrofiberImages[option(variant, 'storrelse') ?? ''] ?? variant.image,
    }));
    return { ...product, variants: { ...product.variants, nodes } };
  }

  if (product.handle === 'utekos-stapper' && stapperImage) {
    const nodes = product.variants.nodes.map(variant => ({
      ...variant,
      image: stapperImage,
    }));
    return { ...product, variants: { ...product.variants, nodes } };
  }

  return product;
}

/** One card per confirmed in-stock SKU; unknown stock must not become purchasable. */
export function hytteVariantCards(products: readonly ShopifyProduct[]) {
  return products.flatMap(product => product.variants.nodes
    .filter(variant => variant.availableForSale && variant.currentlyNotInStock === false)
    .map(variant => ({ product, variant })));
}

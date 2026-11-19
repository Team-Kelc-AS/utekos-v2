import { popularCartVariants } from '@/lib/cart/popular-cart-variants';
import { publicVariants } from '@/lib/products/variants';
import type { ShopifyProduct } from '@/lib/shopify/product-types';

/** Sales order rechecked against Shopify's last 90 days on 2026-11-06. */
export function campingVariantCards(products: readonly ShopifyProduct[]) {
  const rank = new Map<string, number>(popularCartVariants.map((variant, index) => [
    `gid://shopify/ProductVariant/${variant.id}`, index,
  ]));
  const cards = products.flatMap(product => publicVariants(product)
    .filter(variant => product.handle === 'utekos-techdown' || (variant.availableForSale && variant.currentlyNotInStock === false))
    .map(variant => ({ product, variant })))
    .sort((a, b) => {
      const priority = Number(b.product.handle === 'utekos-techdown') - Number(a.product.handle === 'utekos-techdown');
      return priority || (rank.get(a.variant.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.variant.id) ?? Number.MAX_SAFE_INTEGER);
    });
  return cards;
}

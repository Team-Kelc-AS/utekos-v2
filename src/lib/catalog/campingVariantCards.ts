import { popularCartVariants } from '@/lib/cart/popular-cart-variants';
import { publicVariants } from '@/lib/products/variants';
import type { ShopifyProduct } from '@/lib/shopify/product-types';

/** Sales order rechecked against Shopify's last 90 days on 2026-11-06. */
export function campingVariantCards(products: readonly ShopifyProduct[]) {
  const rank = new Map<string, number>(popularCartVariants.map((variant, index) => [
    `gid://shopify/ProductVariant/${variant.id}`, index,
  ]));
  const cards = products.flatMap(product => publicVariants(product)
    .filter(variant => variant.availableForSale && variant.currentlyNotInStock === false)
    .map(variant => ({ product, variant })))
    .sort((a, b) => (rank.get(a.variant.id) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(b.variant.id) ?? Number.MAX_SAFE_INTEGER));

  // Lead with each model's best-selling available variant so sizes of one model
  // do not fill the first view. Remaining variants retain their sales order.
  const seen = new Set<string>();
  const first = cards.filter(card => {
    if (seen.has(card.product.handle)) return false;
    seen.add(card.product.handle);
    return true;
  });
  const leadingIds = new Set(first.map(card => card.variant.id));
  return [...first, ...cards.filter(card => !leadingIds.has(card.variant.id))];
}

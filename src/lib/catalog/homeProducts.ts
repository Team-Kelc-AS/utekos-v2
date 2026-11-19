import type { ProductCardData } from '@/lib/shopify/getProductCards';

import { TECH_DOWN_SIZES } from '@/lib/products/techDownSizes';

const handles = ['utekos-techdown', 'utekos-mikrofiber', 'comfyrobe'];
const sizes: readonly string[] = TECH_DOWN_SIZES.map(size => size.size);

export function homeProducts(cards: ProductCardData[], excludeProductHandle?: string, includeStapper = false): ProductCardData[] {
  const productHandles = includeStapper ? [...handles, 'utekos-stapper'] : handles;
  return productHandles.filter(handle => handle !== excludeProductHandle).flatMap(handle => {
    const products = cards.filter(card => card.product.handle === handle);
    if (handle !== 'utekos-techdown') return products;
    const sizeIndex = (card: ProductCardData) => {
      const size = card.variant.selectedOptions.find(option => ['Størrelse', 'Size', 'Str'].includes(option.name))?.value;
      const index = sizes.indexOf(size ?? '');
      return index < 0 ? sizes.length : index;
    };
    return products.sort((a, b) => sizeIndex(a) - sizeIndex(b));
  });
}

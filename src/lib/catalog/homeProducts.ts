import type { ProductCardData } from '@/lib/shopify/getProductCards';

const handles = ['utekos-svale', 'utekos-techdown', 'utekos-mikrofiber', 'comfyrobe'];
const sizes = ['Middels', 'Stor', 'Større'];

export function homeProducts(cards: ProductCardData[], excludeProductHandle?: string): ProductCardData[] {
  return handles.filter(handle => handle !== excludeProductHandle).flatMap(handle => {
    const products = cards.filter(card => card.product.handle === handle);
    if (handle !== 'utekos-svale' && handle !== 'utekos-techdown') return products;
    const sizeIndex = (card: ProductCardData) => {
      const size = card.variant.selectedOptions.find(option => ['Størrelse', 'Size', 'Str'].includes(option.name))?.value;
      const index = sizes.indexOf(size ?? '');
      return index < 0 ? sizes.length : index;
    };
    return products.sort((a, b) => sizeIndex(a) - sizeIndex(b));
  });
}

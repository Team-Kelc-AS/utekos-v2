import type { ProductCardData } from '@/lib/shopify/getProductCards';
import type { EmptyCartRecommendation } from './empty-cart-recommendations';

// Shopify sales snapshot, 2026-11-01: net_items_sold over the preceding 90 days.
// Keep this curated order explicit. Prices, images and availability are read live.
export const popularCartVariants = [
  { id: '46944403915000', handle: 'utekos-techdown', title: 'Utekos TechDown™', size: 'Stor' },
  { id: '46944403882232', handle: 'utekos-techdown', title: 'Utekos TechDown™', size: 'Middels' },
  { id: '42903954292984', handle: 'utekos-stapper', title: 'Utekos Stapper™', size: 'Én størrelse' },
  { id: '48249962135800', handle: 'utekos-techdown', title: 'Utekos TechDown™', size: 'Større' },
  { id: '43959919116536', handle: 'comfyrobe', title: 'Comfyrobe™', size: 'XL' },
  { id: '42903231103224', handle: 'utekos-mikrofiber', title: 'Utekos Mikrofiber™', size: 'Stor' },
  { id: '43959919051000', handle: 'comfyrobe', title: 'Comfyrobe™', size: 'XS' },
  { id: '42903231037688', handle: 'utekos-mikrofiber', title: 'Utekos Mikrofiber™', size: 'Middels' },
] as const;

export function selectEmptyCartRecommendations(cards: ProductCardData[]): EmptyCartRecommendation[] {
  const byId = new Map(cards.map(card => [card.variant.id, card]));
  return popularCartVariants.flatMap<EmptyCartRecommendation>(selection => {
    const variantId = `gid://shopify/ProductVariant/${selection.id}`;
    const card = byId.get(variantId);
    const variant = card?.variant;
    if (!card || card.product.handle !== selection.handle || !variant?.availableForSale ||
        variant.currentlyNotInStock !== false || variant.price.currencyCode !== 'NOK' || !variant.image) return [];
    return [{ variantId, handle: selection.handle, title: selection.title, size: selection.size,
      price: { amount: variant.price.amount, currencyCode: variant.price.currencyCode },
      image: { url: variant.image.url, width: variant.image.width, height: variant.image.height } }];
  }).slice(0, 4);
}

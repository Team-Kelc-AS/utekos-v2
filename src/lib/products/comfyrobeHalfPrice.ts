import type { ProductVariant } from '@/lib/shopify/product-types';

export function hasComfyrobeHalfPrice(handle: string, variant: ProductVariant): boolean {
  const compare = variant.compareAtPrice;
  if (handle !== 'comfyrobe' || !compare || compare.currencyCode !== variant.price.currencyCode) return false;

  const price = Number(variant.price.amount);
  const comparePrice = Number(compare.amount);
  return Number.isFinite(price) && Number.isFinite(comparePrice) && price > 0 &&
    Math.round(price * 100) * 2 === Math.round(comparePrice * 100);
}

import type { Cart } from './types';
import type { Money, ProductImage } from '@/lib/shopify/product-types';

export const FREE_SHIPPING_THRESHOLD = 999;
export const COMFY_SHIPPING_CODE = 'COMFYFRI';
export type CartSuggestion = {
  id: string; handle: string; title: string; accessory: boolean;
  minimumPrice: Money;
  variants: { id: string; title: string; price: Money; image: ProductImage | null }[];
};

export function shippingStatus(cart: Cart) {
  if (!cart.lines.length || cart.subtotal.currencyCode !== 'NOK' || cart.total.currencyCode !== 'NOK') return null;
  // Do not promise threshold shipping using an amount before an order discount.
  const subtotal = Math.min(Number(cart.subtotal.amount), Number(cart.total.amount));
  if (!Number.isFinite(subtotal) || subtotal < 0) return null;
  const codeApplied = cart.discountCodes?.some(code => code.applicable && code.code.toUpperCase() === COMFY_SHIPPING_CODE) ?? false;
  return { free: subtotal >= FREE_SHIPPING_THRESHOLD || codeApplied, remaining: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal), progress: Math.min(100, subtotal / FREE_SHIPPING_THRESHOLD * 100), codeApplied };
}

// Port of headless SmartCartSuggestions: bridge the gap with the cheapest
// qualifying item; otherwise the most expensive item below the gap. Above the
// threshold, accessories come first, then at most two other recommendations.
export function selectCartSuggestions(cart: Cart, products: CartSuggestion[]) {
  const shipping = shippingStatus(cart);
  if (!shipping) return [];
  const present = new Set(cart.lines.map(line => line.handle));
  const available = [...new Map(products.map(product => [product.id, product])).values()]
    .filter(product => !present.has(product.handle) && product.variants.length > 0 && product.minimumPrice.currencyCode === 'NOK');
  if (!shipping.free) {
    return available.sort((a, b) => {
      const aPrice = Number(a.minimumPrice.amount), bPrice = Number(b.minimumPrice.amount);
      const aBridge = aPrice >= shipping.remaining, bBridge = bPrice >= shipping.remaining;
      if (aBridge !== bBridge) return aBridge ? -1 : 1;
      return aBridge ? aPrice - bPrice : bPrice - aPrice;
    }).slice(0, 1);
  }
  const accessories = available.filter(product => product.accessory);
  return accessories.length
    ? accessories.sort((a, b) => Number(b.handle === 'utekos-stapper') - Number(a.handle === 'utekos-stapper'))
    : available.slice(0, 2);
}

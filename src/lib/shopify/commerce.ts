import { mapShopifyViewItem } from '@/lib/analytics/shopifyViewItemCommerce';
import type { ProductVariant, ShopifyProduct } from './product-types';

export type CommerceProduct = Pick<ShopifyProduct, 'id' | 'handle' | 'title' | 'vendor' | 'productType' | 'collections'>;

// Use the pinned headless mapper for product prices, tax, categories and IDs.
export function productCommerce(product: CommerceProduct, variant: ProductVariant, quantity = 1) {
  // The legacy DTO also types image presentation and a smaller currency union;
  // its pure mapper reads neither image nor that union and validates money.
  return mapShopifyViewItem({ product, variant: variant as Parameters<typeof mapShopifyViewItem>[0]['variant'], quantity });
}

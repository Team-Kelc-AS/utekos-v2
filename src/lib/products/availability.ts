import type { ProductVariant } from '@/lib/shopify/product-types';

/** Both the visible stock label and JSON-LD use the same Storefront state. */
export function productAvailability(variant: Pick<ProductVariant, 'availableForSale' | 'currentlyNotInStock'>) {
  if (!variant.availableForSale) {
    return { schema: 'https://schema.org/OutOfStock', label: 'Denne varianten er utsolgt' } as const;
  }
  if (variant.currentlyNotInStock) {
    return { schema: 'https://schema.org/BackOrder', label: 'Kan bestilles – ikke på lager' } as const;
  }
  return { schema: 'https://schema.org/InStock', label: 'På lager' } as const;
}

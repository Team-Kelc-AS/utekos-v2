import { productTitle } from '@/lib/catalog/productTitle';
import type { ShopifyProduct } from '@/lib/shopify/product-types';

/** Shared by the visible trail and its BreadcrumbList. */
export function productBreadcrumbs(product: Pick<ShopifyProduct, 'handle' | 'title'>): { label: string; href?: string }[] {
  return [
    { label: 'Forsiden', href: '/' },
    { label: 'Produkter', href: '/produkter' },
    { label: productTitle(product) },
  ];
}

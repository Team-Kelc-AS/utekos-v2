import { getProductPageContent, getProductPageDescriptionText } from '@/lib/products/content';
import type { ShopifyProduct } from '@/lib/shopify/product-types';
import type { SummarySource } from './schema';

export function buildProductSummarySource(product: Pick<ShopifyProduct, 'handle' | 'title' | 'description'>): SummarySource {
  const local = getProductPageContent(product.handle);
  const description = getProductPageDescriptionText(product.handle) ?? product.description;
  const details = local?.accordion?.flatMap(section => [
    section.title,
    ...section.groups.flatMap(group => [
      group.title,
      ...(group.paragraphs ?? []),
      ...(group.items ?? []),
      ...(group.rows ?? []).map(row => `${row.label}: ${row.value}`),
      group.note ? `${group.note.title}: ${group.note.text}` : undefined,
    ]),
  ]).filter(Boolean).join('\n') ?? '';

  return { kind: 'product', slug: product.handle, title: product.title, content: `${description}\n\n${details}`.trim() };
}

import { getProductPageContent, getProductPageDescriptionText } from '@/lib/products/content';
import type { ShopifyProduct } from '@/lib/shopify/product-types';
import type { JudgeMeReviews } from '@/lib/products/judgeme';
import type { SummarySource } from './schema';

export function buildProductSummarySource(product: Pick<ShopifyProduct, 'handle' | 'title' | 'description'>, reviews: JudgeMeReviews | null = null): SummarySource {
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

  return {
    kind: 'product', slug: product.handle, title: product.title, content: `${description}\n\n${details}`.trim(),
    reviews: reviews ? {
      average: reviews.average,
      count: reviews.count,
      // Bound model input; keep the real aggregate and disclose partial coverage.
      // Names, IDs, dates and buyer metadata are not sent to the model.
      items: [...reviews.reviews]
        .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.id.localeCompare(b.id))
        .slice(0, 40)
        .map(({ rating, title, body }) => ({ rating, title: title.slice(0, 200), body: body.slice(0, 1500) })),
    } : null,
  };
}

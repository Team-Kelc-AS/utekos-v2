import { z } from 'zod';

export const summaryTargetSchema = z.object({
  kind: z.enum(['product', 'article']),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
}).strict();

export type SummaryTarget = z.infer<typeof summaryTargetSchema>;

export const pageSummarySchema = z.object({
  summary: z.string().trim().min(20).max(350)
    .describe('En til to korte setninger på bokmål, maksimalt 35 ord, inkludert det viktigste forbeholdet.'),
  reviewSummary: z.string().trim().max(220)
    .describe('Maksimalt 20 ord om faktiske produktomtaler. Tom streng når kilden mangler omtaletekst, eller siden er en artikkel.'),
});

export const summaryResponseSchema = z.object({
  reviews: z.object({
    average: z.number().min(0).max(5),
    count: z.number().int().nonnegative(),
    includedCount: z.number().int().nonnegative(),
  }).nullable(),
  content: pageSummarySchema,
});

export type PageSummary = z.infer<typeof pageSummarySchema>;
export const summarySourceSchema = summaryTargetSchema.extend({
  title: z.string().min(1).max(500),
  content: z.string().min(100).max(110_000),
  reviews: z.object({
    average: z.number().min(0).max(5),
    count: z.number().int().nonnegative(),
    items: z.array(z.object({ rating: z.number().int().min(1).max(5), title: z.string().max(200), body: z.string().max(1500) })).max(40),
  }).nullable().optional(),
});
export type SummarySource = z.infer<typeof summarySourceSchema>;

export function validateSummary(summary: PageSummary, source: SummarySource): PageSummary {
  if (summary.summary.split(/\s+/).length > 35 || summary.reviewSummary.split(/\s+/).length > 20) {
    throw new Error('Summary word limit exceeded');
  }
  const hasReviewText = source.kind === 'product' && source.reviews?.items.some(review => review.title || review.body);
  if (!hasReviewText && summary.reviewSummary) {
    throw new Error('Summary contains unsupported review claims');
  }
  if (hasReviewText && !summary.reviewSummary) throw new Error('Summary omitted available reviews');
  return summary;
}

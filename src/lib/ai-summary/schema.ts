import { z } from 'zod';
import { ARTICLE_HEADINGS } from './articlePresentation';
export { ARTICLE_HEADINGS } from './articlePresentation';

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

export const articleSummarySchema = z.object({
  scope: z.string().trim().min(40).max(240).describe('Artikkelens tema og avgrensning. Omtrent 140 tegn.'),
  learning: z.string().trim().min(60).max(290).describe('Hva leseren lærer. Omtrent 180 tegn.'),
  points: z.array(z.object({
    text: z.string().trim().min(10).max(300),
    details: z.array(z.string().trim().min(10).max(250)).max(3),
  })).min(3).max(5).describe('Hovedpunkter med minst ett underpunkt totalt. Omtrent 605 tegn inkludert mellomrom.'),
});
export type ArticleSummary = z.infer<typeof articleSummarySchema>;

// Count visible text, with one space between blocks; list markers are CSS.
export function articleSummaryMetrics(summary: ArticleSummary) {
  const sections = [
    `${ARTICLE_HEADINGS[0]} ${summary.scope}`,
    `${ARTICLE_HEADINGS[1]} ${summary.learning}`,
    [ARTICLE_HEADINGS[2], ...summary.points.flatMap(point => [point.text, ...point.details])].join(' '),
  ].map(text => text.normalize('NFC').replace(/\s+/g, ' ').trim());
  const lengths = sections.map(text => Array.from(text).length);
  const total = Array.from(sections.join(' ')).length;
  return { total, lengths, proportions: lengths.map(length => length / total) };
}

export function articleSummaryIssues(summary: ArticleSummary): string[] {
  const { total, lengths, proportions } = articleSummaryMetrics(summary);
  const issues: string[] = [];
  if (total < 950 || total > 1000) issues.push(`Lengden er ${total} tegn; kravet er 950–1000.`);
  if (!summary.points.some(point => point.details.length > 0)) issues.push('Minst ett hovedpunkt må ha et underpunkt.');
  [15, 20, 65].forEach((target, index) => {
    if (Math.abs(lengths[index] * 100 - target * total) > 5 * total) issues.push(`${ARTICLE_HEADINGS[index]} utgjør ${Math.round(proportions[index] * 100)} %; målet er ca. ${target} %.`);
  });
  return issues;
}

export const productSummaryResponseSchema = z.object({
  reviews: z.object({
    average: z.number().min(0).max(5),
    count: z.number().int().nonnegative(),
    includedCount: z.number().int().nonnegative(),
  }).nullable(),
  content: pageSummarySchema,
});
export const summaryResponseSchema = productSummaryResponseSchema.extend({ content: z.union([pageSummarySchema, articleSummarySchema]) });

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

export function validateSummary(summary: PageSummary | ArticleSummary, source: SummarySource) {
  if (source.kind === 'article') {
    const article = articleSummarySchema.parse(summary);
    const issues = articleSummaryIssues(article);
    if (issues.length) throw new Error(issues.join(' '));
    return article;
  }
  if (!('summary' in summary)) throw new Error('Invalid product summary');
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

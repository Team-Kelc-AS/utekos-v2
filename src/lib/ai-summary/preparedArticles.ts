import prepared from './articleSummaries.generated.json';
import { articleSummarySchema, validateSummary, type SummarySource } from './schema';
import { summaryCacheKey, SUMMARY_MODEL } from './prompt';

export function getPreparedArticleSummary(source: SummarySource) {
  const entry = Object.entries(prepared).find(([slug]) => slug === source.slug)?.[1];
  if (!entry || entry.sourceKey !== summaryCacheKey(source, SUMMARY_MODEL)) return null;
  const content = articleSummarySchema.parse(entry.content);
  validateSummary(content, source);
  return content;
}

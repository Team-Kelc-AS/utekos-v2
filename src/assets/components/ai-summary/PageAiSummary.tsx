import type { SummaryTarget } from '@/lib/ai-summary/schema';
import { getSummarySource } from '@/lib/ai-summary/source';
import { getPreparedArticleSummary } from '@/lib/ai-summary/preparedArticles';
import { ProductAiSummary } from './ProductAiSummary';
import { ArticleSummaryDisclosure } from './ArticleSummaryDisclosure';

async function ArticleAiSummary({ target }: { target: SummaryTarget }) {
  const source = await getSummarySource(target);
  const content = source && getPreparedArticleSummary(source);
  if (!content) throw new Error(`Prepared article summary missing or outdated: ${target.slug}`);
  return <ArticleSummaryDisclosure slug={target.slug} content={content} />;
}

export function PageAiSummary({ target }: { target: SummaryTarget }) {
  if (process.env.NEXT_PUBLIC_AI_SUMMARY_ENABLED !== 'true') return null;
  return target.kind === 'article' ? <ArticleAiSummary target={target} /> : <ProductAiSummary target={target} />;
}

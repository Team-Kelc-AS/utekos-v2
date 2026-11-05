import 'server-only';

import { getProduct } from '@/lib/shopify/getProduct';
import { getProductHandles } from '@/lib/shopify/getProductHandles';
import { buildProductSummarySource } from './productSource';
import { knowledgeArticleList } from '@/lib/knowledge/knowledgeArticles';
import articleSources from './articleSources.generated.json';
import type { SummarySource, SummaryTarget } from './schema';

export async function getSummarySource(target: SummaryTarget): Promise<SummarySource | null> {
  if (target.kind === 'article') {
    const article = knowledgeArticleList.find(article => article.slug === target.slug);
    const content = Object.entries(articleSources).find(([slug]) => slug === target.slug)?.[1];
    if (!article || !content) return null;
    return { ...target, title: article.title, content: `${article.description}\n\n${content}` };
  }

  const handles = await getProductHandles();
  if (!handles.includes(target.slug)) return null;
  const product = await getProduct(target.slug);
  if (!product) return null;
  return buildProductSummarySource(product);
}

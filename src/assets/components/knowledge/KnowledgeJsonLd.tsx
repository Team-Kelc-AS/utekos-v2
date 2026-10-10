import 'server-only';
import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles';
import { buildKnowledgeJsonLd, buildKnowledgeOverviewJsonLd, serializeKnowledgeJsonLd } from '@/lib/knowledge/buildKnowledgeJsonLd';

export function KnowledgeJsonLd({ article }: { article?: KnowledgeArticle }) {
  const graph = article ? buildKnowledgeJsonLd(article) : buildKnowledgeOverviewJsonLd();
  return <script id={article ? `knowledge-${article.slug}` : 'knowledge-overview'} type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: serializeKnowledgeJsonLd(graph) }} />;
}

import type { KnowledgeArticle } from './knowledgeArticles';
import type { Route } from 'next';

export function knowledgeBreadcrumbs(article?: Pick<KnowledgeArticle, 'path' | 'title'>): { label: string; href: Route }[] {
  return [
    { label: 'Forsiden', href: '/' },
    { label: 'Uteguiden', href: '/uteguiden' },
    ...(article ? [{ label: article.title, href: article.path }] : []),
  ];
}

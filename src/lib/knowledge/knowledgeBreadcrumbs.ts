import type { KnowledgeArticle } from './knowledgeArticles';

export function knowledgeBreadcrumbs(article?: Pick<KnowledgeArticle, 'path' | 'title'>) {
  return [
    { label: 'Forsiden', href: '/' },
    { label: 'Uteguiden', href: '/uteguiden' },
    ...(article ? [{ label: article.title, href: article.path }] : []),
  ];
}

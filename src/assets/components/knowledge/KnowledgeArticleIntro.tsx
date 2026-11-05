import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles'
import type { ReactNode } from 'react'
import styles from './knowledgeChrome.module.css'
import { KnowledgeArticleMeta } from './KnowledgeArticleMeta'
import { KnowledgeArticleBreadcrumbs } from './KnowledgeArticleBreadcrumbs'

export function KnowledgeArticleIntro({
  article,
  children
}: {
  article: KnowledgeArticle
  children?: ReactNode
}) {
  return (
    <header className={styles.intro}>
      <KnowledgeArticleBreadcrumbs article={article} />
      {children ?? <>
      <h1 className={styles.title}>{article.title}</h1>
      <p className={styles.ingress}>{article.description}</p>
      </>}
      <KnowledgeArticleMeta article={article} />
    </header>
  )
}

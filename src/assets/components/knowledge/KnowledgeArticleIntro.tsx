import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles'
import type { ReactNode } from 'react'
import styles from './knowledgeChrome.module.css'
import { KnowledgeArticleMeta } from './KnowledgeArticleMeta'

export function KnowledgeArticleIntro({
  article,
  afterTitle
}: {
  article: KnowledgeArticle
  afterTitle?: ReactNode
}) {
  return (
    <header className={styles.intro}>
      <h1 className={styles.title}>{article.title}</h1>
      {afterTitle}
      <p className={styles.ingress}>{article.description}</p>
      <KnowledgeArticleMeta article={article} />
    </header>
  )
}

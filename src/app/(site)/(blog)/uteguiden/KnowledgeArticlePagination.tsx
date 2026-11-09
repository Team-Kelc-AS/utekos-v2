import { Children, type ReactNode } from 'react'
import styles from './knowledgeOverview.module.css'

const pageSize = 6

/** All links ship in HTML; native disclosure works before and without JavaScript. */
export function KnowledgeArticlePagination({ children }: { children: ReactNode }) {
  const articles = Children.toArray(children)
  return (
    <>
      <div id='artikkelkort' className={styles.articleGrid}>{articles.slice(0, pageSize)}</div>
      {articles.length > pageSize && (
        <details className={styles.moreArticles}>
          <summary className={styles.showMore}>Se mer</summary>
          <div className={styles.articleGrid}>{articles.slice(pageSize)}</div>
        </details>
      )}
    </>
  )
}

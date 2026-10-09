import type { ReactNode } from 'react'
import styles from '../knowledgeArticle.module.css'

export default function GlampingArticleLayout({ children }: { children: ReactNode }) {
  return (
    <article id='top' className={styles.article}>
      <div className={styles.body}>{children}</div>
    </article>
  )
}

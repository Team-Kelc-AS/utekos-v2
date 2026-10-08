import Breadcrumbs from '@/components/Breadcrumbs'
import type { KnowledgeArticle } from '@/lib/knowledge/knowledgeArticles'
import styles from './knowledgeChrome.module.css'

export function KnowledgeArticleBreadcrumbs({ article }: { article: Pick<KnowledgeArticle, 'title'> }) {
  return (
    <div className={styles.breadcrumbs}>
      <Breadcrumbs items={[
        { label: 'Forsiden', href: '/' },
        { label: 'Uteguiden', href: '/uteguiden' },
        { label: article.title },
      ]} />
    </div>
  )
}

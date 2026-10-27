import Content from './content.mdx'
import { CompareModelsPageHero } from './components/CompareModelsPageHero'
import { buildComparisonMetadata } from './utils/comparisonArticle'
import { comparisonGuideClasses as styles } from './comparisonGuideClasses'
export const metadata = buildComparisonMetadata()

export default function CompareModelsPage() {
  return (
    <article
      className={styles.page}
      aria-labelledby='compare-models-title'
    >
      <CompareModelsPageHero />
      <Content />
    </article>
  )
}

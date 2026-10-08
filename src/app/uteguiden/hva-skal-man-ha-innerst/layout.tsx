import { KnowledgeArticleScaffold } from '@/components/knowledge/KnowledgeArticleScaffold'
import { buildKnowledgeMetadata } from '@/lib/knowledge/buildKnowledgeMetadata'
import { knowledgeArticles } from '@/lib/knowledge/knowledgeArticles'
import type { ReactNode } from 'react'
import { BaseLayerHero } from './BaseLayerHero'

const article = knowledgeArticles.baseLayer

export const metadata = buildKnowledgeMetadata(article)

export default function BaseLayerLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <KnowledgeArticleScaffold article={article} hero={<BaseLayerHero />}>
      {children}
    </KnowledgeArticleScaffold>
  )
}

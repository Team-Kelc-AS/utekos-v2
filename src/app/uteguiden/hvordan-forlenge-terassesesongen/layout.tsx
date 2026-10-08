import type { ReactNode } from 'react'
import { KnowledgeArticleScaffold } from '@/components/knowledge/KnowledgeArticleScaffold'
import { buildKnowledgeMetadata } from '@/lib/knowledge/buildKnowledgeMetadata'
import { knowledgeArticles } from '@/lib/knowledge/knowledgeArticles'

const article = knowledgeArticles.terrace

export const metadata = buildKnowledgeMetadata(article)

export default function TerraceArticleLayout({ children }: { children: ReactNode }) {
  return (
    <KnowledgeArticleScaffold article={article}>
      {children}
    </KnowledgeArticleScaffold>
  )
}

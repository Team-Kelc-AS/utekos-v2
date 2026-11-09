import { KnowledgeRegisteredImage } from '@/components/knowledge/KnowledgeRegisteredImage'
import { knowledgeArticles } from '@/lib/knowledge/knowledgeArticles'

export function BaseLayerHero() {
  return <KnowledgeRegisteredImage article={knowledgeArticles.baseLayer} preload />
}

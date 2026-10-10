import Breadcrumbs from '@/components/Breadcrumbs'
import { knowledgeBreadcrumbs } from '@/lib/knowledge/knowledgeBreadcrumbs'

export function KnowledgeOverviewBreadcrumbs() {
  return <Breadcrumbs items={knowledgeBreadcrumbs().map((item, index, items) => index === items.length - 1 ? { label: item.label } : item)} />
}

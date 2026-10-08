import type { ReactNode } from 'react'
import { googleSansFlex } from '@/lib/fonts'
import styles from './knowledgeArticle.module.css'

export default function KnowledgeLayout({ children }: { children: ReactNode }) {
  return <main className={`${googleSansFlex.variable} ${styles.page}`}>{children}</main>
}

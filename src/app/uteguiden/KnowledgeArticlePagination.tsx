'use client'

import { Children, useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './knowledgeOverview.module.css'

const pageSize = 6

export function KnowledgeArticlePagination({ children }: { children: ReactNode }) {
  const articles = Children.toArray(children)
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visibleCount > pageSize) {
      gridRef.current?.children[visibleCount - pageSize]
        ?.querySelector<HTMLAnchorElement>('a')?.focus()
    }
  }, [visibleCount])

  return (
    <>
      <div id='artikkelkort' className={styles.articleGrid} ref={gridRef}>
        {articles.slice(0, visibleCount)}
      </div>
      {visibleCount < articles.length && (
        <button
          type='button'
          className={styles.showMore}
          aria-controls='artikkelkort'
          onClick={() => setVisibleCount(count => count + pageSize)}
        >
          Se mer
        </button>
      )}
    </>
  )
}

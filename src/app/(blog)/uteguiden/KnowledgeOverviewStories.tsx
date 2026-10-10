import 'server-only'

import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { cn } from 'cn'
import {
  knowledgeArticleList,
  knowledgeArticles,
  type KnowledgeArticle
} from '@/lib/knowledge/knowledgeArticles'
import styles from './knowledgeOverview.module.css'
import { KnowledgeArticlePagination } from './KnowledgeArticlePagination'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type OverviewArticle = KnowledgeArticle

const overviewArticles = knowledgeArticleList

export function ArticleImage({
  article,
  cover = false,
  thumbnail = false,
  featured = false
}: {
  article: OverviewArticle
  cover?: boolean
  thumbnail?: boolean
  featured?: boolean
}) {
  const image = article.cardImage
  return (
    <Image
      {...image}
      alt={image.alt}
      className={thumbnail ? styles.recommendedImage : cover ? 'block h-auto w-full' : styles.cardImage}
      loading={featured ? 'eager' : undefined}
      fetchPriority={featured ? 'high' : undefined}
      sizes={thumbnail ? '(max-width: 639px) 72px, 96px'
        : featured ? '(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) calc(100vw - 3rem), (max-width: 1264px) calc(50vw - 2.375rem), 594px'
        : cover
        ? '(max-width: 767px) calc(100vw - 2rem), (max-width: 1023px) calc(50vw - 2.25rem), (max-width: 1264px) calc(33.33vw - 2rem), 389px'
        : '(max-width: 639px) calc(100vw - 72px), (max-width: 1023px) calc(50vw - 64px), 350px'}
    />
  )
}

export function KnowledgeFeaturedStories() {
  const main = knowledgeArticles.cold
  const recommended = [
    knowledgeArticles.cloudweave,
    knowledgeArticles.baseLayer,
    knowledgeArticles.ykk
  ]
  return (
    <div className={styles.featuredGrid}>
      <KnowledgeArticleCard article={main} featured />
      <aside
        className={styles.recommended}
        aria-labelledby='anbefalt-lesning'
      >
        <h3 id='anbefalt-lesning'>Anbefalt lesning</h3>
        {recommended.map(article => (
          <RecommendedArticleCard key={article.slug} article={article} />
        ))}
      </aside>
    </div>
  )
}

function RecommendedArticleCard({ article }: { article: OverviewArticle }) {
  return (
    <article className={styles.recommendedStory}>
      <Link prefetch={false} href={article.path} className={styles.recommendedCard}>
        <ArticleImage article={article} thumbnail />
        <div className={styles.recommendedCopy}>
          <span className={styles.recommendedCategory}>{article.articleSection}</span>
          <h4>{article.title.replace(' – ', ': ')}</h4>
        </div>
      </Link>
    </article>
  )
}

function KnowledgeArticleCard({
  article,
  headingLevel = 3,
  className,
  featured = false
}: {
  article: OverviewArticle
  headingLevel?: 3 | 4
  className?: string
  featured?: boolean
}) {
  const publishedDate = article.publishedAt ? new Intl.DateTimeFormat('nb-NO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Oslo'
  }).format(new Date(article.publishedAt)) : null
  const formattedDate = publishedDate && publishedDate.charAt(0).toLocaleUpperCase('nb-NO') + publishedDate.slice(1)

  return (
    <article className={cn(styles.articleCard, featured && styles.featuredCard, className)}>
      <Link
        prefetch={false}
        href={article.path as Route}
        className="group flex h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b44701] focus-visible:ring-offset-4"
      >
        <Card className="relative flex w-full flex-col overflow-hidden border border-[#f0eee930] bg-[#012622] pt-0 text-[#f0eee9] transition-colors duration-200 group-hover:border-[#b44701] motion-reduce:transition-none">
          <ArticleImage article={article} cover featured={featured} />
          <CardHeader className="flex-1 pt-6 pb-4">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
              <CardTitle role="heading" aria-level={headingLevel} className="min-w-0 flex-[1_1_12rem] text-xl leading-tight font-extrabold tracking-tight decoration-2 underline-offset-4 group-hover:underline">
                {article.title.replace(' – ', ': ')}
              </CardTitle>
              <Badge variant="secondary" className="shrink-0 border-[#f0eee920] bg-[#001a18] text-[#f0eee9] hover:bg-[#b44701]">
                {article.articleSection}
              </Badge>
            </div>
            {featured && <p className={styles.featuredDescription}>{article.description}</p>}
            {article.publishedAt && <CardDescription className="font-medium text-[#f0eee9b3]">
              <time dateTime={article.publishedAt}>{formattedDate}</time>
            </CardDescription>}
          </CardHeader>
          <CardFooter className="border-[#f0eee920] bg-[#001a18]">
            <span className={cn(buttonVariants(), 'w-full rounded-full bg-[#b44701] font-bold text-[#f0eee9] transition-colors group-hover:bg-[#8a3600] motion-reduce:transition-none')}>
              Les artikkelen
            </span>
          </CardFooter>
        </Card>
      </Link>
    </article>
  )
}

export function KnowledgeArticleGrid() {
  return (
    <KnowledgeArticlePagination>
      {overviewArticles.map(article => (
        <KnowledgeArticleCard key={article.slug} article={article} />
      ))}
    </KnowledgeArticlePagination>
  )
}

import { SITE_ORGANIZATION_ID, siteIdentity } from '@/lib/seo/siteIdentity'

export const knowledgeAuthors = {
  utekos: {
    type: 'Organization',
    name: siteIdentity.name,
    url: siteIdentity.aboutUrl,
    id: SITE_ORGANIZATION_ID,
    image: siteIdentity.logo.src,
    /**
     * Circular black/white mark for article bylines. Utekos is always the
     * author; never swap per article.
     */
    avatarImage: siteIdentity.logo.src
  }
} as const

export type KnowledgeAuthorId = keyof typeof knowledgeAuthors

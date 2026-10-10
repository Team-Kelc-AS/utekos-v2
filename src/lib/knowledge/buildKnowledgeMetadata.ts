import type { Metadata } from 'next';
import { absoluteUrl, SITE_ORIGIN } from '@/lib/seo/site';
import { buildRobotsMetadata } from '@/lib/seo/siteMetadata';
import { knowledgeAuthors } from '@/content/authors/knowledgeAuthors';
import { knowledgeOverview, type KnowledgeArticle, type KnowledgeImage } from './knowledgeArticles';

function imageMetadata(image: KnowledgeImage) {
  return { url: absoluteUrl(image.src), width: image.width, height: image.height, alt: image.alt, type: 'image/png' };
}

function commonMetadata(title: string, description: string, path: string, image: KnowledgeImage): Metadata {
  const author = knowledgeAuthors.utekos;
  return {
    metadataBase: new URL(SITE_ORIGIN), title: { absolute: title }, description,
    alternates: { canonical: absoluteUrl(path) },
    authors: [{ name: author.name, url: author.url }], creator: author.name, publisher: author.name,
    robots: buildRobotsMetadata(),
    twitter: {
      card: 'summary_large_image', title: title.replace(/ \| Utekos$/, ''), description,
      images: [{ url: absoluteUrl(image.src), alt: image.alt }],
    },
  };
}

export function buildKnowledgeOverviewMetadata(): Metadata {
  const { metaTitle, description, path, socialImage } = knowledgeOverview;
  return {
    ...commonMetadata(metaTitle, description, path, socialImage), category: 'Uteguiden',
    openGraph: {
      type: 'website', locale: 'nb_NO', url: absoluteUrl(path), siteName: 'Utekos',
      title: metaTitle.replace(/ \| Utekos$/, ''), description, images: [imageMetadata(socialImage)],
    },
  };
}

export function buildKnowledgeMetadata(article: KnowledgeArticle): Metadata {
  const author = knowledgeAuthors[article.authorId];
  return {
    ...commonMetadata(article.metaTitle, article.metaDescription, article.path, article.socialImage),
    category: article.articleSection,
    openGraph: {
      type: 'article', locale: 'nb_NO', url: absoluteUrl(article.path), siteName: 'Utekos',
      title: article.metaTitle.replace(/ \| Utekos$/, ''), description: article.metaDescription,
      images: [imageMetadata(article.socialImage)],
      ...(article.publishedAt && { publishedTime: article.publishedAt }),
      ...(article.updatedAt && { modifiedTime: article.updatedAt }),
      authors: [author.url], section: article.articleSection, tags: [...article.topics],
    },
  };
}

import 'server-only';
import type { Article, BreadcrumbList, CollectionPage, Graph, ImageObject, ItemList, WebPage } from 'schema-dts';
import { absoluteUrl } from '@/lib/seo/site';
import { SITE_ORGANIZATION_ID as organizationId, SITE_WEBSITE_ID as websiteId } from '@/lib/seo/siteIdentity';
import { serializeJsonLd } from '@/lib/seo/JSON-LD/serializeJsonLd';
import { knowledgeArticleList, knowledgeOverview, type KnowledgeArticle, type KnowledgeImage } from './knowledgeArticles';
import { knowledgeBreadcrumbs } from './knowledgeBreadcrumbs';

function imageNode(image: KnowledgeImage) {
  const url = absoluteUrl(image.src);
  return {
    '@type': 'ImageObject', '@id': `${url}#image`, url, contentUrl: url, caption: image.alt,
    width: { '@type': 'QuantitativeValue', value: image.width, unitText: 'px' },
    height: { '@type': 'QuantitativeValue', value: image.height, unitText: 'px' },
  } satisfies ImageObject;
}

function breadcrumbNode(article?: KnowledgeArticle): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList', '@id': `${absoluteUrl(article?.path ?? knowledgeOverview.path)}#breadcrumb`,
    itemListElement: knowledgeBreadcrumbs(article).map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.label, item: absoluteUrl(item.href),
    })),
  };
}

export function buildKnowledgeJsonLd(article: KnowledgeArticle): Graph {
  const url = absoluteUrl(article.path);
  const images = article.images.map(imageNode);
  const page: WebPage = {
    '@type': 'WebPage', '@id': `${url}#webpage`, url, name: article.title,
    description: article.metaDescription, inLanguage: 'nb-NO', isPartOf: { '@id': websiteId },
    mainEntity: { '@id': `${url}#article` }, breadcrumb: { '@id': `${url}#breadcrumb` },
    primaryImageOfPage: { '@id': images[0]['@id'] },
  };
  const entity: Article = {
    '@type': 'Article', '@id': `${url}#article`, url,
    headline: article.title, description: article.metaDescription, inLanguage: 'nb-NO',
    mainEntityOfPage: { '@id': `${url}#webpage` }, isPartOf: { '@id': websiteId },
    author: { '@id': organizationId }, publisher: { '@id': organizationId },
    image: images.map(image => ({ '@id': image['@id'] })),
    articleSection: article.articleSection, keywords: [...article.topics], isAccessibleForFree: true,
    ...(article.publishedAt && { datePublished: article.publishedAt }),
    ...(article.updatedAt && { dateModified: article.updatedAt }),
    ...(article.references.length > 0 && {
      citation: article.references.map(reference => {
        const urls = [...new Set([
          reference.url,
          ...(reference.additionalLinks ?? []).map(link => link.url),
        ].filter((url): url is string => Boolean(url)))];
        return {
          '@type': 'CreativeWork' as const,
          ...(reference.title && { name: reference.title }),
          // Preserve displayed citations without inferring people, dates or identifiers.
          description: [reference.attribution, reference.title, reference.suffix].filter(Boolean).join(' '),
          ...(urls.length > 0 && { url: urls.length === 1 ? urls[0] : urls }),
        };
      }),
    }),
  };
  return { '@context': 'https://schema.org', '@graph': [...images, page, entity, breadcrumbNode(article)] };
}

export function buildKnowledgeOverviewJsonLd(): Graph {
  const url = absoluteUrl(knowledgeOverview.path);
  const list: ItemList = {
    '@type': 'ItemList', '@id': `${url}#articles`, numberOfItems: knowledgeArticleList.length,
    itemListElement: knowledgeArticleList.map((article, index) => ({
      '@type': 'ListItem', position: index + 1, name: article.title, url: absoluteUrl(article.path),
    })),
  };
  const page: CollectionPage = {
    '@type': 'CollectionPage', '@id': `${url}#webpage`, url, name: knowledgeOverview.title,
    description: knowledgeOverview.description, inLanguage: 'nb-NO',
    isPartOf: { '@id': websiteId }, mainEntity: { '@id': `${url}#articles` },
    breadcrumb: { '@id': `${url}#breadcrumb` },
  };
  return { '@context': 'https://schema.org', '@graph': [page, list, breadcrumbNode()] };
}

export function serializeKnowledgeJsonLd(graph: Graph): string {
  return serializeJsonLd(graph);
}

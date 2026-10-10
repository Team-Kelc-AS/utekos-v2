import 'server-only';
import type { Article, BreadcrumbList, Graph, ImageObject, Person, Thing, WebPage } from 'schema-dts';
import { absoluteUrl } from '../site';
import { SITE_CUSTOMER_SERVICE_ID, SITE_ORGANIZATION_ID, SITE_WEBSITE_ID, siteIdentity } from '../siteIdentity';
import { supportPages, supportProductFamilies, type SupportPageKey } from '../supportPages';
import { MERCHANT_RETURN_POLICY_ID, MERCHANT_SHIPPING_SERVICE_ID } from './merchantPolicies';

export function buildSupportJsonLd(key: SupportPageKey): Graph {
  const page = supportPages[key];
  const url = absoluteUrl(page.path);
  const pageId = `${url}#webpage`;
  const breadcrumb: BreadcrumbList = {
    '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
    itemListElement: page.breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem', position: index + 1, name: crumb.label,
      item: absoluteUrl('href' in crumb ? crumb.href : page.path),
    })),
  };
  const webpage: WebPage = {
    '@type': page.pageType, '@id': pageId,
    url, name: page.title, description: page.description,
    inLanguage: siteIdentity.language,
    isPartOf: { '@id': SITE_WEBSITE_ID },
    publisher: { '@id': SITE_ORGANIZATION_ID },
    breadcrumb: { '@id': breadcrumb['@id']! },
  };
  const nodes: Thing[] = [webpage, breadcrumb];
  if ('dateModified' in page) webpage.dateModified = page.dateModified;
  const productFamilies: Thing[] = supportProductFamilies.map(family => ({
    '@type': 'Thing', name: family.name, url: absoluteUrl(family.path),
  }));

  if (key === 'about') {
    const founderImage: ImageObject = {
      '@type': 'ImageObject', '@id': `${url}#founder-image`,
      url: absoluteUrl('/UtekosGrunder.webp'), contentUrl: absoluteUrl('/UtekosGrunder.webp'),
      encodingFormat: 'image/webp',
      width: { '@type': 'QuantitativeValue', value: 1000, unitText: 'px' },
      height: { '@type': 'QuantitativeValue', value: 1250, unitText: 'px' },
      caption: 'Erling Holthe i et blått varmeplagg ved vannet i solnedgangen',
    };
    const founder: Person = {
      '@type': 'Person', '@id': `${url}#erling-holthe`,
      name: 'Erling Holthe', jobTitle: 'Grunnlegger av Utekos',
      url: `${url}#historien`, image: { '@id': founderImage['@id']! },
      subjectOf: { '@id': pageId },
    };
    webpage.mainEntity = { '@id': SITE_ORGANIZATION_ID };
    webpage.about = [{ '@id': SITE_ORGANIZATION_ID }, { '@id': founder['@id']! }];
    nodes.push(founder, founderImage);
  } else if (key === 'contact') {
    webpage.about = { '@id': SITE_ORGANIZATION_ID };
    webpage.mainEntity = { '@id': SITE_CUSTOMER_SERVICE_ID };
  } else if (key === 'shippingReturns') {
    webpage.about = { '@id': SITE_ORGANIZATION_ID };
    webpage.mainEntity = [
      { '@id': MERCHANT_RETURN_POLICY_ID },
      { '@id': MERCHANT_SHIPPING_SERVICE_ID },
    ];
  } else {
    webpage.about = productFamilies;
    if ('article' in page) {
      const article: Article = {
        '@type': 'Article', '@id': `${url}#article`, url,
        mainEntityOfPage: { '@id': pageId },
        headline: page.article.headline, description: page.description,
        inLanguage: siteIdentity.language, publisher: { '@id': SITE_ORGANIZATION_ID },
        articleSection: page.article.section, dateModified: page.article.dateModified,
        isAccessibleForFree: true, about: productFamilies,
      };
      webpage.mainEntity = { '@id': article['@id']! };
      webpage.dateModified = page.article.dateModified;
      nodes.push(article);
    }
  }
  return { '@context': 'https://schema.org', '@graph': nodes };
}

import 'server-only';
import type { Graph } from 'schema-dts';
import { listingPath } from '@/lib/catalog/categories';
import { hytteContent } from '@/lib/catalog/hytteContent';
import { productTitle } from '@/lib/catalog/productTitle';
import { absoluteUrl, productPath } from '../site';
import { SITE_ORGANIZATION_ID, SITE_WEBSITE_ID, siteIdentity } from '../siteIdentity';

export function buildHytteJsonLd(products: readonly { handle: string; title: string; displayName?: string }[], page: number): Graph {
  const url = absoluteUrl(listingPath('hytte', page));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage', '@id': `${url}#webpage`, url,
        name: hytteContent.heading, description: hytteContent.description,
        inLanguage: siteIdentity.language,
        isPartOf: { '@id': SITE_WEBSITE_ID }, publisher: { '@id': SITE_ORGANIZATION_ID },
        mainEntity: { '@id': `${url}#products` },
        breadcrumb: { '@id': `${url}#breadcrumb` }, hasPart: { '@id': `${url}#faq` },
      },
      {
        '@type': 'ItemList', '@id': `${url}#products`, name: 'Varmeplagg til hytta',
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          '@type': 'ListItem', position: index + 1, name: product.displayName ?? productTitle(product),
          url: absoluteUrl(productPath(product.handle)),
        })),
      },
      {
        '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
        itemListElement: [
          { name: 'Forsiden', path: '/' }, { name: 'Produkter', path: '/produkter' },
          { name: 'Hytte', path: listingPath('hytte', page) },
        ].map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.name, item: absoluteUrl(crumb.path) })),
      },
      {
        '@type': 'FAQPage', '@id': `${url}#faq`, url: `${url}#faq`,
        inLanguage: siteIdentity.language, isPartOf: { '@id': `${url}#webpage` },
        mainEntity: hytteContent.faq.map(faq => ({
          '@type': 'Question', name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  };
}

import type { Metadata } from 'next';
import { absoluteUrl } from './site';
import { siteIdentity } from './siteIdentity';
import { buildRobotsMetadata } from './siteMetadata';
import { supportPages, type SupportPageKey } from './supportPages';

export function buildSupportMetadata(key: SupportPageKey): Metadata {
  const page = supportPages[key];
  const url = absoluteUrl(page.path);
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: url },
    robots: { ...buildRobotsMetadata(), 'max-snippet': -1 },
    openGraph: {
      type: page.socialType,
      title: page.title, description: page.description, url,
      siteName: siteIdentity.name, locale: 'nb_NO',
      ...('article' in page && { modifiedTime: page.article.dateModified }),
    },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description },
    // Do not add images (even undefined): native opengraph-image files own them.
    // Next.js resolves Twitter's image from the resulting Open Graph image.
  };
}

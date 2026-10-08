import type { MetadataRoute } from 'next';
import type { ShopifyProduct } from '@/lib/shopify/product-types';
import { productVariantVideo } from '@/lib/products/variantVideos';
import { resolveVariant } from '@/lib/products/variants';
import { absoluteUrl } from './site';

export const homeVideos = {
  desktop: {
    src: 'https://cdn.shopify.com/videos/c/o/v/857bdf220c614b7c89d78c7762b05833.mp4',
    poster: '/UtekosPoster-1920x720_2.webp',
    title: 'Film fra Utekos',
    description: 'Filmen fra Utekos som vises på forsiden i liggende format.',
  },
  mobile: {
    src: 'https://cdn.shopify.com/videos/c/o/v/424301d298594018bc0c33bc0fd21e96.mp4',
    poster: '/Poster_1_1080x1920_2.webp',
    title: 'Film fra Utekos – stående format',
    description: 'Filmen fra Utekos som vises på forsiden i stående format.',
  },
};

type SitemapVideo = NonNullable<MetadataRoute.Sitemap[number]['videos']>[number];

function sitemapVideo(video: { src: string; poster: string; title: string; description: string }): SitemapVideo {
  return {
    title: video.title,
    description: video.description,
    thumbnail_loc: absoluteUrl(video.poster),
    content_loc: video.src,
  };
}

export const homeSitemapVideos = Object.values(homeVideos).map(sitemapVideo);

export function getProductSitemapVideos(product: Pick<ShopifyProduct, 'handle' | 'variants'>): SitemapVideo[] {
  // Only list the film embedded on the canonical URL. Other variants remain
  // crawlable through their links, without adding variant URLs to the sitemap.
  const variant = resolveVariant(product, {});
  const video = variant && productVariantVideo(product.handle, variant);
  return video ? [sitemapVideo(video)] : [];
}

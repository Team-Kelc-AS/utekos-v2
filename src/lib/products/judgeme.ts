import 'server-only';

import { load } from 'cheerio/slim';
import { cacheLife } from 'next/dist/server/use-cache/cache-life';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { z } from 'zod';

export type JudgeMeReview = {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string | null;
  verified: boolean;
};

export type JudgeMeReviews = {
  average: number;
  count: number;
  reviews: JudgeMeReview[];
};

const responseSchema = z.object({
  product_external_id: z.union([z.string(), z.number()]).transform(String),
  widget: z.string().max(2_000_000),
});

/** Extract only public display fields; never inject the provider's HTML or scripts. */
export function parseReviewWidget(input: unknown, externalId: string): JudgeMeReviews {
  const response = responseSchema.parse(input);
  if (response.product_external_id !== externalId) throw new Error('judgeme_product_mismatch');
  const $ = load(response.widget);
  $('script, style, template').remove();
  const widget = $('.jdgm-rev-widg');
  if (widget.length !== 1) throw new Error('judgeme_widget_missing');
  const count = z.coerce.number().int().nonnegative().parse(widget.attr('data-number-of-reviews'));
  const average = z.coerce.number().min(count ? 1 : 0).max(5).parse(widget.attr('data-average-rating'));
  const reviews = widget.find('.jdgm-rev').toArray().map(element => {
    const review = $(element);
    const body = review.find('.jdgm-rev__body').clone();
    body.find('br').replaceWith('\n');
    body.find('p').append('\n');
    const date = review.find('.jdgm-rev__timestamp').attr('datetime');
    return {
      id: z.string().min(1).parse(review.attr('data-review-id')),
      author: review.find('.jdgm-rev__author').text().trim() || 'Anonym',
      rating: z.coerce.number().int().min(1).max(5).parse(review.find('.jdgm-rev__rating').attr('data-score')),
      title: review.find('.jdgm-rev__title').text().trim(),
      body: body.text().trim(),
      date: date && Number.isFinite(Date.parse(date)) ? date : null,
      verified: review.attr('data-verified-buyer') === 'true',
    };
  });
  return { average, count, reviews };
}

async function readWidget(domain: string, externalId: string, token: string, perPage: number, page: number) {
  const url = new URL('https://api.judge.me/api/v1/widgets/product_review');
  url.search = new URLSearchParams({ shop_domain: domain, external_id: externalId, per_page: String(perPage), page: String(page) }).toString();
  const response = await fetch(url, {
    headers: { 'X-Api-Token': token },
    cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('judgeme_unavailable');
  return parseReviewWidget(await response.json(), externalId);
}

/** One bounded request, retaining the real total; no full review pagination on listings. */
export async function getJudgeMePreview(productId: string): Promise<JudgeMeReviews | null> {
  'use cache';
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag(`judgeme:product:${productId}`);
  const externalId = /^gid:\/\/shopify\/Product\/(\d+)$/.exec(productId)?.[1];
  const token = process.env.JUDGE_ME_PUBLIC_API_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!externalId || !token || !domain) { cacheLife('seconds'); return null; }
  try {
    const data = await readWidget(domain, externalId, token, 3, 1);
    return { ...data, reviews: [...new Map(data.reviews.map(review => [review.id, review])).values()].slice(0, 3) };
  } catch {
    cacheLife('seconds');
    return null;
  }
}

/** The public widget endpoint respects Judge.me's storefront publication settings. */
export async function getJudgeMeReviews(productId: string): Promise<JudgeMeReviews | null> {
  'use cache';
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag(`judgeme:product:${productId}`);
  const externalId = /^gid:\/\/shopify\/Product\/(\d+)$/.exec(productId)?.[1];
  const token = process.env.JUDGE_ME_PUBLIC_API_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!externalId || !token || !domain) { cacheLife('seconds'); return null; }

  try {
    let result: JudgeMeReviews | undefined;
    const reviews = new Map<string, JudgeMeReview>();
    // Bounded pagination also handles providers imposing a smaller per-page limit.
    for (let page = 1; page <= 10; page++) {
      const data = await readWidget(domain, externalId, token, 100, page);
      result ??= data;
      if (data.count !== result.count || data.average !== result.average) throw new Error('judgeme_changed_during_pagination');
      const previousSize = reviews.size;
      for (const review of data.reviews) reviews.set(review.id, review);
      if (reviews.size >= result.count || reviews.size === previousSize) break;
    }
    if (!result) return null;
    return { average: result.average, count: result.count, reviews: [...reviews.values()] };
  } catch {
    // Reviews must not block shopping. Do not substitute historical counts or log tokens.
    cacheLife('seconds');
    return null;
  }
}

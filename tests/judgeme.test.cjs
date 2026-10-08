/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

function review(id, extra = '') {
  return `<div class="jdgm-rev" data-review-id="${id}" data-verified-buyer="true">
    <span class="jdgm-rev__author">Test &amp; Person</span>
    <span class="jdgm-rev__rating" data-score="4"></span>
    <time class="jdgm-rev__timestamp" datetime="2026-09-01T12:00:00Z"></time>
    <b class="jdgm-rev__title">En test</b>
    <div class="jdgm-rev__body"><p>Første linje.<br>Andre linje.</p><p>Siste avsnitt.</p>${extra}</div>
  </div>`;
}
function widget(reviews = [review('1')], count = 1, productId = 123) {
  return { product_external_id: productId, widget: `<div class="jdgm-rev-widg" data-average-rating="${count ? '4.00' : '0.00'}" data-number-of-reviews="${count}">${reviews.join('')}</div>` };
}
function setup(responses = [widget()], configured = true) {
  const calls = [];
  const cache = [];
  const api = loadTypeScript('lib/products/judgeme.ts', {
    mocks: { 'cheerio/slim': require('cheerio/slim'), 'next/cache': { cacheLife: value => cache.push(value), cacheTag: () => {} } },
    env: configured ? { JUDGE_ME_PUBLIC_API_TOKEN: 'test-only-token', SHOPIFY_STORE_DOMAIN: 'https://example.myshopify.com/' } : {},
    fetch: async (url, options) => {
      calls.push({ url: String(url), options });
      const result = responses.shift();
      if (result instanceof Error) throw result;
      if (!result) throw new Error('Unexpected provider request');
      return result.status ? { ok: false, status: result.status } : { ok: true, json: async () => result };
    },
  });
  return { ...api, calls, cache };
}

test('only public display fields are extracted; entities and paragraphs remain text', () => {
  const { parseReviewWidget } = setup();
  const data = parseReviewWidget(widget([review('1', '<script>secret()</script><img src=x onerror="bad()"><span>&lt;b&gt;text&lt;/b&gt;</span>')]), '123');
  assert.equal(data.count, 1);
  assert.equal(data.average, 4);
  assert.equal(data.reviews[0].author, 'Test & Person');
  assert.equal(data.reviews[0].verified, true);
  assert.equal(data.reviews[0].date, '2026-09-01T12:00:00Z');
  assert.match(data.reviews[0].body, /Første linje\.\nAndre linje\.\nSiste avsnitt\./);
  assert.match(data.reviews[0].body, /<b>text<\/b>/);
  assert.doesNotMatch(data.reviews[0].body, /secret|onerror|<img/);
  assert.equal(Object.hasOwn(data.reviews[0], 'email'), false);
});

test('Shopify product ID scopes requests and tokens stay out of URLs', async () => {
  const { getJudgeMeReviews, calls } = setup();
  assert.equal((await getJudgeMeReviews('gid://shopify/Product/123')).count, 1);
  const url = new URL(calls[0].url);
  assert.equal(url.origin, 'https://api.judge.me');
  assert.equal(url.pathname, '/api/v1/widgets/product_review');
  assert.equal(url.searchParams.get('external_id'), '123');
  assert.equal(url.searchParams.get('shop_domain'), 'example.myshopify.com');
  assert.equal(url.searchParams.has('api_token'), false);
  assert.equal(calls[0].options.headers['X-Api-Token'], 'test-only-token');
});

test('pagination collects published reviews and deduplicates IDs', async () => {
  const { getJudgeMeReviews, calls } = setup([widget([review('1')], 3), widget([review('1'), review('2')], 3), widget([review('3')], 3)]);
  assert.equal((await getJudgeMeReviews('gid://shopify/Product/123')).reviews.length, 3);
  assert.deepEqual(calls.map(c => new URL(c.url).searchParams.get('page')), ['1', '2', '3']);
});

test('a repeated page stops pagination while retaining the real total', async () => {
  const { getJudgeMeReviews, calls } = setup([widget([review('1')], 3), widget([review('1')], 3)]);
  const result = await getJudgeMeReviews('gid://shopify/Product/123');
  assert.equal(result.reviews.length, 1);
  assert.equal(result.count, 3);
  assert.equal(calls.length, 2);
});

test('zero published reviews is distinct from an unavailable API', async () => {
  const { getJudgeMeReviews } = setup([widget([], 0)]);
  assert.equal((await getJudgeMeReviews('gid://shopify/Product/123')).count, 0);
});

for (const [name, responses] of [
  ['wrong product', [widget([review('1')], 1, 999)]],
  ['HTTP error', [{ status: 429 }]],
  ['timeout', [new Error('timeout')]],
  ['changed widget format', [{ product_external_id: 123, widget: '<div>New format</div>' }]],
  ['invalid rating', [{ product_external_id: 123, widget: widget().widget.replace('4.00', '6.00') }]],
  ['changing publication count', [widget([review('1')], 2), widget([review('2')], 3)]],
]) {
  test(`${name} fails closed with a short retry cache`, async () => {
    const { getJudgeMeReviews, cache } = setup(responses);
    assert.equal(await getJudgeMeReviews('gid://shopify/Product/123'), null);
    assert.equal(cache.at(-1), 'seconds');
  });
}

test('missing configuration and invalid product IDs make no requests', async () => {
  const unavailable = setup([], false);
  assert.equal(await unavailable.getJudgeMeReviews('gid://shopify/Product/123'), null);
  assert.equal(unavailable.calls.length, 0);
  const invalid = setup();
  assert.equal(await invalid.getJudgeMeReviews('gid://shopify/ProductVariant/123'), null);
  assert.equal(invalid.calls.length, 0);
});

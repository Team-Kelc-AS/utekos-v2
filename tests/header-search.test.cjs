/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');

test('search matches every word across title and keywords and ranks title prefixes first', () => {
  const { filterSearchGroups } = loadTypeScript('lib/search/filter.ts');
  const groups = [{ label: 'Produkter', items: [
    { title: 'Utekos Dun™', href: '/produkter/utekos-dun', keywords: ['varme på hytta'] },
    { title: 'Varmeplagg', href: '/produkter/varmeplagg', keywords: ['hytte'] },
    { title: 'Stapper', href: '/produkter/utekos-stapper', keywords: ['pakke'] },
  ] }];
  assert.equal(filterSearchGroups(groups, '  VARME  ')[0].items[0].title, 'Varmeplagg');
  assert.equal(filterSearchGroups(groups, 'dun HYTTA')[0].items[0].title, 'Utekos Dun™');
  assert.equal(filterSearchGroups(groups, 'dun pakke').length, 0);
  assert.equal(filterSearchGroups(groups, '')[0].items.length, 3);
  assert.equal(groups[0].items[0].title, 'Utekos Dun™');
});

function productReader(read) {
  return loadTypeScript('lib/shopify/getSearchProducts.ts', { mocks: { './client': { shopifyFetch: read } } }).getSearchProducts;
}
const page = (nodes, hasNextPage, endCursor) => ({ products: { nodes, pageInfo: { hasNextPage, endCursor } } });
const product = (handle) => ({ handle, title: handle, description: '' });

test('search reads all cursor pages and deduplicates product handles', async () => {
  const cursors = [];
  const read = productReader(async ({ variables }) => {
    cursors.push(variables.after);
    return variables.after === null
      ? page([product('utekos-dun')], true, 'next')
      : page([product('utekos-dun'), product('utekos-stapper')], false, null);
  });
  assert.deepEqual(cursors, []);
  const result = await read();
  assert.equal(result.length, 2);
  assert.deepEqual(cursors, [null, 'next']);
});

test('search fails on repeated or missing cursors and propagates provider errors', async () => {
  await assert.rejects(productReader(async () => page([], true, 'same'))(), /did not advance/);
  await assert.rejects(productReader(async () => page([], true, null))(), /did not advance/);
  await assert.rejects(productReader(async () => { throw new Error('provider unavailable'); })(), /provider unavailable/);
  await assert.rejects(productReader(async () => page([product('hytte')], false, null))(), /conflicts/);
});

test('index uses canonical product names, includes public pages and has unique safe destinations', async () => {
  const { getSearchIndex } = loadTypeScript('lib/search/getSearchIndex.ts', { mocks: {
    'next/dist/server/use-cache/cache-life': { cacheLife() {} },
    'next/dist/server/use-cache/cache-tag': { cacheTag() {} },
    '@/lib/shopify/getSearchProducts': { getSearchProducts: async () => [product('utekos-techdown')] },
  } });
  const { groups } = await getSearchIndex();
  assert.equal(groups[0].items[0].title, 'Utekos TechDown™');
  const urls = groups.flatMap((group) => group.items.map((item) => item.href));
  assert.equal(new Set(urls).size, urls.length);
  for (const href of urls) assert.match(href, /^\/(?!\/|api(?:\/|$)|customer(?:\/|$)|checkout(?:\/|$))/);
  assert.ok(urls.includes('/handlehjelp/storrelsesguide'));
  assert.ok(urls.includes('/produkter/camping-og-bobil/nbcc'));
  assert.ok(urls.includes('/uteguiden/hvorfor-blir-man-kald'));
});

test('route returns 503 with no-store on provider failure, never an empty success', async () => {
  const { GET } = loadTypeScript('app/api/search-index/route.ts', {
    globals: { Response },
    mocks: {
      'next/dist/server/request/connection': { connection: async () => {} },
      'next/dist/client/components/unstable-rethrow': { unstable_rethrow() {} },
      '@/lib/search/getSearchIndex': { getSearchIndex: async () => { throw new Error('unavailable'); } },
    },
  });
  const response = await GET();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.ok((await response.json()).error);
});

test('client shares in-flight fetches, caches five minutes and retries failures', async () => {
  let time = 0;
  let calls = 0;
  let fail = false;
  const { loadSearchIndex } = loadTypeScript('lib/search/client.ts', {
    globals: { Date: { now: () => time } },
    fetch: async () => {
      calls++;
      return { ok: !fail, json: async () => ({ groups: [] }) };
    },
  });
  await Promise.all([loadSearchIndex(), loadSearchIndex()]);
  assert.equal(calls, 1);
  time = 299_999;
  await loadSearchIndex();
  assert.equal(calls, 1);
  time = 300_000;
  fail = true;
  await assert.rejects(loadSearchIndex(), /unavailable/);
  fail = false;
  await loadSearchIndex();
  assert.equal(calls, 3);
});

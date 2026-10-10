/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

function harness(env) {
  const requests = [];
  const api = loadTypeScript('lib/shopify/client.ts', {
    env: { SHOPIFY_STORE_DOMAIN: 'https://fixture.myshopify.com/', ...env },
    globals: { Headers },
    fetch: async (url, init) => {
      requests.push({ url, init });
      return { ok: true, json: async () => ({ data: { shop: { name: 'Fixture' } } }) };
    },
  });
  return { ...api, requests };
}

for (const [label, env, expected] of [
  ['canonical token', { SHOPIFY_STOREFRONT_PRIVATE_TOKEN: 'canonical-private-fixture' }, 'canonical-private-fixture'],
  ['existing production alias', { STOREFRONT_PRIVATE_ACCESS_TOKEN: 'legacy-private-fixture' }, 'legacy-private-fixture'],
  ['canonical precedence', { SHOPIFY_STOREFRONT_PRIVATE_TOKEN: 'canonical-private-fixture', STOREFRONT_PRIVATE_ACCESS_TOKEN: 'legacy-private-fixture' }, 'canonical-private-fixture'],
  ['empty canonical value', { SHOPIFY_STOREFRONT_PRIVATE_TOKEN: '', STOREFRONT_PRIVATE_ACCESS_TOKEN: 'legacy-private-fixture' }, 'legacy-private-fixture'],
]) {
  test(`Storefront server request uses the private header with ${label}`, async () => {
    const { shopifyFetch, requests } = harness(env);
    const result = await shopifyFetch({ query: 'query Fixture { shop { name } }', buyerIp: '192.0.2.1', cache: 'no-store' });
    assert.equal(result.shop.name, 'Fixture');
    assert.equal(requests.length, 1);
    const { url, init } = requests[0];
    assert.equal(url, 'https://fixture.myshopify.com/api/2026-10/graphql.json');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.get('Shopify-Storefront-Private-Token'), expected);
    assert.equal(init.headers.get('Shopify-Storefront-Buyer-IP'), '192.0.2.1');
    assert.equal(init.headers.has('X-Shopify-Storefront-Access-Token'), false);
    assert.equal(init.cache, 'no-store');
    assert.equal(init.body.includes(expected), false);
  });
}

test('Storefront server requests reject absent private tokens even when public tokens exist', async () => {
  for (const env of [{}, {
    SHOPIFY_STOREFRONT_PUBLIC_TOKEN: 'public-fixture',
    SHOPIFY_STOREFORNT_PUBLIC_TOKEN: 'misspelled-public-fixture',
    NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: 'browser-public-fixture',
  }]) {
    const { shopifyFetch, requests } = harness(env);
    await assert.rejects(shopifyFetch({ query: 'query Fixture { shop { name } }' }), /Missing environment variable: SHOPIFY_STOREFRONT_PRIVATE_TOKEN/);
    assert.equal(requests.length, 0);
  }
});

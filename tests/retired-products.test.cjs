/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

test('retired Svale has no public variants or product content', () => {
  const { publicVariants, resolveVariant } = loadTypeScript('lib/products/variants.ts');
  const { getProductPageContent } = loadTypeScript('lib/products/content.ts');
  const product = { handle: 'utekos-svale', variants: { nodes: [{ id: 'gid://shopify/ProductVariant/1', availableForSale: true, selectedOptions: [] }] } };
  assert.equal(publicVariants(product).length, 0);
  assert.equal(resolveVariant(product, { variant: '1' }), undefined);
  assert.equal(getProductPageContent(product.handle), undefined);
  assert.equal(publicVariants({ ...product, handle: 'utekos-techdown' }).length, 1);
});

test('retired product direct lookup stops before contacting Shopify', async () => {
  const { getProduct } = loadTypeScript('lib/shopify/getProduct.ts', { mocks: {
    'next/dist/server/use-cache/cache-life': { cacheLife() {} },
    'next/dist/server/use-cache/cache-tag': { cacheTag() {} },
    './client': { shopifyFetch() { throw new Error('Must not request retired product'); } },
  } });
  assert.equal(await getProduct('utekos-svale'), null);
});

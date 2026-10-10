/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const connection = (nodes, endCursor = null) => ({ nodes, pageInfo: { hasNextPage: endCursor !== null, endCursor } });
const variant = (id, overrides = {}) => ({
  id: `gid://shopify/ProductVariant/${id}`, title: 'Test size', availableForSale: true, currentlyNotInStock: false,
  price: { amount: '999', currencyCode: 'NOK' }, compareAtPrice: null,
  image: { url: `https://example.test/${id}.png`, width: 800, height: 1000, altText: null },
  selectedOptions: [{ name: 'Størrelse', value: 'Middels' }], ...overrides,
});
const product = (variants, handle = 'test-product') => ({ id: `product-${handle}`, handle, title: handle, vendor: 'Utekos', productType: 'Outerwear', collections: connection([]), variants });
function harness(responses) {
  const calls = [];
  const api = loadTypeScript('lib/shopify/getProductCards.ts', { mocks: {
    'next/dist/server/use-cache/cache-life': { cacheLife() {} },
    'next/dist/server/use-cache/cache-tag': { cacheTag() {} },
    './client': { shopifyFetch: async (request) => {
      calls.push(request);
      const response = responses.shift();
      if (response instanceof Error) throw response;
      if (!response) throw new Error('Unexpected request');
      return response;
    } },
  } });
  return { ...api, calls };
}

test('one card per stocked variant preserves the exact price, options and image', async () => {
  const medium = variant(1);
  const large = variant(2, { selectedOptions: [{ name: 'Størrelse', value: 'Stor' }], price: { amount: '1499', currencyCode: 'NOK' } });
  const api = harness([{ products: connection([product(connection([medium, large]))]) }]);
  const cards = await api.getProductCards();
  assert.equal(cards.length, 2);
  assert.equal(cards[0].variant, medium);
  assert.equal(cards[1].variant, large);
  assert.equal(api.calls.length, 1);
});

test('stocked TechDown Liten is included while sold-out, backorder and unknown stock stay excluded', async () => {
  const api = harness([{ products: connection([product(connection([
    variant(1, { availableForSale: false }),
    variant(2, { currentlyNotInStock: true }),
    variant(3, { currentlyNotInStock: undefined }),
    variant(4, { selectedOptions: [{ name: 'Størrelse', value: 'Liten' }] }),
    variant(5),
    variant(6, { availableForSale: false, selectedOptions: [{ name: 'Størrelse', value: 'Liten' }] }),
  ]), 'utekos-techdown')]) }]);
  assert.deepEqual(Array.from(await api.getProductCards(), card => card.variant.id), [4, 5].map(id => `gid://shopify/ProductVariant/${id}`));
});

test('both product and variant pagination include stock beyond the first page', async () => {
  const api = harness([
    { products: connection([product(connection([variant(1)], 'variant-next'))], 'product-next') },
    { products: connection([product(connection([variant(3)]), 'another-product')]) },
    { product: { variants: connection([variant(2)]) } },
  ]);
  assert.deepEqual(Array.from(await api.getProductCards(), card => card.variant.id), [1, 2, 3].map(id => `gid://shopify/ProductVariant/${id}`));
  assert.equal(api.calls[1].variables.after, 'product-next');
  assert.equal(api.calls[2].variables.after, 'variant-next');
  assert.equal(api.calls[2].variables.handle, 'test-product');
});

test('an empty catalogue stays empty; failed reads and stalled cursors are not disguised as sold out', async () => {
  assert.equal((await harness([{ products: connection([]) }]).getProductCards()).length, 0);
  await assert.rejects(harness([new Error('Storefront unavailable')]).getProductCards(), /Storefront unavailable/);
  await assert.rejects(harness([
    { products: connection([], 'same-cursor') }, { products: connection([], 'same-cursor') },
  ]).getProductCards(), /pagination did not advance/);
});

test('homepage starts with Svale Middels, Stor, Større, then TechDown, Mikrofiber and Comfyrobe', () => {
  const { homeProducts } = loadTypeScript('lib/catalog/homeProducts.ts');
  const card = (handle, size) => ({ product: { handle }, variant: variant(1, { selectedOptions: [{ name: 'Størrelse', value: size }] }) });
  const cards = [
    card('comfyrobe', 'XL'), card('utekos-svale', 'Større'), card('utekos-mikrofiber', 'Medium'),
    card('utekos-techdown', 'Stor'), card('utekos-svale', 'Middels'), card('utekos-stapper', 'One size'),
    card('utekos-techdown', 'Større'), card('utekos-svale', 'Stor'), card('utekos-techdown', 'Middels'),
  ];
  const before = cards.slice();
  assert.deepEqual(Array.from(homeProducts(cards), card => `${card.product.handle}/${card.variant.selectedOptions[0].value}`), [
    'utekos-svale/Middels', 'utekos-svale/Stor', 'utekos-svale/Større',
    'utekos-techdown/Middels', 'utekos-techdown/Stor', 'utekos-techdown/Større',
    'utekos-mikrofiber/Medium', 'comfyrobe/XL',
  ]);
  assert.deepEqual(cards, before);
});

test('related carousel excludes every variant of the current product and preserves homepage order', () => {
  const { homeProducts } = loadTypeScript('lib/catalog/homeProducts.ts');
  const cards = ['comfyrobe', 'utekos-techdown', 'utekos-svale', 'utekos-mikrofiber'].flatMap((handle, index) =>
    ['Stor', 'Middels', 'Større'].map((size, sizeIndex) => ({
      product: { handle }, variant: variant(index * 3 + sizeIndex, { selectedOptions: [{ name: 'Størrelse', value: size }] }),
    })));
  const before = cards.slice();
  const homepage = Array.from(homeProducts(cards));
  for (const handle of [...new Set(cards.map(card => card.product.handle)), 'utekos-stapper']) {
    assert.deepEqual(Array.from(homeProducts(cards, handle)), homepage.filter(card => card.product.handle !== handle));
  }
  assert.equal(homeProducts(cards.filter(card => card.product.handle === 'utekos-techdown'), 'utekos-techdown').length, 0);
  assert.deepEqual(cards, before);
});

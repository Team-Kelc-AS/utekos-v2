/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');
const { shippingStatus, selectCartSuggestions } = loadTypeScript('lib/cart/suggestions.ts');
const money = amount => ({ amount: String(amount), currencyCode: 'NOK' });
const cart = (amount, handles = ['comfyrobe']) => ({ lines: handles.map(handle => ({ handle })), subtotal: money(amount), total: money(amount), discountCodes: [] });
const product = (id, price, accessory = false) => ({ id, handle: id, accessory, minimumPrice: money(price), variants: [{ id: `${id}-variant`, price: money(price) }] });

test('shipping boundary, discounts, empty carts and currency are handled conservatively', () => {
  assert.equal(shippingStatus(cart(998.99)).free, false);
  assert.equal(shippingStatus(cart(999)).free, true);
  assert.equal(shippingStatus(cart(0, [])), null);
  assert.equal(shippingStatus({ ...cart(999), total: money(899) }).free, false);
  assert.equal(shippingStatus({ ...cart(999), total: { amount: '999', currencyCode: 'EUR' } }), null);
  assert.equal(shippingStatus({ ...cart(699), discountCodes: [{ code: 'comfyfri', applicable: true }] }).free, false);
  assert.equal(shippingStatus({ ...cart(699), discountCodes: [{ code: 'COMFYFRI', applicable: false }] }).free, false);
});
test('below threshold picks cheapest bridge, else most expensive below gap; deduplicates and excludes current products', () => {
  const products = [product('small', 100, true), product('bridge', 250), product('large', 500), product('comfyrobe', 200)];
  assert.equal(selectCartSuggestions(cart(799), products)[0].id, 'bridge');
  assert.equal(selectCartSuggestions(cart(100), products)[0].id, 'large');
  assert.equal(selectCartSuggestions(cart(799), [products[0], products[0]]).length, 1);
});
test('above threshold preserves accessory priority and two-item recommendation fallback; Stapper first', () => {
  const products = [product('other', 100, true), product('utekos-stapper', 299, true), product('jacket', 1500), product('second', 1200), product('third', 2000)];
  assert.deepEqual(Array.from(selectCartSuggestions(cart(999), products), p => p.id), ['utekos-stapper', 'other']);
  assert.deepEqual(Array.from(selectCartSuggestions(cart(999, ['other', 'utekos-stapper']), products), p => p.id), ['jacket', 'second']);
  assert.equal(selectCartSuggestions(cart(999), [{ ...products[0], variants: [] }]).length, 0);
});
test('suggestion server removes unavailable, out-of-stock and backordered products/variants', async () => {
  const candidate = (id, extra = {}) => ({ id, handle: id, title: id, availableForSale: true, totalInventory: 3, tags: [], priceRange: { minVariantPrice: money(299) }, variants: { nodes: [{ id: `${id}-sold`, availableForSale: false, currentlyNotInStock: false, price: money(299) }, { id: `${id}-ready`, title: 'Orange', availableForSale: true, currentlyNotInStock: false, price: money(299), image: null }], pageInfo: { hasNextPage: false } }, ...extra });
  const ready = candidate('utekos-stapper');
  const api = loadTypeScript('lib/cart/suggestion-products.ts', { mocks: {
    '@/lib/shopify/client': { shopifyFetch: async () => ({ accessories: { nodes: [ready, candidate('sold', { totalInventory: 0 })] }, recommended: { nodes: [ready, candidate('hidden', { availableForSale: false })] } }) },
    '@/lib/shopify/getProduct': {},
  } });
  const result = await api.getCartSuggestionProducts();
  assert.equal(result.length, 1);
  assert.equal(result[0].accessory, true);
  assert.equal(result[0].variants.length, 1);
  assert.equal(result[0].variants[0].id, 'utekos-stapper-ready');
});

test('retired promotion API rejects applications without changing Shopify carts', async () => {
  const api = loadTypeScript('app/api/cart/discount/route.ts', { globals: { Response } });
  const request = (origin = 'https://store.example') => ({
    nextUrl: new URL('https://store.example/api/cart/discount'),
    headers: new Headers({ origin }),
  });
  assert.equal((await api.POST(request('https://evil.example'))).status, 403);
  const response = await api.POST(request());
  assert.equal(response.status, 410);
  assert.match((await response.json()).error, /avsluttet/);
  assert.match(response.headers.get('cache-control'), /no-store/);
});

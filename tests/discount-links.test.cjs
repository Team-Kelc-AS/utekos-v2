/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest, NextResponse } = require('next/server');
const { loadTypeScript } = require('./load-typescript.cjs');
const id = 'gid://shopify/Cart/fixture?key=fixture-key';
const cart = codes => ({ id, discountCodes: codes.map(code => ({ code, applicable: true })) });
function harness(replies, entry = 'lib/cart/discount.ts') {
  const requests = [];
  const api = loadTypeScript(entry, { mocks: {
    'next/dist/server/web/spec-extension/response': { NextResponse },
    '@/lib/shopify/client': { shopifyFetch: async request => {
      requests.push(request);
      const result = replies.shift();
      if (result instanceof Error) throw result;
      if (!result) throw new Error('Unexpected request');
      return result;
    } },
  } });
  return { api, requests };
}

test('shareable discount creates an empty Storefront cart, then retains it for future additions', async () => {
  const h = harness([{ cartCreate: { cart: cart(['NBCC128']), userErrors: [] } }]);
  assert.equal((await h.api.applyDiscountCode('NBCC128', undefined)).id, id);
  assert.equal(h.requests.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(h.requests[0].variables)), { input: { buyerIdentity: { countryCode: 'NO' }, discountCodes: ['NBCC128'] } });
  assert.equal(h.requests[0].cache, 'no-store');
});

test('applying a link preserves existing codes and does not repeat an existing code', async () => {
  const h = harness([{ cart: cart(['OTHER']) }, { cartDiscountCodesUpdate: { cart: cart(['OTHER', 'NBCC128']), userErrors: [] } }]);
  await h.api.applyDiscountCode('NBCC128', id, '192.0.2.1');
  assert.deepEqual([...h.requests[1].variables.codes], ['OTHER', 'NBCC128']);
  assert.equal(h.requests[1].buyerIp, '192.0.2.1');
  const duplicate = harness([{ cart: cart(['nbcc128']) }]);
  await duplicate.api.applyDiscountCode('NBCC128', id);
  assert.equal(duplicate.requests.length, 1);
});

test('expired carts are recreated only after a confirmed read; failures are never retried', async () => {
  const h = harness([{ cart: null }, { cartCreate: { cart: cart(['NBCC128']), userErrors: [] } }]);
  await h.api.applyDiscountCode('NBCC128', id);
  assert.match(h.requests[1].query, /cartCreate/);
  for (const failure of [new Error('Lost response'), { cartCreate: { cart: null, userErrors: [{ message: 'private provider detail' }] } }]) {
    const failed = harness([failure]);
    await assert.rejects(failed.api.applyDiscountCode('NBCC128', undefined));
    assert.equal(failed.requests.length, 1);
  }
});

test('redirect targets stay on origin and retain attribution without redirect loops', () => {
  const { api } = harness([]);
  const target = api.discountDestination('https://utekos.no/discount/NBCC128?redirect=%2Fprodukter%2Futekos-mikrofiber%3Ffarge%3Dfjellbla&utm_source=fixture');
  assert.equal(target.pathname, '/produkter/utekos-mikrofiber');
  assert.equal(target.searchParams.get('farge'), 'fjellbla');
  assert.equal(target.searchParams.get('utm_source'), 'fixture');
  assert.equal(target.searchParams.has('redirect'), false);
  for (const target of ['https://example.org/', '//example.org/', '/\\example.org', '/discount/NBCC128', 'javascript:alert(1)']) {
    const url = new URL('https://utekos.no/discount/NBCC128');
    url.searchParams.set('redirect', target);
    assert.equal(api.discountDestination(url.href).href, 'https://utekos.no/');
  }
  for (const value of ['', ' ', 'x'.repeat(256), 'a\nb', 'a/b']) assert.throws(() => api.discountCode(value));
});

test('discount navigation sets only a private cart cookie, never returns the cart key in the body', async () => {
  const h = harness([{ cartCreate: { cart: cart(['NBCC128']), userErrors: [] } }], 'app/discount/[code]/route.ts');
  const response = await h.api.GET(new NextRequest('https://utekos.no/discount/NBCC128?redirect=/produkter'), { params: Promise.resolve({ code: 'NBCC128' }) });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), 'https://utekos.no/produkter');
  assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  assert.match(response.headers.get('set-cookie'), /Secure/);
  assert.match(response.headers.get('set-cookie'), /SameSite=lax/);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(await response.text(), '');
  assert.equal(response.cookies.get('utekos_cart').value, id);
});

test('HEAD, prefetch and ads-crawler link checks do not create or change carts', async () => {
  const h = harness([], 'app/discount/[code]/route.ts');
  assert.equal(h.api.HEAD(new NextRequest('https://utekos.no/discount/NBCC128')).headers.get('set-cookie'), null);
  for (const headers of [{ purpose: 'prefetch' }, { 'sec-purpose': 'prefetch' }, { 'next-router-prefetch': '1' }, { 'user-agent': 'facebookexternalhit/1.1' }, { 'user-agent': 'meta-externalfetcher/1.1' }, { 'user-agent': 'meta-externalads/1.1' }, { 'user-agent': 'meta-externalagent/1.1' }, { 'user-agent': 'meta-webindexer/1.1' }]) {
    const response = await h.api.GET(new NextRequest('https://utekos.no/discount/NBCC128', { headers }), { params: Promise.resolve({ code: 'NBCC128' }) });
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('set-cookie'), null);
  }
  assert.equal(h.requests.length, 0);
});

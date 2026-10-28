/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest, NextResponse } = require('next/server');
const { loadTypeScript } = require('./load-typescript.cjs');

const fullId = 'gid://shopify/Cart/fixture?key=private-key';
const publicId = 'gid://shopify/Cart/fixture';
const variants = { xs: 'gid://shopify/ProductVariant/43959919051000', xl: 'gid://shopify/ProductVariant/43959919116536' };

class CartError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

function cartFor(size, available = true) {
  return {
    id: publicId,
    checkout: { checkout_id: 'checkout-fixture', creation_revision: 'checkout_rev_fixture' },
    checkoutUrl: 'https://kasse.utekos.no/checkouts/checkout-fixture',
    totalQuantity: 1,
    lines: [{ variantId: variants[size], available }],
    discountCodes: [{ code: 'COMFYFRI', applicable: false }],
    commerce: { currency: 'NOK', value: 845, items: [{ item_id: variants[size] }] },
  };
}

test('buy-now creates one selected cart, confirms the discount, and keeps the ordinary cart cookie untouched', async () => {
  const calls = [];
  const cart = cartFor('xs');
  const api = loadTypeScript('app/api/cart/comfy-buy-now/route.ts', { globals: { TextEncoder }, mocks: {
    'next/server': { NextResponse },
    '@/lib/cart/mutations': { mutateCart: async (...args) => { calls.push(['create', ...args]); return { id: fullId, warnings: [], mutation: { id: 'mutation' } }; } },
    '@/lib/cart/discount': { applyDiscountCode: async (...args) => { calls.push(['discount', ...args]); return { id: fullId, discountCodes: cart.discountCodes }; } },
    '@/lib/cart/server': { CartError, readCart: async id => { calls.push(['read', id]); return cart; }, cartView: async raw => raw },
  } });
  const request = new NextRequest('https://utekos.no/api/cart/comfy-buy-now', {
    method: 'POST', headers: { origin: 'https://utekos.no' }, body: JSON.stringify({ size: 'xs' }),
  });
  const response = await api.POST(request);
  assert.equal(response.status, 200);
  assert.equal(calls[0][1].action, 'add');
  assert.equal(calls[0][1].handle, 'comfyrobe');
  assert.equal(calls[0][1].variantId, variants.xs);
  assert.equal(calls[0][1].quantity, 1);
  assert.equal(calls[0][2], undefined);
  assert.deepEqual(calls[1].slice(1, 3), ['COMFYFRI', fullId]);
  assert.equal(response.cookies.get('utekos_comfy_buy_now_cart').value, fullId);
  assert.equal(response.cookies.get('utekos_cart'), undefined);
  const payload = await response.json();
  assert.equal(payload.cart.checkout.checkout_id, 'checkout-fixture');
  assert.equal(payload.cart.lines[0].variantId, variants.xs);
  assert.equal(JSON.stringify(payload).includes('private-key'), false);
});

test('buy-now rejects unavailable sizes before issuing a checkout cookie', async () => {
  const cart = cartFor('xl', false);
  const api = loadTypeScript('app/api/cart/comfy-buy-now/route.ts', { globals: { TextEncoder }, mocks: {
    'next/server': { NextResponse },
    '@/lib/cart/mutations': { mutateCart: async () => ({ id: fullId, warnings: [] }) },
    '@/lib/cart/discount': { applyDiscountCode: async () => ({ id: fullId, discountCodes: cart.discountCodes }) },
    '@/lib/cart/server': { CartError, readCart: async () => cart, cartView: async raw => raw },
  } });
  const request = new NextRequest('https://utekos.no/api/cart/comfy-buy-now', {
    method: 'POST', headers: { origin: 'https://utekos.no' }, body: JSON.stringify({ size: 'xl' }),
  });
  const response = await api.POST(request);
  assert.equal(response.status, 409);
  assert.equal(response.cookies.get('utekos_comfy_buy_now_cart'), undefined);
});

test('checkout preparation reads the isolated buy-now cart and rejects another variant', async () => {
  const calls = [];
  const cart = cartFor('xs');
  const api = loadTypeScript('app/api/cart/checkout/route.ts', { globals: { TextEncoder }, mocks: {
    'next/dist/server/web/spec-extension/response': { NextResponse },
    '@/lib/cart/server': { CART_COOKIE: 'utekos_cart', CartError, readCart: async id => { calls.push(['read', id]); return cart; }, cartView: async raw => raw },
    '@/lib/cart/checkout': { parseCheckoutEvent: value => value, persistCheckoutAttributes: async (...args) => calls.push(['attributes', ...args]) },
    '@/lib/facebook-login/session': { FACEBOOK_SESSION_COOKIE: 'facebook', readSession: () => null },
  } });
  const request = size => new NextRequest('https://utekos.no/api/cart/checkout', {
    method: 'POST',
    headers: { origin: 'https://utekos.no', cookie: `utekos_cart=ordinary; utekos_comfy_buy_now_cart=${encodeURIComponent(fullId)}` },
    body: JSON.stringify({ method: 'shopify', event: { event_id: 'event-fixture' }, buyNowSize: size }),
  });
  const accepted = await api.POST(request('xs'));
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).checkoutUrl, cart.checkoutUrl);
  assert.deepEqual(calls[0], ['read', fullId]);
  assert.equal(calls.filter(call => call[0] === 'attributes').length, 1);

  const rejected = await api.POST(request('xl'));
  assert.equal(rejected.status, 409);
  assert.equal(calls.filter(call => call[0] === 'attributes').length, 1);
});

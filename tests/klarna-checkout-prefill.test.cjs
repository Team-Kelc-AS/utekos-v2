/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const cartId = 'gid://shopify/Cart/fixture';
const checkoutUrl = 'https://checkout.example.test/checkouts/fixture';
const email = 'kunde@example.test';

function prefill(response) {
  const calls = [];
  class CartError extends Error { constructor(message, status) { super(message); this.status = status; } }
  const api = loadTypeScript('lib/cart/checkout.ts', {
    mocks: {
      '@/lib/analytics/beginCheckoutEvent': { canonicalBeginCheckoutSchema: {} },
      '@/lib/analytics/checkoutAttributionSnapshot': {},
      '@/lib/analytics/checkoutProductContext': {},
      '@/lib/consent/resolveTrackingAuthorization': {},
      '@/lib/shopify/client': { shopifyFetch: async input => { calls.push(input); return response; } },
      './error': { CartError },
    },
  });
  return { run: api.prefillKlarnaCheckoutEmail, calls };
}

function result(cart, userErrors = [], warnings = []) {
  return { cartBuyerIdentityUpdate: { cart, userErrors, warnings } };
}

test('prefill sends only the verified email and accepts a matching checkout', async () => {
  const fixture = prefill(result({ id: cartId, checkoutUrl, buyerIdentity: { email } }));
  await fixture.run(cartId, checkoutUrl, email);
  assert.deepEqual(JSON.parse(JSON.stringify(fixture.calls[0].variables)), {
    cartId, buyerIdentity: { email },
  });
});

test('prefill rejects checkout URL changes and unconfirmed writes', async () => {
  for (const response of [
    result({ id: cartId, checkoutUrl: `${checkoutUrl}-changed`, buyerIdentity: { email } }),
    result({ id: cartId, checkoutUrl, buyerIdentity: { email: 'other@example.test' } }),
    result(null, [{ message: 'Rejected' }]),
    result({ id: cartId, checkoutUrl, buyerIdentity: { email } }, [], [{ message: 'Warning' }]),
  ]) {
    const fixture = prefill(response);
    await assert.rejects(fixture.run(cartId, checkoutUrl, email), error => error.status === 409);
  }
});

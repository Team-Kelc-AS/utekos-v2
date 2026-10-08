/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');

const react = { useSyncExternalStore: (_subscribe, snapshot) => snapshot() };
const cart = { totalQuantity: 1, lines: [], subtotal: { amount: '1499', currencyCode: 'NOK' }, total: { amount: '1499', currencyCode: 'NOK' } };
const cartResult = { cart, warnings: [] };
function loadCart(fetch) { return loadTypeScript('lib/cart/client.ts', { mocks: { react, './tracking': { reportCartMutation() {}, reportCartView() {}, persistCheckoutPreparation: async () => ({ checkoutUrl: 'https://checkout.example.test' }) } }, fetch }); }

test('Express locks concurrent cart operations until authorization is dismissed', async () => {
  const api = loadCart();
  let resolve;
  const preparing = api.prepareExpressCheckout(() => new Promise(done => { resolve = done; }));
  assert.equal(api.useCartState().pending, true);
  assert.equal(await api.changeCart({ action: 'add', handle: 'utekos-svale', variantId: 'fixed', quantity: 1 }), false);
  await assert.rejects(api.prepareExpressCheckout(() => Promise.resolve(cartResult)), /Vent/);
  assert.equal(api.useCartState().pending, true);
  resolve(cartResult);
  await preparing;
  assert.equal(api.useCartState().cart.totalQuantity, 1);
  assert.equal(api.useCartState().open, false);
  assert.equal(api.useCartState().pending, true);
  api.finishExpressCheckout();
  assert.equal(api.useCartState().pending, false);
});

test('prepare rejection preserves a cart that Shopify already changed', async () => {
  const api = loadCart();
  await assert.rejects(api.prepareExpressCheckout(async () => {
    throw new api.ExpressPreparationError('Kontroller handlekurven.', { cart, warnings: ['justert'] });
  }), /Kontroller/);
  assert.equal(api.useCartState().cart.totalQuantity, 1);
  assert.equal(api.useCartState().warnings[0], 'justert');
  assert.equal(api.useCartState().pending, false);
});

test('unknown prepare response refreshes cart under the same lock before release', async () => {
  let api;
  let reads = 0;
  api = loadCart(async url => {
    reads++;
    assert.equal(url, '/api/cart');
    assert.equal(api.useCartState().pending, true);
    return { ok: true, json: async () => cartResult };
  });
  await assert.rejects(api.prepareExpressCheckout(async () => { throw new Error('lost response'); }), /lost response/);
  assert.equal(reads, 1);
  assert.equal(api.useCartState().cart.totalQuantity, 1);
  assert.equal(api.useCartState().pending, false);
});

test('uncertain completion stays locked after dismissal helpers and back-forward restoration', async () => {
  const api = loadCart();
  api.markExpressCheckoutUncertain();
  api.finishExpressCheckout();
  await api.restoreCartAfterNavigation();
  assert.equal(api.useCartState().pending, true);
  assert.match(api.useCartState().error, /Kontroller kjøpet hos Klarna/);
  assert.equal(await api.changeCart({ action: 'add', handle: 'utekos-svale', variantId: 'fixed', quantity: 1 }), false);
  await assert.rejects(api.prepareExpressCheckout(() => Promise.resolve(cartResult)), /Vent/);
});

for (const scenario of [
  { name: 'explicit rejection before forwarding', response: { ok: false, json: async () => ({ error: 'Handlekurven ble endret.', paymentStatus: 'not_submitted' }) }, safe: true },
  { name: 'backend failure after forwarding', response: { ok: false, json: async () => ({ error: 'backend error', paymentStatus: 'unknown' }) }, safe: false },
  { name: 'unclassified error response', response: { ok: false, json: async () => ({ error: 'unknown' }) }, safe: false },
  { name: 'malformed completion response', response: { ok: true, json: async () => { throw new Error('malformed'); } }, safe: false },
  { name: 'lost completion response', safe: false },
]) {
  test(`order completion ${scenario.name} has safe retry=${scenario.safe}`, async () => {
    let calls = 0;
    const api = loadTypeScript('assets/components/klarna/completeKlarnaExpressCheckout.ts', {
      mocks: { react },
      fetch: async (url, options) => {
        calls++;
        assert.equal(url, '/api/klarna/orders');
        assert.equal(JSON.parse(options.body).authorizationToken, 'mock-authorization');
        if (!scenario.response) throw new Error('network failure');
        return scenario.response;
      },
    });
    await assert.rejects(api.completeKlarnaExpressCheckout(
      { approved: true, authorization_token: 'mock-authorization', collected_shipping_address: { country: 'NO' } },
      { orderPayload: {}, shopifyCartId: 'public-cart' },
    ), error => {
      assert.equal(error.notSubmitted, scenario.safe);
      if (!scenario.safe) assert.match(error.message, /Kontroller kjøpet hos Klarna/);
      return true;
    });
    assert.equal(calls, 1);
  });
}

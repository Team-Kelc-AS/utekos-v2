/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { loadTypeScript } = require('./load-typescript.cjs');

// Execute the actual Express component callbacks with a fake SDK, HTTP and hooks.
// This never loads a browser SDK, submits an order or contacts Shopify/Klarna.
async function harness({ disabled = false, prepareError = false } = {}) {
  const calls = [], effects = [], refs = [];
  let click, ready, completed = 0;
  const react = {
    useId: () => 'test', useState: value => [value, () => {}],
    useRef: value => { const ref = { current: value }; refs.push(ref); return ref; },
    useEffect: callback => effects.push(callback),
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
  };
  const cart = { id: 'test', totalQuantity: 1, lines: [], subtotal: { amount: '1990', currencyCode: 'NOK' }, total: { amount: '1990', currencyCode: 'NOK' } };
  const result = { cart, warnings: [], orderPayload: {}, shopifyCartId: 'test-cart' };
  const fetch = async (url, init) => {
    calls.push({ url, body: init?.body && JSON.parse(init.body) });
    if (url === '/api/klarna/prepare') return { ok: !prepareError, json: async () => prepareError ? { error: 'Test: utilgjengelig' } : result };
    if (url === '/api/cart') return { ok: true, json: async () => ({ cart, warnings: [] }) };
    throw new Error(`Unexpected request: ${url}`);
  };
  const cartApi = loadTypeScript('lib/cart/client.ts', {
    mocks: { react, './tracking': { reportCartMutation() {}, persistCheckoutPreparation: async () => ({ checkoutUrl: 'https://example.test' }) } }, fetch,
  });
  const fakeSdk = { Payments: { Buttons: { init: () => ({ load: (options, callback) => { click = options.on_click; ready = callback; } }) } } };
  const mocks = {
    react, 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    '@/lib/cart/client': cartApi,
    './completeKlarnaExpressCheckout': { completeKlarnaExpressCheckout: async () => { completed++; }, KlarnaCompletionError: class extends Error {} },
    './loadKlarna': { loadKlarnaPublicConfig: async () => ({ client_id: 'test' }), loadKlarnaExpressCheckoutSdk: async () => {} },
    './KlarnaExpressCheckoutButton.module.css': { default: { host: 'host' } },
  };
  const source = fs.readFileSync('src/assets/components/klarna/KlarnaProductExpressCheckout.tsx', 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  const context = vm.createContext({ exports, fetch, window: { Klarna: fakeSdk }, IntersectionObserver: class {
    constructor(callback) { this.callback = callback; } disconnect() {} observe() { this.callback([{ isIntersecting: true }]); }
  }, require: name => { if (!(name in mocks)) throw new Error(`Unmocked: ${name}`); return mocks[name]; } });
  new vm.Script(code).runInContext(context);
  exports.KlarnaProductExpressCheckout({ handle: 'utekos-mikrofiber', variantId: 'gid://shopify/ProductVariant/42903231037688', disabled });
  refs[0].current = {};
  effects.forEach(callback => callback());
  await new Promise(resolve => setImmediate(resolve));
  ready({ show_form: true });
  return { click: () => click, calls, cartApi, completed: () => completed };
}

test('the actual Klarna callback prepares the exact selected variant once on double click and releases on cancellation', async () => {
  const h = await harness();
  let cancel;
  const authorize = (_options, _payload, callback) => { cancel = callback; };
  h.click()(authorize); h.click()(authorize);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.calls[0].body, { handle: 'utekos-mikrofiber', variantId: 'gid://shopify/ProductVariant/42903231037688' });
  assert.equal(h.cartApi.useCartState().pending, true);
  cancel({ approved: false });
  assert.equal(h.cartApi.useCartState().pending, false);
  assert.equal(h.completed(), 0);
});

test('disabled/unselected Klarna cannot prepare; API failure releases lock and never authorizes', async () => {
  const disabled = await harness({ disabled: true });
  disabled.click()(() => { throw new Error('Must not authorize'); });
  assert.equal(disabled.calls.length, 0);
  const failed = await harness({ prepareError: true });
  failed.click()(() => { throw new Error('Must not authorize'); });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(failed.calls[0].url, '/api/klarna/prepare');
  assert.equal(failed.calls[1].url, '/api/cart');
  assert.equal(failed.cartApi.useCartState().pending, false);
  assert.equal(failed.completed(), 0);
});

test('ordinary cart double click submits the exact selection once and releases after API error', async () => {
  let resolve;
  const calls = [];
  const api = loadTypeScript('lib/cart/client.ts', { mocks: {
    react: { useSyncExternalStore: (_subscribe, snapshot) => snapshot() },
    './tracking': { reportCartMutation() {} },
  }, fetch: async (_url, init) => { calls.push(JSON.parse(init.body)); return new Promise(done => { resolve = done; }); } });
  const operation = { action: 'add', handle: 'utekos-techdown', variantId: 'gid://shopify/ProductVariant/46944403882232', quantity: 1 };
  const first = api.changeCart(operation);
  assert.equal(await api.changeCart(operation), false);
  await new Promise(done => setImmediate(done));
  assert.deepEqual(calls, [operation]);
  resolve({ ok: false, json: async () => ({ error: 'Test: utsolgt' }) });
  assert.equal(await first, false);
  assert.equal(api.useCartState().pending, false);
  assert.equal(api.useCartState().error, 'Test: utsolgt');
});

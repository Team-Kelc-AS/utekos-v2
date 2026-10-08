/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

// Fictional carts and authorization tokens only. No external requests occur.
const fullId = 'gid://shopify/Cart/fixture-cart?key=fixture-secret';
const publicId = 'gid://shopify/Cart/fixture-cart';
const backend = 'https://backend.utekos.no';
const money = amount => ({ amount, currencyCode: 'NOK' });
function line(id = '1', quantity = 1, amount = '123.45', total = amount) {
  return {
    id: `line-${id}`, quantity,
    cost: { amountPerQuantity: money(amount), totalAmount: money(total) },
    merchandise: { __typename: 'ProductVariant', id: `gid://shopify/ProductVariant/${id}`, title: 'Middels / Vargnatt', price: money(amount), availableForSale: true, currentlyNotInStock: false, product: { title: 'Utekos test', handle: 'utekos-test' } },
  };
}
function cart(lines = [line()], total = '123.45', next = false, cursor = null) {
  return { id: fullId, cost: { totalAmount: money(total) }, lines: { nodes: lines, pageInfo: { hasNextPage: next, endCursor: cursor } } };
}
function server({ pages = [cart()], fetch, env = {} } = {}) {
  const calls = [];
  let page = 0;
  const api = loadTypeScript('lib/klarna/server.ts', { env, fetch, mocks: {
    './backend': { prepareKlarnaOrderForwarder: async () => async body => fetch('authenticated-klarna-test-transport', { body }) },
    '@/lib/shopify/client': { shopifyFetch: async options => {
      calls.push(options);
      return { cart: pages[Math.min(page++, pages.length - 1)] };
    } },
  } });
  return { ...api, calls };
}
const contracts = loadTypeScript('lib/klarna/contracts.ts');
async function validInput(api) {
  return contracts.createOrderSchema.parse({ authorizationToken: 'fixture-authorization', orderPayload: await api.cartOrderPayload(fullId, backend), shopifyCartId: publicId, collectedShippingAddress: { country: 'NO' } });
}

test('only canonical cart IDs with a single secret key yield a public reference', () => {
  const api = server();
  assert.equal(api.cartIdentity(fullId).publicId, publicId);
  for (const id of [undefined, '', publicId, `${fullId}&key=other`, `${fullId}&x=1`, `${fullId}#fragment`, 'gid://attacker/Cart/fixture?key=x', 'gid://shopify/Cart/?key=x', 'gid://shopify/Cart/a/b?key=x', 'gid://shopify/Cart/a?key=%20', 'gid://shopify/Cart/a%20b?key=x', 'gid://shopify/Cart/a?key=x\r\nCookie: stolen']) {
    assert.equal(api.cartIdentity(id), null, String(id));
  }
});

test('backend origin permits fixed HTTPS origins and prevents self proxy recursion', () => {
  assert.equal(server().headlessOrigin('http://localhost:3000'), backend);
  assert.equal(server({ env: { KLARNA_HEADLESS_ORIGIN: 'https://headless.example.test' } }).headlessOrigin(backend), 'https://headless.example.test');
  assert.throws(() => server().headlessOrigin(backend), /utilgjengelig/);
  for (const origin of ['http://example.test', 'https://user:pass@example.test', 'https://example.test/api', 'https://example.test?x=1', 'https://example.test/#x']) {
    assert.throws(() => server({ env: { KLARNA_HEADLESS_ORIGIN: origin } }).headlessOrigin('http://localhost:3000'));
  }
});

test('payload has exact variant, quantity and decimal amounts; no secret cart key', async () => {
  const api = server({ pages: [cart([line('4', 3, '0.29', '0.87')], '0.87')] });
  const payload = await api.cartOrderPayload(fullId, backend, '192.0.2.1');
  assert.equal(payload.order_amount, 87);
  assert.equal(payload.order_lines[0].unit_price, 29);
  assert.equal(payload.order_lines[0].quantity, 3);
  assert.equal(payload.order_lines[0].reference, 'gid://shopify/ProductVariant/4');
  assert.equal(payload.merchant_reference1, publicId);
  assert.equal(payload.merchant_urls.confirmation, `${backend}/kjop/fullfort?klarna_order_id={order.id}`);
  assert.equal(JSON.stringify(payload).includes('fixture-secret'), false);
  assert.equal(api.calls[0].cache, 'no-store');
  assert.equal(api.calls[0].buyerIp, '192.0.2.1');
});

test('every cart line is paginated and checked; stalled and inconsistent reads fail closed', async () => {
  const api = server({ pages: [cart([line('1')], '246.90', true, 'page-2'), cart([line('2')], '246.90')] });
  assert.equal((await api.cartOrderPayload(fullId, backend)).order_lines.length, 2);
  assert.equal(api.calls[1].variables.after, 'page-2');
  for (const pages of [
    [cart([line()], '123.45', true, null)],
    [cart([line()], '123.45', true, 'repeat'), cart([line('2')], '123.45', true, 'repeat')],
    [cart([line()], '123.45', true, 'next'), cart([line('2')], '500.00')],
    [null],
  ]) await assert.rejects(server({ pages }).cartOrderPayload(fullId, backend));
});

test('unavailable, backordered, discounted, non-NOK, empty and unreconciled totals never reach payment', async () => {
  const fixtures = [cart([], '0'), cart([line()], '200'), cart([line('1', 2, '1.00', '3.00')], '3.00'), cart([line('1', 1, '0.001')], '0.001'), cart([line('1', 3, '0.29', '0.80')], '0.80')];
  const soldOut = cart(); soldOut.lines.nodes[0].merchandise.availableForSale = false; fixtures.push(soldOut);
  const backorder = cart(); backorder.lines.nodes[0].merchandise.currentlyNotInStock = true; fixtures.push(backorder);
  const otherCurrency = cart(); otherCurrency.cost.totalAmount.currencyCode = 'EUR'; fixtures.push(otherCurrency);
  const overriddenPrice = cart(); overriddenPrice.lines.nodes[0].merchandise.price = money('150.00'); fixtures.push(overriddenPrice);
  for (const fixture of fixtures) await assert.rejects(server({ pages: [fixture] }).cartOrderPayload(fullId, backend));
});

test('order bridge verifies ownership and current payload before any payment request', async () => {
  let sent = 0;
  const api = server({ fetch: async () => { sent++; throw new Error('must not send'); } });
  const input = await validInput(api);
  await assert.rejects(api.forwardOrder({ ...input, shopifyCartId: 'gid://shopify/Cart/other' }, fullId, backend), /bekreftes/);
  await assert.rejects(api.forwardOrder({ ...input, orderPayload: { ...input.orderPayload, order_amount: 1 } }, fullId, backend), /endret/);
  await assert.rejects(api.forwardOrder({ ...input, orderPayload: { ...input.orderPayload, merchant_urls: { ...input.orderPayload.merchant_urls, confirmation: 'https://evil.example/' } } }, fullId, backend), /endret/);
  assert.equal(sent, 0);
  await assert.rejects(api.forwardOrder({ ...input, shopifyCartId: 'gid://shopify/Cart/other' }, fullId, backend), error => error.paymentStatus === 'not_submitted');
});

test('validated order is submitted through the prepared transport exactly once', async () => {
  const calls = [];
  const api = server({ fetch: async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ klarna_order_id: 'test-order', redirect_url: `${backend}/kjop/fullfort?klarna_order_id=test-order`, shopify_order_id: 'gid://shopify/Order/test' }) };
  } });
  const input = await validInput(api);
  const result = await api.forwardOrder(input, fullId, backend);
  assert.equal(result.klarna_order_id, 'test-order');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'authenticated-klarna-test-transport');
  assert.equal(calls[0].options.body.includes('fixture-secret'), false);
});

test('unsafe redirects and uncertain transport outcomes are not retried', async () => {
  for (const redirect of ['https://evil.example/kjop/fullfort?klarna_order_id=test', `${backend}/evil?klarna_order_id=test`, `${backend}/kjop/fullfort?klarna_order_id=other`]) {
    const api = server({ fetch: async () => ({ ok: true, json: async () => ({ klarna_order_id: 'test', redirect_url: redirect, shopify_order_id: 'gid://shopify/Order/test' }) }) });
    await assert.rejects(api.forwardOrder(await validInput(api), fullId, backend), /bekreftelsessiden/);
  }
  let sends = 0;
  const api = server({ fetch: async () => { sends++; throw new Error('connection interrupted'); } });
  await assert.rejects(api.forwardOrder(await validInput(api), fullId, backend), error => error.paymentStatus === 'unknown' && error.message.includes('Kontroller hos Klarna'));
  assert.equal(sends, 1);
});

test('public button configuration works locally without backend access or private credentials', () => {
  const api = server({ env: { NEXT_PUBLIC_KLARNA_CLIENT_ID: 'klarna_live_client_fixture', KLARNA_API_KEY: 'must-not-leak', KLARNA_HEADLESS_ORIGIN: 'invalid-backend' } });
  assert.equal(JSON.stringify(api.readPublicConfig()), '{"client_id":"klarna_live_client_fixture","environment":"production"}');
  assert.equal(server({ env: { NEXT_PUBLIC_KLARNA_CLIENT_ID: 'klarna_live_client_fixture', NEXT_PUBLIC_KLARNA_ENVIRONMENT: ' playground ' } }).readPublicConfig().environment, 'playground');
  for (const env of [{}, { NEXT_PUBLIC_KLARNA_CLIENT_ID: 'bad' }, { NEXT_PUBLIC_KLARNA_CLIENT_ID: 'klarna_live_client_fixture', NEXT_PUBLIC_KLARNA_ENVIRONMENT: 'invalid' }]) {
    assert.throws(() => server({ env }).readPublicConfig(), error => error.status === 503);
  }
});

function routes(mocks = {}) {
  class MockResponse {
    constructor(data, init) { this.data = data; this.status = init?.status ?? 200; this.headers = init?.headers; this.cookieWrites = []; this.cookies = { set: (...args) => this.cookieWrites.push(args), delete: (...args) => this.cookieWrites.push(['delete', ...args]) }; }
    static json(data, init) { return new MockResponse(data, init); }
  }
  const mutations = [];
  const forwards = [];
  const bridge = server();
  const shared = {
    'next/server': { NextResponse: MockResponse, connection: async () => {} },
    '@/lib/klarna/attribution': { readKlarnaOrderAttribution: async () => ({ attribution: { consent: { source: 'operator_policy' } } }) },
    '@/lib/cart/server': { CART_COOKIE: 'utekos_cart', CartError: class CartError extends Error {}, mutateCart: async (...args) => { mutations.push(args); return { id: fullId, cart: { totalQuantity: 1, lines: [] }, warnings: [] }; } },
    '@/lib/klarna/server': { ...bridge, forwardOrder: async (...args) => { forwards.push(args); return { klarna_order_id: 'fixture' }; } },
    ...mocks,
  };
  return {
    config: loadTypeScript('app/api/klarna/client-config/route.ts', { mocks: shared }).GET,
    prepare: loadTypeScript('app/api/klarna/prepare/route.ts', { mocks: shared }).POST,
    orders: loadTypeScript('app/api/klarna/orders/route.ts', { mocks: shared }).POST,
    mutations, forwards,
  };
}
function request(body, { origin = 'https://v2.example.test', cookie = fullId } = {}) {
  return { nextUrl: new URL('https://v2.example.test/api/klarna/prepare'), headers: new Headers({ origin }), cookies: { get: name => name === 'utekos_cart' && cookie ? { value: cookie } : undefined }, json: async () => body };
}

test('public configuration route returns only browser config with no-store and fails closed when missing', async () => {
  const bridge = server({ env: { NEXT_PUBLIC_KLARNA_CLIENT_ID: 'klarna_live_client_fixture', KLARNA_API_KEY: 'must-not-leak' } });
  const response = await routes({ '@/lib/klarna/server': bridge }).config();
  assert.equal(response.status, 200);
  assert.equal(JSON.stringify(response.data), '{"client_id":"klarna_live_client_fixture","environment":"production"}');
  assert.equal(response.headers['Cache-Control'], 'private, no-store, max-age=0');
  assert.equal(response.cookieWrites.length, 0);
  assert.equal((await routes().config()).status, 503);
});

test('cross-origin requests and malformed fixed variants never mutate carts or forward orders', async () => {
  const api = routes();
  assert.equal((await api.prepare(request({ handle: 'utekos-test', variantId: 'gid://shopify/ProductVariant/1' }, { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await api.prepare(request({ handle: 'utekos-test', variantId: 'gid://shopify/ProductVariant/1', quantity: 100 }))).status, 400);
  assert.equal((await api.orders(request({}, { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await api.orders(request({}, { cookie: undefined }))).status, 400);
  assert.equal((await api.orders(request({}, { cookie: '' }))).status, 403);
  assert.equal(api.mutations.length, 0);
  assert.equal(api.forwards.length, 0);
});

test('prepare adds exactly the requested variant once and stores secret identity only in HttpOnly cookie', async () => {
  const api = routes();
  const response = await api.prepare(request({ handle: 'utekos-test', variantId: 'gid://shopify/ProductVariant/19' }, { cookie: '' }));
  assert.equal(response.status, 200);
  assert.equal(api.mutations.length, 1);
  assert.equal(JSON.stringify(api.mutations[0][0]), '{"action":"add","handle":"utekos-test","variantId":"gid://shopify/ProductVariant/19","quantity":1}');
  assert.equal(response.data.shopifyCartId, publicId);
  assert.equal(JSON.stringify(response.data).includes('fixture-secret'), false);
  assert.equal(response.cookieWrites[0][0], 'utekos_cart');
  assert.equal(response.cookieWrites[0][1], fullId);
  assert.equal(response.cookieWrites[0][2].httpOnly, true);
  assert.equal(response.cookieWrites[0][2].secure, true);
  assert.equal(response.headers['Cache-Control'], 'private, no-store, max-age=0');
});

test('failed payment preparation retains successful cart mutation in cookie and error response', async () => {
  const bridge = server();
  const api = routes({ '@/lib/klarna/server': { ...bridge, cartOrderPayload: async () => { throw new bridge.KlarnaBridgeError('Kontroller handlekurven.', 409); } } });
  const response = await api.prepare(request({ handle: 'utekos-test', variantId: 'gid://shopify/ProductVariant/19' }, { cookie: '' }));
  assert.equal(response.status, 409);
  assert.equal(response.data.cart.totalQuantity, 1);
  assert.equal(response.data.error, 'Kontroller handlekurven.');
  assert.equal(response.cookieWrites[0][1], fullId);
  assert.equal(JSON.stringify(response.data).includes('fixture-secret'), false);
});

test('order routes distinguish rejected preflight from unknown payment status', async () => {
  const bridge = server();
  const input = await validInput(bridge);
  for (const paymentStatus of ['not_submitted', 'unknown']) {
    const api = routes({ '@/lib/klarna/server': { ...bridge, forwardOrder: async () => { throw new bridge.KlarnaBridgeError('Fixture error', 502, paymentStatus); } } });
    const response = await api.orders(request(input));
    assert.equal(response.status, 502);
    assert.equal(response.data.paymentStatus, paymentStatus);
    assert.equal(response.cookieWrites.length, 0);
  }
  const forbidden = await routes().orders(request(input, { origin: 'https://evil.example' }));
  assert.equal(forbidden.data.paymentStatus, 'not_submitted');
  const complete = await routes().orders(request(input));
  assert.equal(complete.status, 200);
  assert.equal(complete.cookieWrites[0][0], 'delete');
  assert.equal(complete.cookieWrites[0][1], 'utekos_cart');
});

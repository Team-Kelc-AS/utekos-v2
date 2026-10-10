/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const money = amount => ({ amount, currencyCode: 'NOK' });
const product = { id: 'gid://shopify/Product/1', handle: 'test-product', title: 'Test product', vendor: 'Utekos', productType: 'Outerwear', collections: { nodes: [{ id: 'gid://shopify/Collection/1', title: 'Camping' }] } };
const variant = { id: 'gid://shopify/ProductVariant/1', title: 'Middels', price: money('1000'), compareAtPrice: money('1200'), taxable: true, availableForSale: true, currentlyNotInStock: false, quantityAvailable: 17, sku: 'fixture-sku', barcode: '7090000000001', image: null, selectedOptions: [{ name: 'Størrelse', value: 'Middels' }] };
const commerce = loadTypeScript('lib/cart/commerce.ts');
const publicId = 'gid://shopify/Cart/fixture';
const fullId = `${publicId}?key=secret-fixture`;
const makeLine = (quantity, total) => ({ id: 'line-1', variantId: variant.id, quantity, title: product.title, handle: product.handle, variantTitle: variant.title, available: true, image: null, total: money(total), commerce: commerce.cartLineCommerce(product, variant, quantity, money(total)) });
const makeCart = lines => ({ id: publicId, checkout: { checkout_id: 'fixture-checkout', creation_revision: 'checkout_rev_fixture' }, lines, totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0), subtotal: money('0'), total: money('0'), commerce: commerce.combineCommerce(lines.map(line => line.commerce)) });

test('accepted line discounts, real tax and metadata survive the canonical mapper', () => {
  const line = commerce.cartLineCommerce(product, variant, 2, money('1600'));
  assert.equal(line.gross_value, 1600);
  assert.equal(line.value, 1280);
  assert.equal(line.tax_value, 320);
  assert.equal(line.items[0].gross_unit_price, 800);
  assert.equal(line.items[0].gross_discount, 400);
  assert.equal(line.items[0].sku, 'fixture-sku');
  assert.equal(line.items[0].gtin, '7090000000001');
  assert.equal(line.items[0].item_category, 'Outerwear');
  assert.equal(line.items[0].collection_ids[0], 'gid://shopify/Collection/1');
  assert.equal(line.items[0].quantity_available, 17);
  const taxFree = commerce.cartLineCommerce(product, { ...variant, taxable: false }, 1, money('123.45'));
  assert.equal(taxFree.value, 123.45);
  assert.equal(taxFree.tax_value, 0);
  const rounding = commerce.cartLineCommerce(product, variant, 3, money('0.80'));
  assert.equal(rounding.gross_value, 0.8);
  assert.equal(rounding.value, 0.64);
  assert.equal(rounding.tax_value, 0.16);
});

test('confirmed deltas report only accepted quantities and keep mutation correlation', () => {
  const before = makeCart([makeLine(1, '800')]);
  const after = makeCart([makeLine(3, '2400')]);
  const event = commerce.confirmedCartMutation(before, after, 'mutation-fixture', '2026-10-07T12:00:00.000Z');
  assert.equal(event.changes.length, 1);
  assert.equal(event.changes[0].event_name, 'add_to_cart');
  assert.equal(event.changes[0].commerce.items[0].quantity, 2);
  assert.equal(event.changes[0].commerce.gross_value, 1600);
  assert.equal(event.id, 'mutation-fixture');
  assert.equal(event.cart_id, publicId);
  assert.equal(event.event_time, '2026-10-07T12:00:00.000Z');
  const removed = commerce.confirmedCartMutation(after, makeCart([]), 'remove-fixture', event.event_time);
  assert.equal(removed.changes[0].event_name, 'remove_from_cart');
  assert.equal(removed.changes[0].commerce.items[0].quantity, 3);
  assert.equal(commerce.confirmedCartMutation(before, before, 'noop', event.event_time).changes.length, 0);
});

test('cart-wide discounts and shipping retain authoritative Shopify cart totals', () => {
  const line = commerce.cartLineCommerce(product, { ...variant, compareAtPrice: null }, 1, money('800'));
  const discounted = commerce.authoritativeCartCommerce([line], money('720'));
  assert.equal(discounted.gross_value, 720);
  assert.equal(discounted.value, 576);
  assert.equal(discounted.tax_value, 144);
  assert.equal(discounted.items[0].gross_unit_price, 720);
  assert.equal(discounted.items[0].gross_discount, 280);
  const shipping = commerce.authoritativeCartCommerce([line], money('849'));
  assert.equal(shipping.gross_value, 849);
  assert.equal(shipping.items[0].gross_unit_price, 800);
});

test('checkout identity ignores rotating Shopify analytics but preserves checkout and private-key changes', () => {
  const { createHash } = require('node:crypto');
  const { cartCheckoutIdentity } = loadTypeScript('lib/cart/checkout-identity.ts');
  const url = 'https://checkout.example.test/checkouts/cn/checkout-token?key=secret-fixture';
  const result = cartCheckoutIdentity(publicId, url);
  assert.equal(result.checkout_id, 'checkout-token');
  assert.equal(result.creation_revision, `checkout_rev_${createHash('sha256').update(`checkout-token|${url}`).digest('hex').slice(0, 32)}`);
  assert.deepEqual(cartCheckoutIdentity(publicId, `${url}&_s=first&_y=first`), result);
  assert.deepEqual(cartCheckoutIdentity(publicId, `${url}&_y=second&_s=second`), result);
  for (const changed of [
    url.replace('checkout-token', 'another-checkout'),
    url.replace('secret-fixture', 'another-private-key'),
    url.replace('checkout.example.test', 'another.example.test'),
    `${url}&discount=changed`,
  ]) assert.notEqual(cartCheckoutIdentity(publicId, changed).creation_revision, result.creation_revision);
  assert.equal(JSON.stringify(result).includes('secret-fixture'), false);
  assert.throws(() => cartCheckoutIdentity(publicId, 'http://untrusted.example.test'));
});

test('checkout variability diagnostics identify changed fields without exposing private URLs or values', () => {
  const { compareCheckoutUrls } = loadTypeScript('lib/cart/checkout-identity.ts');
  const before = 'https://checkout.example.test/cart/token?key=private-first&_s=analytics-first';
  const analytics = compareCheckoutUrls(publicId, before, before.replace('analytics-first', 'analytics-second'));
  assert.deepEqual([...analytics.changed_query_keys], ['_s']);
  assert.equal(analytics.identity_unchanged, true);
  const changed = compareCheckoutUrls(publicId, before, before.replace('private-first', 'private-second'));
  assert.deepEqual([...changed.changed_query_keys], ['key']);
  assert.equal(changed.identity_unchanged, false);
  for (const secret of ['private-first', 'private-second', 'analytics-first', 'checkout.example.test', '/cart/token']) {
    assert.equal(JSON.stringify(changed).includes(secret), false);
  }
});

const connection = nodes => ({ nodes, pageInfo: { hasNextPage: false, endCursor: null } });
const rawCart = quantity => ({ id: fullId, checkoutUrl: 'https://checkout.example.test', totalQuantity: quantity, cost: { subtotalAmount: money(String(quantity * 800)), totalAmount: money(String(quantity * 800)) }, lines: connection(quantity ? [{ id: 'line-1', quantity, cost: { totalAmount: money(String(quantity * 800)) }, merchandise: { ...variant, __typename: 'ProductVariant', product: { ...product, collections: connection(product.collections.nodes) } } }] : []) });

test('cart reads preserve paginated lines, collections, buyer IP and private identity boundaries', async () => {
  const first = rawCart(1);
  first.totalQuantity = 2;
  first.cost = { subtotalAmount: money('1600'), totalAmount: money('1500') };
  first.lines.pageInfo = { hasNextPage: true, endCursor: 'line-cursor' };
  first.lines.nodes[0].merchandise.product.collections.pageInfo = { hasNextPage: true, endCursor: 'collection-cursor' };
  const second = { ...rawCart(1).lines.nodes[0], id: 'line-2' };
  const requests = [];
  const api = loadTypeScript('lib/cart/server.ts', { mocks: {
    '@/lib/shopify/client': { shopifyFetch: async request => {
      requests.push(request);
      assert.equal(request.cache, 'no-store');
      assert.equal(request.buyerIp, '192.0.2.1');
      assert.match(request.query, /\bquery (?:Cart|CartLines|ProductCollections)\(/);
      if (request.query.includes('query Cart(')) {
        assert.equal(request.variables.id, fullId);
        return { cart: first };
      }
      if (request.query.includes('query CartLines(')) {
        assert.equal(request.variables.after, 'line-cursor');
        assert.equal(request.variables.id, fullId);
        return { cart: { lines: connection([second]) } };
      }
      assert.match(request.query, /query ProductCollections/);
      assert.equal(request.variables.after, 'collection-cursor');
      return { product: { collections: connection([{ id: 'gid://shopify/Collection/2', title: 'Hytte' }]) } };
    } },
  } });
  const result = await api.cartView(await api.readCart(fullId, '192.0.2.1'), '192.0.2.1');
  assert.equal(requests.length, 3);
  assert.equal(api.CART_COOKIE, 'utekos_cart');
  assert.equal(result.id, publicId);
  assert.equal(result.lines.length, 2);
  assert.equal(result.lines[1].id, 'line-2');
  assert.equal(result.lines[0].commerce.items[0].collection_ids.length, 2);
  assert.equal(result.commerce.gross_value, 1500);
  assert.equal(result.commerce.value, 1200);
  assert.equal(JSON.stringify(result).includes('secret-fixture'), false);
});

test('cart reads fail on expiry or a repeated cursor instead of returning a partial cart', async () => {
  for (const expired of [true, false]) {
    const first = rawCart(1);
    first.lines.pageInfo = { hasNextPage: true, endCursor: 'stuck' };
    let requests = 0;
    const api = loadTypeScript('lib/cart/server.ts', { mocks: {
      '@/lib/shopify/client': { shopifyFetch: async () => {
        requests++;
        return { cart: expired ? null : { lines: first.lines } };
      } },
    } });
    await assert.rejects(api.cartView(first), expired ? api.CartError : /pagination did not advance/);
    assert.equal(requests, 1);
  }
});

function mutationHarness(replies) {
  const requests = [];
  const api = loadTypeScript('lib/cart/mutations.ts', { mocks: {
    '@/lib/shopify/getProduct': { getProduct: async () => ({ ...product, variants: { nodes: [variant] } }) },
    '@/lib/shopify/client': { shopifyFetch: async request => {
      requests.push(request);
      const result = replies.shift();
      if (result instanceof Error) throw result;
      if (!result) throw new Error('Unexpected extra request');
      return result;
    } },
  } });
  return { ...api, requests };
}

test('cart API mutation result is derived from Shopify acknowledgement, including quantity adjustment', async () => {
  const api = mutationHarness([{ cart: rawCart(1) }, { cartLinesAdd: { cart: rawCart(2), userErrors: [], warnings: [{ message: 'Only one item remained' }] } }]);
  const result = await api.mutateCart({ action: 'add', handle: product.handle, variantId: variant.id, quantity: 5 }, fullId);
  assert.equal(api.requests.length, 2);
  assert.equal(result.cart.totalQuantity, 2);
  assert.equal(result.mutation.changes[0].commerce.items[0].quantity, 1);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.cart.id, publicId);
  assert.equal(JSON.stringify({ cart: result.cart, mutation: result.mutation }).includes('secret-fixture'), false);
});

test('failed or lost mutation responses never fabricate accepted deltas and are never transport-retried', async () => {
  for (const reply of [new Error('Lost response'), { cartLinesAdd: { cart: rawCart(1), userErrors: [{ message: 'Rejected' }], warnings: [] } }]) {
    const api = mutationHarness([{ cart: rawCart(1) }, reply]);
    await assert.rejects(api.mutateCart({ action: 'add', handle: product.handle, variantId: variant.id, quantity: 5 }, fullId));
    assert.equal(api.requests.length, 2);
  }
});

class CartError extends Error { constructor(message, status = 422) { super(message); this.status = status; } }
function checkoutHarness(handler = async () => { throw new Error('Unexpected Shopify request'); }) {
  return loadTypeScript('lib/cart/checkout.ts', { env: { VERCEL_ENV: 'production' }, mocks: {
    '@/lib/validation/zodMini': require('zod/mini'),
    './error': { CartError },
    '@/lib/shopify/client': { shopifyFetch: handler },
  } });
}
function beginEvent(cart = makeCart([makeLine(1, '800')])) {
  return { schema_version: 1, event_name: 'begin_checkout', event_id: 'f16a04b1-d0be-4d2c-9b73-cf69c67f2251', event_time: '2026-10-07T12:00:00.000Z', source: 'web', environment: 'production', page_url: 'https://utekos.no/produkter/test-product?fbclid=redact', page_title: 'Test product', checkout_method: 'shopify_checkout', consent: { analytics: 'granted', marketing: 'granted', preferences: 'granted', source: 'operator_policy', version: '1' }, browser_id: { fbp: 'fb.1.1.fixture', ga_client_id: '123.456' }, custom_data: { ...cart.commerce, cart_id: cart.id, ...cart.checkout } };
}

test('checkout validates owned cart, origin, environment, method and accepted value', () => {
  const api = checkoutHarness();
  const cart = makeCart([makeLine(1, '800')]);
  const event = beginEvent(cart);
  assert.equal(api.parseCheckoutEvent(event, cart, 'https://utekos.no', 'shopify').event_id, event.event_id);
  assert.equal(api.parseCheckoutEvent(null, cart, 'https://utekos.no', 'shopify'), null);
  for (const changed of [
    { ...event, environment: 'preview' }, { ...event, page_url: 'https://evil.example.test/' },
    { ...event, checkout_method: 'klarna_express' },
    { ...event, custom_data: { ...event.custom_data, cart_id: 'other' } },
    { ...event, custom_data: { ...event.custom_data, checkout_id: 'other' } },
    { ...event, custom_data: { ...event.custom_data, creation_revision: 'stale' } },
    { ...event, custom_data: { ...event.custom_data, gross_value: 100 } },
  ]) assert.throws(() => api.parseCheckoutEvent(changed, cart, 'https://utekos.no', 'shopify'), CartError);
});

test('Shopify snapshot uses exact ID, operator policy and only verified Facebook session identity', () => {
  const api = checkoutHarness();
  const cart = makeCart([makeLine(1, '800')]);
  const event = { ...beginEvent(cart), user_data: { facebook_login_id: '123', email_sha256: ['a'.repeat(64)] } };
  const attrs = new Map(api.checkoutAttributes(cart, event, '456', { campaign_id: 'fixture-campaign', ad_id: 'fixture-ad', source: 'meta' }).map(attribute => [attribute.key, attribute.value]));
  assert.equal(attrs.get('utekos_begin_checkout_event_id'), event.event_id);
  assert.equal(attrs.get('utekos_attribution_captured_at'), event.event_time);
  assert.equal(attrs.get('utekos_facebook_login_id'), '456');
  assert.equal(attrs.get('utekos_campaign_id'), 'fixture-campaign');
  assert.equal(attrs.get('utekos_ad_id'), 'fixture-ad');
  assert.equal(attrs.get('utekos_campaign_source'), 'meta');
  assert.equal(attrs.get('utekos_page_url'), 'https://utekos.no/produkter/test-product');
  assert.equal(JSON.parse(attrs.get('utekos_consent')).source, 'operator_policy');
  assert.equal(JSON.parse(attrs.get('utekos_product_context_v1'))[0].item_id, '1');
  assert.equal(new Map(api.checkoutAttributes(cart, event).map(attribute => [attribute.key, attribute.value])).get('utekos_facebook_login_id'), '');
  assert.equal(new Map(api.checkoutAttributes(cart, null).map(attribute => [attribute.key, attribute.value])).get('utekos_begin_checkout_event_id'), '');
});

test('checkout requires successful mutation and returned attribute equality', async () => {
  const cart = makeCart([makeLine(1, '800')]);
  const event = beginEvent(cart);
  let requests = 0;
  const api = checkoutHarness(async request => {
    requests++;
    assert.equal(request.variables.cartId, fullId);
    assert.equal(request.cache, 'no-store');
    return { cartAttributesUpdate: { cart: { id: fullId, attributes: request.variables.attributes }, userErrors: [], warnings: [] } };
  });
  await api.persistCheckoutAttributes(fullId, cart, event);
  assert.equal(requests, 1);
  for (const payload of [
    { cart: null, userErrors: [{ message: 'rejected' }], warnings: [] },
    { cart: { id: fullId, attributes: [] }, userErrors: [], warnings: [] },
  ]) await assert.rejects(checkoutHarness(async () => ({ cartAttributesUpdate: payload })).persistCheckoutAttributes(fullId, cart, event), CartError);
});

test('checkout accepts cleared attributes omitted by Shopify but rejects retained stale identity', async () => {
  const cart = makeCart([makeLine(1, '800')]);
  const event = beginEvent(cart);
  for (const stale of [false, true]) {
    const api = checkoutHarness(async request => ({ cartAttributesUpdate: {
      cart: { id: fullId, attributes: [
        ...request.variables.attributes.filter(attribute => attribute.value !== ''),
        ...(stale ? [{ key: 'utekos_facebook_login_id', value: 'stale-identity' }] : []),
      ] }, userErrors: [], warnings: [],
    } }));
    if (stale) await assert.rejects(api.persistCheckoutAttributes(fullId, cart, event), CartError);
    else await api.persistCheckoutAttributes(fullId, cart, event);
  }
});

test('Klarna reads attribution and correlation from the owned server-side cart', async () => {
  const api = checkoutHarness();
  const cart = makeCart([makeLine(1, '800')]);
  const event = beginEvent(cart);
  const attributes = api.checkoutAttributes(cart, event, '456');
  const klarna = loadTypeScript('lib/klarna/attribution.ts', { mocks: {
    '@/lib/validation/zodMini': require('zod/mini'),
    './server': { KlarnaBridgeError: CartError },
    '@/lib/shopify/client': { shopifyFetch: async () => ({ cart: { id: fullId, attributes } }) },
  } });
  const result = await klarna.readKlarnaOrderAttribution(fullId);
  assert.equal(result.beginCheckoutEventId, event.event_id);
  assert.equal(result.attribution.user_data.facebook_login_id, '456');
  assert.equal(JSON.stringify(result).includes('secret-fixture'), false);
});


test('a targeted mutation never reports another tab line or excess same-variant quantity', () => {
  const before = makeCart([makeLine(1, '800')]);
  const unrelated = { ...makeLine(1, '800'), id: 'other-line', variantId: 'gid://shopify/ProductVariant/2' };
  const after = makeCart([makeLine(4, '3200'), unrelated]);
  const result = commerce.confirmedCartMutation(before, after, 'targeted', '2026-10-07T12:00:00.000Z', { action: 'add', variantId: variant.id, handle: product.handle, quantity: 1 });
  assert.equal(result.changes.length, 1);
  assert.equal(result.changes[0].commerce.items[0].quantity, 1);
  assert.equal(result.changes[0].commerce.gross_value, 800);
});

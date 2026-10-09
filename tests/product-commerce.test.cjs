/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

// These are deliberately fictional fixtures. Every external operation is mocked.
const money = { amount: '1999.00', currencyCode: 'NOK' };
function variant(id, size, color = 'Fjellblå', availableForSale = true) {
  return {
    id: `gid://shopify/ProductVariant/${id}`, title: `${size} / ${color}`,
    availableForSale, price: money, compareAtPrice: null, image: null,
    selectedOptions: [{ name: 'Størrelse', value: size }, { name: 'Farge', value: color }],
  };
}
function product(variants, handle = 'utekos-techdown') {
  return {
    id: 'gid://shopify/Product/1', handle, title: 'Test product', description: '', vendor: 'Utekos', productType: 'Outerwear', collections: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } },
    descriptionHtml: '', seo: { title: null, description: null }, images: { nodes: [] },
    options: [{ name: 'Farge', values: ['Fjellblå', 'Vargnatt'] }, { name: 'Størrelse', values: ['Liten', 'Middels', 'Stor', 'Større'] }],
    variants: { nodes: variants },
  };
}
const variants = loadTypeScript('lib/products/variants.ts');
const techdown = product([
  variant(1, 'Liten', 'Fjellblå', false), variant(2, 'Middels'), variant(3, 'Stor'),
  variant(4, 'Større', 'Fjellblå', false), variant(5, 'Stor', 'Vargnatt'),
]);

test('default selection prefers an available Stor; falls back to available then first', () => {
  assert.equal(variants.resolveVariant(techdown).id, 'gid://shopify/ProductVariant/3');
  const fallback = product([variant(2, 'Middels'), variant(3, 'Stor', 'Fjellblå', false)]);
  assert.equal(variants.resolveVariant(fallback).id, 'gid://shopify/ProductVariant/2');
  fallback.variants.nodes[0].availableForSale = false;
  assert.equal(variants.resolveVariant(fallback).id, 'gid://shopify/ProductVariant/2');
});

test('numeric and GID direct links select exactly the requested variant, including sold out', () => {
  for (const id of ['4', 'gid://shopify/ProductVariant/4']) {
    const selected = variants.resolveVariant(techdown, { variant: id });
    assert.equal(selected.id, 'gid://shopify/ProductVariant/4');
    assert.equal(selected.availableForSale, false);
  }
});

test('malformed, empty, repeated and contradictory variant parameters are rejected', () => {
  const invalid = [
    { variant: '' }, { variant: ' ' }, { variant: ['3', '3'] }, { variant: 'gid://shopify/Product/3' },
    { variant: '3.5' }, { variant: '-3' }, { variant: 'abc' }, { variant: '999' },
    { variant: '3', storrelse: 'middels' }, { farge: ['fjellbla', 'vargnatt'] },
    { storrelse: '' }, { storrelse: 'x'.repeat(257) }, { farge: 'unknown' },
  ];
  for (const params of invalid) assert.equal(variants.resolveVariant(techdown, params), undefined, JSON.stringify(params));
});

test('TechDown size aliases resolve to public canonical sizes', () => {
  for (const [query, id] of [['liten', 1], ['small', 1], ['s', 1], ['middels', 2], ['medium', 2], ['m', 2], ['stor', 3], ['large', 3], ['l', 3], ['storre', 4], ['xl', 4], ['extra-large', 4], ['ekstra-stor', 4]]) {
    assert.equal(variants.resolveVariant(techdown, { storrelse: query }).id, `gid://shopify/ProductVariant/${id}`, query);
  }
});

test('sold-out TechDown Liten stays visible and selectable without claiming availability', () => {
  assert.deepEqual(Array.from(variants.publicVariants(techdown), v => v.id), [1, 2, 3, 4, 5].map(id => `gid://shopify/ProductVariant/${id}`));
  for (const params of [{ variant: '1' }, { variant: 'gid://shopify/ProductVariant/1' }, { storrelse: 'liten' }, { storrelse: 'small' }, { storrelse: 's' }]) {
    const selected = variants.resolveVariant(techdown, params);
    assert.equal(selected.id, 'gid://shopify/ProductVariant/1');
    assert.equal(selected.availableForSale, false);
  }
  const option = variants.variantOptions(techdown, techdown.variants.nodes[2])[0];
  assert.equal(option.name, 'Størrelse');
  const small = option.values.find(v => v.value === 'Liten');
  assert.equal(small.available, false);
  assert.match(small.href, /storrelse=liten/);
  const selectedOption = variants.variantOptions(techdown, techdown.variants.nodes[0])[0];
  assert.equal(selectedOption.values.find(v => v.value === 'Liten').selected, true);
});

test('size names stay available on other products and Size maps to the public parameter', () => {
  const other = product([variant(1, 'Liten')], 'comfyrobe');
  other.variants.nodes[0].selectedOptions[0].name = 'Size';
  other.options[1].name = 'Size';
  assert.equal(variants.resolveVariant(other, { storrelse: 'liten' }).id, 'gid://shopify/ProductVariant/1');
  assert.match(variants.variantHref(other.handle, other.variants.nodes[0]), /storrelse=liten/);
  assert.equal(variants.variantOptions(other, other.variants.nodes[0])[0].name, 'Størrelse');
});

test('variant links round trip without losing color or sold-out selection', () => {
  for (const selected of variants.publicVariants(techdown)) {
    const href = variants.variantHref(techdown.handle, selected);
    const url = new URL(href, 'https://example.test');
    assert.equal(url.pathname, '/produkter/utekos-techdown');
    assert.equal(variants.resolveVariant(techdown, Object.fromEntries(url.searchParams)).id, selected.id);
  }
});

test('public URLs use stable readable options and omit a proven constant Unisex option', () => {
  const siblings = [variant(1, 'Stor', 'Havdyp'), variant(2, 'Større', 'Havdyp', false)];
  for (const item of siblings) item.selectedOptions.push({ name: 'Kjønn', value: 'Unisex' });
  assert.equal(variants.variantHref('utekos-techdown', siblings[0], siblings), '/produkter/utekos-techdown?farge=havdyp&storrelse=stor');
  assert.equal(variants.variantHref('utekos-techdown', siblings[1], siblings), '/produkter/utekos-techdown?farge=havdyp&storrelse=storre');
  const svale = { ...variant(3, 'Stor'), selectedOptions: [{ name: 'Size', value: 'Stor' }] };
  assert.equal(variants.variantHref('utekos-svale', svale, [svale]), '/produkter/utekos-svale?storrelse=stor');
});

test('gender remains in URLs when it distinguishes otherwise identical variants', () => {
  const siblings = ['Unisex', 'Dame'].map((gender, index) => ({
    ...variant(index + 1, 'Stor'),
    selectedOptions: [...variant(1, 'Stor').selectedOptions, { name: 'Kjønn', value: gender }],
  }));
  for (const selected of siblings) {
    const url = new URL(variants.variantHref('test', selected, siblings), 'https://example.test');
    assert.ok(url.searchParams.has('kjonn'));
    assert.equal(variants.resolveVariant(product(siblings), Object.fromEntries(url.searchParams)).id, selected.id);
  }
});

test('unknown options and colliding option slugs retain exact variant identity', () => {
  const fixtures = [
    ['Ull', 'Bomull'].map((material, index) => ({ ...variant(index + 1, 'Stor'), selectedOptions: [...variant(1, 'Stor').selectedOptions, { name: 'Materiale', value: material }] })),
    [variant(1, 'Stor', 'Blå'), variant(2, 'Stor', 'Bla')],
  ];
  for (const siblings of fixtures) for (const selected of siblings) {
    const url = new URL(variants.variantHref('test', selected, siblings), 'https://example.test');
    assert.ok(url.searchParams.has('variant'));
    assert.equal(variants.resolveVariant(product(siblings), Object.fromEntries(url.searchParams)).id, selected.id);
  }
});

test('option links retain compatible choices and expose unavailable combinations accurately', () => {
  const fixture = product([variant(1, 'Medium'), variant(2, 'Large', 'Fjellblå', false), variant(3, 'Large', 'Vargnatt')], 'utekos-mikrofiber');
  const options = variants.variantOptions(fixture, fixture.variants.nodes[0]);
  const large = options[0].values.find(v => v.value === 'Large');
  assert.equal(large.available, false);
  assert.match(large.href, /farge=fjellbla/);
  const black = options[1].values.find(v => v.value === 'Vargnatt');
  assert.equal(black.available, true);
  assert.match(black.href, /storrelse=large/);
});

function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name: 'Test Person', email: 'test@example.test', phone: '+4700000000', privacy: 'on', website: '', ...overrides })) {
    if (value !== undefined) data.set(key, value);
  }
  return data;
}
const initial = { status: 'idle', message: '' };
const mailConfig = { apiKey: 'fake-test-key', from: 'sender@example.test', to: 'recipient@example.test' };
function waitlistHarness({ config = mailConfig, env = {}, responses = [] } = {}) {
  const calls = [];
  const accepted = [];
  let configReads = 0;
  const api = loadTypeScript('lib/waitlist/submit.ts', {
    env,
    mocks: {
      '@/lib/contact': { getContactEmailConfig: () => { configReads++; return config; } },
      '@/lib/tracking/server-forms': { recordAcceptedWaitlist: async (_form, input) => { accepted.push(input); } },
    },
    fetch: async (url, init) => {
      calls.push({ url, ...init, body: JSON.parse(init.body) });
      const response = responses.shift();
      if (!response) throw new Error(`Unexpected mocked request: ${url}`);
      if (response instanceof Error) throw response;
      return { ok: response.ok ?? true, json: async () => response.body };
    },
  });
  return { ...api, calls, accepted, configReads: () => configReads };
}

test('waitlist requires valid identity fields and privacy consent before any provider access', async () => {
  const h = waitlistHarness();
  for (const overrides of [{ email: 'invalid' }, { privacy: undefined }, { name: 'A' }, { phone: '' }, { name: 'Test\r\nSubject: injected' }]) {
    const result = await h.submitWaitlist(initial, form(overrides));
    assert.equal(result.status, 'error');
    assert.ok(result.errors);
  }
  assert.equal(h.configReads(), 0);
  assert.equal(h.calls.length, 0);
});

test('honeypot returns a neutral acknowledgement without contacting providers', async () => {
  const h = waitlistHarness();
  const result = await h.submitWaitlist(initial, form({ website: 'bot.example.test', marketing: 'on' }));
  assert.equal(result.status, 'success');
  assert.equal(h.configReads(), 0);
  assert.equal(h.calls.length, 0);
  assert.equal(h.accepted.length, 0);
});

test('missing email configuration is local to waitlist and never attempts a send', async () => {
  const h = waitlistHarness({ config: null });
  assert.equal((await h.submitWaitlist(initial, form())).status, 'error');
  assert.equal(h.calls.length, 0);
});

test('waitlist without marketing consent sends only the operational email, even with Admin credentials', async () => {
  const h = waitlistHarness({ env: { SHOPIFY_ADMIN_API_TOKEN: 'fake-token', SHOPIFY_STORE_DOMAIN: 'shop.example.test' }, responses: [{ body: { id: 'test-email' } }] });
  assert.equal((await h.submitWaitlist(initial, form())).status, 'success');
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].url, 'https://api.resend.com/emails');
  assert.match(h.calls[0].body.text, /Markedsføringssamtykke: Nei/);
  assert.equal(h.calls[0].cache, 'no-store');
  assert.equal(h.accepted.length, 1);
  assert.equal(h.accepted[0].receiptId, 'test-email');
});

test('explicit marketing opt-in is a separate minimal customer upsert and consent mutation', async () => {
  const h = waitlistHarness({
    env: { SHOPIFY_ADMIN_API_TOKEN: 'fake-token', SHOPIFY_STORE_DOMAIN: 'https://shop.example.test/' },
    responses: [{ body: { id: 'test-email' } }, { body: { data: { customerSet: { customer: { id: 'gid://shopify/Customer/123' }, userErrors: [] } } } }, { body: { data: { customerEmailMarketingConsentUpdate: { userErrors: [] } } } }],
  });
  const result = await h.submitWaitlist(initial, form({ marketing: 'on' }));
  assert.equal(result.status, 'success');
  assert.equal(h.calls.length, 3);
  assert.equal(h.calls[1].url, 'https://shop.example.test/admin/api/2026-10/graphql.json');
  assert.deepEqual(h.calls[1].body.variables, { input: { email: 'test@example.test' }, identifier: { email: 'test@example.test' } });
  const consent = h.calls[2].body.variables.input;
  assert.equal(consent.customerId, 'gid://shopify/Customer/123');
  assert.equal(consent.emailMarketingConsent.marketingState, 'SUBSCRIBED');
  assert.equal(consent.emailMarketingConsent.marketingOptInLevel, 'SINGLE_OPT_IN');
  assert.ok(Number.isFinite(Date.parse(consent.emailMarketingConsent.consentUpdatedAt)));
  assert.equal(result.message.includes('kundeservice'), false);
});

test('mail provider failure never triggers marketing subscription or reports waitlist success', async () => {
  for (const response of [{ ok: false, body: {} }, { body: {} }, new Error('timeout')]) {
    const h = waitlistHarness({ env: { SHOPIFY_ADMIN_API_TOKEN: 'fake-token', SHOPIFY_STORE_DOMAIN: 'shop.example.test' }, responses: [response] });
    assert.equal((await h.submitWaitlist(initial, form({ marketing: 'on' }))).status, 'error');
    assert.equal(h.calls.length, 1);
    assert.equal(h.accepted.length, 0);
  }
});

test('missing or rejected marketing configuration preserves successful waitlist registration with an honest fallback', async () => {
  for (const configuration of [
    { responses: [{ body: { id: 'test-email' } }] },
    { env: { SHOPIFY_ADMIN_API_TOKEN: 'fake-token', SHOPIFY_STORE_DOMAIN: 'shop.example.test' }, responses: [{ body: { id: 'test-email' } }, { body: { data: { customerSet: { customer: null, userErrors: [{ message: 'Rejected' }] } } } }] },
  ]) {
    const h = waitlistHarness(configuration);
    const result = await h.submitWaitlist(initial, form({ marketing: 'on' }));
    assert.equal(result.status, 'success');
    assert.match(result.message, /kundeservice for oppfølging/);
    assert.match(h.calls[0].body.text, /Markedsføringssamtykke: Ja/);
  }
});

test('identical waitlist retries use the same provider idempotency key', async () => {
  const h = waitlistHarness({ responses: [{ body: { id: 'test-email' } }, { body: { id: 'test-email' } }] });
  await h.submitWaitlist(initial, form());
  await h.submitWaitlist(initial, form());
  assert.match(h.calls[0].headers['Idempotency-Key'], /^waitlist\/[a-f0-9]{64}$/);
  assert.equal(h.calls[0].headers['Idempotency-Key'], h.calls[1].headers['Idempotency-Key']);
});

function connection(nodes, endCursor = null, hasNextPage = false) {
  return { nodes, pageInfo: { endCursor, hasNextPage } };
}
function productHarness(handler) {
  const calls = [], lifetimes = [], tags = [];
  const api = loadTypeScript('lib/shopify/getProduct.ts', {
    mocks: {
      'next/cache': { cacheLife: life => lifetimes.push(life), cacheTag: (...values) => tags.push(...values) },
      './client': { shopifyFetch: async request => { calls.push(request); return handler(request); } },
    },
  });
  return { ...api, calls, lifetimes, tags };
}

test('getProduct returns all image and variant pages while preserving source order and cache tags', async () => {
  const h = productHarness(({ query, variables }) => {
    if (query.includes('query Product(')) return { product: { ...product([]), options: [{ name: 'Farge', optionValues: [{ name: 'Fjellblå' }, { name: 'Vargnatt' }] }], images: connection([{ id: 'image-1' }], 'image-cursor', true), variants: connection([variant(1, 'Medium')], 'variant-cursor', true) } };
    if (query.includes('query ProductImages')) {
      if (variables.after === 'image-cursor') return { product: { images: connection([{ id: 'image-2' }], 'last-image-cursor', true) } };
      assert.equal(variables.after, 'last-image-cursor');
      return { product: { images: connection([{ id: 'image-3' }]) } };
    }
    assert.equal(variables.after, 'variant-cursor');
    return { product: { variants: connection([variant(2, 'Large')]) } };
  });
  const result = await h.getProduct('utekos-techdown');
  assert.deepEqual(Array.from(result.images.nodes, image => image.id), ['image-1', 'image-2', 'image-3']);
  assert.deepEqual(Array.from(result.variants.nodes, item => item.id), ['gid://shopify/ProductVariant/1', 'gid://shopify/ProductVariant/2']);
  assert.deepEqual(JSON.parse(JSON.stringify(result.options)), [{ name: 'Farge', values: ['Fjellblå', 'Vargnatt'] }]);
  assert.equal(h.calls.length, 4);
  assert.deepEqual(h.tags, ['shopify:products', 'shopify:product:utekos-techdown']);
  assert.deepEqual(h.lifetimes, ['minutes']);
});

test('missing product retains the short negative-cache policy and makes no pagination requests', async () => {
  const h = productHarness(() => ({ product: null }));
  assert.equal(await h.getProduct('missing'), null);
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.lifetimes, ['seconds']);
});

test('a missing or repeated cursor fails instead of silently truncating or looping', async () => {
  for (const cursor of [null, 'stuck']) {
    const h = productHarness(({ query }) => ({ product: query.includes('query Product(')
      ? { ...product([]), images: connection([], cursor, true), variants: connection([]) }
      : { images: connection([], cursor, true) } }));
    await assert.rejects(h.getProduct('utekos-techdown'), /pagination did not advance/);
    assert.ok(h.calls.length <= 2);
    assert.deepEqual(h.lifetimes, []);
  }
});

test('a product disappearing or a transport error during pagination fails instead of returning partial data', async () => {
  for (const failure of ['missing', 'network']) {
    const h = productHarness(({ query }) => {
      if (query.includes('query Product(')) return { product: { ...product([]), images: connection([{ id: 'image-1' }], 'cursor', true), variants: connection([]) } };
      if (failure === 'network') throw new Error('Network failure');
      return { product: null };
    });
    await assert.rejects(h.getProduct('utekos-techdown'), failure === 'network' ? /Network failure/ : /disappeared during image pagination/);
    assert.deepEqual(h.lifetimes, []);
  }
});

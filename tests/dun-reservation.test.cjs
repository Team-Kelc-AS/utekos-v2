/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const variants = ['Vargnatt', 'Fjellblå'].flatMap((color, index) => ['Medium', 'Large'].map((size, sizeIndex) => ({
  id: `gid://shopify/ProductVariant/${index * 2 + sizeIndex + 1}`,
  selectedOptions: [{ name: 'Farge', value: color }, { name: 'Størrelse', value: size }],
})));
variants.push(...['Vargnatt', 'Fjellblå'].map((color, index) => ({
  id: `gid://shopify/ProductVariant/${['67610887160056', '67610887192824'][index]}`,
  selectedOptions: [{ name: 'Farge', value: color }, { name: 'Størrelse', value: 'Small' }],
})));
function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ color: 'Fjellblå', size: 'Large', firstName: 'Test', lastName: 'Person', email: 'fixture@example.com', phone: '+47 12345678', consent: 'yes', website: '', ...overrides })) data.set(key, value);
  return data;
}
function harness({ product = { id: 'gid://shopify/Product/1', variants: { nodes: variants } }, env = {}, response = { ok: true, json: async () => ({ id: 'receipt-fixture' }) }, trackingEvent } = {}) {
  const sends = [], tracking = [], leads = [];
  let reads = 0;
  const api = loadTypeScript('lib/reservations/submitDunReservation.ts', {
    env: { RESEND_API_KEY: 'fixture', CONTACT_FORM_SEND_TO_EMAIL: 'service@example.com', ...env },
    mocks: {
      '@/lib/shopify/getProduct': { getProduct: async handle => { assert.equal(handle, 'utekos-dun'); reads++; return product; } },
      '@/lib/tracking/server-forms': {
        recordAcceptedDunReservation: async (_data, input) => { leads.push(input); return trackingEvent; },
        recordAcceptedForm: async (_data, ...args) => tracking.push(args),
        submissionIdFromReceipt: receipt => `submission-${receipt}`,
      },
    },
    fetch: async (url, options) => { sends.push({ url, ...options }); if (response instanceof Error) throw response; return response; },
  });
  return { ...api, sends, tracking, leads, reads: () => reads };
}

test('reservation requires all contact fields, valid options and explicit consent before sending', async () => {
  for (const overrides of [{ firstName: '' }, { lastName: ' ' }, { firstName: 'Test\nBcc: bad' }, { email: 'bad' }, { phone: '123' }, { phone: 'abcdefgh' }, { consent: '' }, { color: 'Havdyp' }, { size: 'XL' }, { website: 'bot.example' }]) {
    const api = harness();
    assert.equal((await api.submitDunReservation(form(overrides))).status, 'error', JSON.stringify(overrides));
    assert.equal(api.sends.length, 0);
    assert.equal(api.tracking.length, 0);
  }
});

test('confirmed reservation carries exact size, color, Shopify ID, identity and consent to customer service', async () => {
  const api = harness();
  assert.equal((await api.submitDunReservation(form())).status, 'success');
  assert.equal(api.sends.length, 1);
  const payload = JSON.parse(api.sends[0].body);
  assert.deepEqual(payload.to, ['service@example.com']);
  assert.equal(payload.reply_to, 'fixture@example.com');
  for (const value of ['Farge: Fjellblå', 'Størrelse: Large', 'Variant: gid://shopify/ProductVariant/4', 'Fornavn: Test', 'Etternavn: Person', 'Samtykke:', 'SMS og e-post', 'uke 43']) assert.ok(payload.text.includes(value), value);
  assert.deepEqual(api.tracking, [['product_reservation_utekos_dun', 'submission-receipt-fixture']]);
  assert.deepEqual(JSON.parse(JSON.stringify(api.leads)), [{ receiptId: 'receipt-fixture', email: 'fixture@example.com', phone: '+47 12345678', firstName: 'Test', productId: 'gid://shopify/Product/1', variantId: 'gid://shopify/ProductVariant/4', color: 'Fjellblå', size: 'Large' }]);
});

test('Small reservations preserve the verified Shopify ID for each color', async () => {
  for (const [color, id] of [['Vargnatt', '67610887160056'], ['Fjellblå', '67610887192824']]) {
    const api = harness();
    assert.equal((await api.submitDunReservation(form({ size: 'Small', color }))).status, 'success');
    const payload = JSON.parse(api.sends[0].body);
    assert.ok(payload.text.includes(`Variant: gid://shopify/ProductVariant/${id}`));
    assert.ok(payload.text.includes(`Farge: ${color}`));
    assert.ok(payload.text.includes('Størrelse: Small'));
  }
});

test('Small cannot be reserved when its exact Shopify variant is missing', async () => {
  const api = harness({ product: { variants: { nodes: variants.filter(variant => !variant.selectedOptions.some(option => option.value === 'Small')) } } });
  assert.equal((await api.submitDunReservation(form({ size: 'Small' }))).status, 'error');
  assert.equal(api.sends.length, 0);
});

test('missing or ambiguous existing variants cannot be reserved under a different SKU', async () => {
  for (const product of [null, { variants: { nodes: [] } }, { variants: { nodes: [...variants, variants[3]] } }]) {
    const api = harness({ product });
    assert.equal((await api.submitDunReservation(form())).status, 'error');
    assert.equal(api.sends.length, 0);
  }
});

test('provider rejection, missing receipt and missing configuration never show reservation success', async () => {
  for (const config of [{ response: { ok: false } }, { response: new Error('network') }, { response: { ok: true, json: async () => ({}) } }, { env: { RESEND_API_KEY: '' } }]) {
    const api = harness(config);
    assert.equal((await api.submitDunReservation(form())).status, 'error');
    assert.equal(api.tracking.length, 0);
    assert.equal(api.leads.length, 0);
  }
});

test('only a backend-confirmed Lead is returned; unavailable telemetry does not repeat accepted email', async () => {
  const trackingEvent = { event: 'generate_lead', event_id: 'confirmed-fixture' };
  const accepted = harness({ trackingEvent });
  assert.deepEqual((await accepted.submitDunReservation(form())).trackingEvent, trackingEvent);
  const unavailable = harness();
  const result = await unavailable.submitDunReservation(form());
  assert.equal(result.status, 'success');
  assert.equal(result.trackingEvent, undefined);
  assert.equal(unavailable.sends.length, 1);
});

test('identical retries keep the provider idempotency key; a changed variant gets a new key', async () => {
  const api = harness();
  await api.submitDunReservation(form());
  await api.submitDunReservation(form());
  await api.submitDunReservation(form({ color: 'Vargnatt' }));
  const keys = api.sends.map(send => send.headers['Idempotency-Key']);
  assert.match(keys[0], /^dun-reservation\/[a-f0-9]{64}$/);
  assert.equal(keys[0], keys[1]);
  assert.notEqual(keys[0], keys[2]);
});

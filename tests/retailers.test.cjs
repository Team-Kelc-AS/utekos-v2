/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const { retailers, retailerDirectionsUrl, getRetailer } = loadTypeScript('lib/retailers.ts');
const retailer = retailers[0];

test('each retailer resolves to its exact Google place, with unknown slugs rejected', () => {
  assert.equal(new Set(retailers.map(r => r.placeId)).size, 3);
  for (const r of retailers) {
    const url = new URL(retailerDirectionsUrl(r));
    assert.equal(url.searchParams.get('destination_place_id'), r.placeId);
    assert.equal(url.searchParams.get('destination'), `${r.name}, ${r.street}, ${r.postalCode} ${r.locality}`);
    assert.equal(getRetailer(r.slug), r);
  }
  assert.equal(getRetailer('does-not-exist'), undefined);
});

function openingHoursSetup(response, env = { GOOGLE_MAPS_KEY: 'test-only-secret' }) {
  const calls = [];
  const { getRetailerOpeningHours } = loadTypeScript('lib/retailers/opening-hours.ts', {
    env, fetch: async (url, options) => {
      calls.push({ url, ...options });
      if (response instanceof Error) throw response;
      return response;
    },
  });
  return { get: () => getRetailerOpeningHours(retailer), calls };
}

test('opening hours use current Google descriptions without persisting data or exposing the key', async () => {
  const days = ['mandag: 10:00–20:00', 'tirsdag: Stengt'];
  const { get, calls } = openingHoursSetup({ ok: true, json: async () => ({ businessStatus: 'OPERATIONAL', currentOpeningHours: { weekdayDescriptions: days } }) });
  const result = await get();
  assert.deepEqual(Array.from(result.days), days);
  assert.equal(calls[0].cache, 'no-store');
  assert.ok(calls[0].signal instanceof AbortSignal);
  assert.equal(calls[0].headers['X-Goog-Api-Key'], 'test-only-secret');
  assert.ok(calls[0].headers['X-Goog-FieldMask'].includes('attributions'));
  assert.ok(!calls[0].url.includes('test-only-secret'));
  assert.ok(!JSON.stringify(result).includes('test-only-secret'));
});

for (const [name, response] of [
  ['API failure', { ok: false }],
  ['timeout', new DOMException('Timed out', 'TimeoutError')],
  ['missing hours', { ok: true, json: async () => ({ businessStatus: 'OPERATIONAL' }) }],
  ['invalid body', { ok: true, json: async () => ({ currentOpeningHours: { weekdayDescriptions: 123 } }) }],
  ['closed business', { ok: true, json: async () => ({ businessStatus: 'CLOSED_PERMANENTLY', currentOpeningHours: { weekdayDescriptions: ['Monday: 09–17'] } }) }],
]) test(`${name} falls back instead of inventing opening hours`, async () => assert.equal(await openingHoursSetup(response).get(), null));

test('missing credentials do not make a Google request', async () => {
  const { get, calls } = openingHoursSetup(null, {});
  assert.equal(await get(), null);
  assert.equal(calls.length, 0);
});

test('Store markup identifies independent retailers without invented offers or reviews', () => {
  const { retailerStructuredData } = loadTypeScript('lib/retailers/structured-data.ts');
  for (const retailer of retailers) {
    const store = retailerStructuredData(retailer)['@graph'].find(node => node['@type'] === 'Store');
    assert.equal(store.telephone, retailer.telephone);
    assert.equal(store.address.streetAddress, retailer.street);
    assert.equal(store.url, retailer.website);
    for (const field of ['offers', 'aggregateRating', 'parentOrganization', 'openingHoursSpecification']) assert.equal(store[field], undefined);
  }
});

function submission(overrides = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ storeName: 'Testbutikken', location: 'Bergen', name: 'Testperson', email: 'test@example.com', phone: '12345678', message: 'Vi vil høre mer om Utekos i butikk.', privacy: 'on', ...overrides })) form.set(key, value);
  return form;
}

function inquirySetup(response = { ok: true, json: async () => ({ id: 'mock-receipt' }) }, { pdfError, leadEvent, env = { RESEND_API_KEY: 'test-key', CONTACT_FORM_SEND_TO_EMAIL: 'support@example.com' } } = {}) {
  const calls = [], tracking = [], pdfValues = [];
  const attachment = { filename: 'Utekos-forhandlerhenvendelse.pdf', content: Buffer.from('mock PDF').toString('base64'), content_type: 'application/pdf' };
  const { submitDealerInquiry } = loadTypeScript('app/(storefront)/bli-forhandler/actions.ts', {
    env,
    mocks: {
      '@/lib/tracking/server-forms': { recordAcceptedDealerInquiry: async (form, accepted) => {
        tracking.push({ form, accepted });
        return leadEvent;
      } },
      './dealer-pdf': { createDealerPdfAttachment: async values => {
        pdfValues.push(values);
        if (pdfError) throw pdfError;
        return attachment;
      } },
    },
    fetch: async (url, options) => {
      calls.push({ url, ...options, payload: JSON.parse(options.body) });
      if (response instanceof Error) throw response;
      return response;
    },
  });
  const { initialDealerInquiryState } = loadTypeScript('app/(storefront)/bli-forhandler/form-state.ts');
  return { submit: data => submitDealerInquiry(initialDealerInquiryState, data), calls, tracking, pdfValues, attachment };
}

test('dealer inquiries automatically deliver all fields and the PDF to Erling and track only after receipt', async () => {
  const { submit, calls, tracking, pdfValues, attachment } = inquirySetup();
  const form = submission({ recipient: 'attacker@example.com' });
  const result = await submit(form);
  assert.equal(result.status, 'success');
  assert.equal(result.leadEvent, undefined, 'email acceptance alone must not fabricate canonical lead readback');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal(calls[0].method, 'POST');
  const email = calls[0].payload;
  assert.deepEqual(email.to, ['erling@utekos.no']);
  assert.deepEqual(email.attachments, [attachment]);
  assert.equal(email.reply_to, 'test@example.com');
  assert.equal(email.subject, 'Forhandlerhenvendelse: Testbutikken');
  for (const text of ['Butikknavn: Testbutikken', 'Sted: Bergen', 'Kontaktperson: Testperson', 'Telefon: 12345678', 'Vi vil høre mer']) assert.ok(email.text.includes(text));
  assert.equal(email.html, undefined);
  assert.equal(pdfValues.length, 1);
  assert.equal(pdfValues[0].privacy, true);
  assert.equal(pdfValues[0].storeName, 'Testbutikken');
  assert.equal(pdfValues[0].recipient, undefined);
  assert.equal(tracking.length, 1);
  assert.equal(tracking[0].form, form, 'the submitted context is preserved for verified server-side attribution');
  assert.deepEqual(JSON.parse(JSON.stringify(tracking[0].accepted)), {
    receiptId: 'mock-receipt', email: 'test@example.com', phone: '12345678', name: 'Testperson', storeName: 'Testbutikken', location: 'Bergen',
  });
  assert.equal(tracking[0].accepted.message, undefined, 'message content is not part of the tracking payload');
  assert.equal(tracking[0].accepted.recipient, undefined);
});

test('only verified canonical lead readback is returned to the client after the email receipt', async () => {
  const leadEvent = { event: 'generate_lead', event_id: 'mock-server-confirmed-event' };
  const { submit, calls, tracking } = inquirySetup(undefined, { leadEvent });
  const result = await submit(submission());
  assert.equal(calls.length, 1);
  assert.equal(tracking.length, 1);
  assert.equal(result.status, 'success');
  assert.equal(result.leadEvent, leadEvent, 'the exact server-verified projection is retained');
});

test('retries reuse the receipt key while changed store details create a new one', async () => {
  const { submit, calls } = inquirySetup();
  await submit(submission());
  await submit(submission());
  await submit(submission({ location: 'Alta' }));
  assert.match(calls[0].headers['Idempotency-Key'], /^dealer-inquiry\//);
  assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key']);
  assert.notEqual(calls[0].headers['Idempotency-Key'], calls[2].headers['Idempotency-Key']);
});

test('fixed dealer recipient does not depend on the ordinary contact recipient setting', async () => {
  const { submit, calls } = inquirySetup(undefined, { env: { RESEND_API_KEY: 'test-key' } });
  assert.equal((await submit(submission())).status, 'success');
  assert.deepEqual(calls[0].payload.to, ['erling@utekos.no']);
  const { getContactEmailConfig } = loadTypeScript('lib/contact.ts', { env: { RESEND_API_KEY: 'test-key' } });
  assert.equal(getContactEmailConfig(), null, 'ordinary contact delivery still requires its own configured recipient');
  assert.equal(getContactEmailConfig('invalid-recipient'), null);
});

for (const overrides of [{ storeName: '' }, { location: '' }, { name: '' }, { email: 'invalid' }, { phone: '' }, { phone: '   ' }, { message: 'kort' }, { privacy: '' }, { storeName: 'Butikk\r\nBcc: other@example.com' }, { website: 'spam' }]) {
  test(`invalid inquiry rejected before delivery: ${Object.keys(overrides)[0]}`, async () => {
    const { submit, calls, tracking, pdfValues } = inquirySetup();
    assert.equal((await submit(submission(overrides))).status, 'error');
    assert.equal(calls.length, 0);
    assert.equal(tracking.length, 0);
    assert.equal(pdfValues.length, 0);
  });
}

for (const [label, response] of [
  ['provider rejection', { ok: false }],
  ['missing receipt', { ok: true, json: async () => ({}) }],
  ['empty receipt', { ok: true, json: async () => ({ id: '' }) }],
  ['network failure', new Error('Network failed')],
]) test(`${label} preserves all values and never records success`, async () => {
  const { submit, tracking } = inquirySetup(response);
  const result = await submit(submission());
  assert.equal(result.status, 'error');
  assert.deepEqual(JSON.parse(JSON.stringify(result.values)), {
    storeName: 'Testbutikken', location: 'Bergen', name: 'Testperson', email: 'test@example.com',
    phone: '12345678', message: 'Vi vil høre mer om Utekos i butikk.', privacy: true,
  });
  assert.equal(result.attempt, 1);
  assert.equal(tracking.length, 0);
  assert.equal(result.leadEvent, undefined);
});

test('PDF generation failure preserves the inquiry without sending mail or recording acceptance', async () => {
  const { submit, calls, tracking } = inquirySetup(undefined, { pdfError: new Error('Template unavailable') });
  const result = await submit(submission());
  assert.equal(result.status, 'error');
  assert.equal(result.values.storeName, 'Testbutikken');
  assert.equal(result.values.privacy, true);
  assert.equal(calls.length, 0);
  assert.equal(tracking.length, 0);
});

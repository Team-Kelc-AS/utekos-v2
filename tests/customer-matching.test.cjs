/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');
const h = 'a'.repeat(64);
const matching = { externalId: 'prospect_fixture', userData: {
  email_sha256: [h], google_email_sha256: ['b'.repeat(64)], phone_sha256: [h], e164_phone_sha256: ['c'.repeat(64)],
  first_name_sha256: [h], last_name_sha256: [h], postal_code_sha256: [h], state_sha256: [h], country_sha256: [h],
  date_of_birth_sha256: ['d'.repeat(64)],
}, location: { source: 'customer_provided', country_code: 'NO', postal_code: '5000', region_code: 'Vestland' } };
const event = { schema_version: 1, event_name: 'page_view', event_id: '22222222-2222-4222-8222-222222222222',
  event_time: '2026-11-01T10:00:00.000Z', source: 'web', environment: 'production', page_view_id: '33333333-3333-4333-8333-333333333333',
  page_url: 'https://utekos.no/', consent: { marketing: 'granted', analytics: 'granted', preferences: 'granted', source: 'operator_policy', version: '1' },
  click_id: { fbclid: 'OriginalCase_CLICK' }, browser_id: { fbc: 'fb.1.1793527200000.OriginalCase_CLICK' },
};
function fixture(reply = { matching }) {
  let requests = 0;
  const errors = [];
  const api = loadTypeScript('lib/analytics/customerMatching.ts', {
    globals: { window: { addEventListener() {} } },
    fetch: async () => { requests++; return { ok: true, status: 200, json: async () => reply }; },
    mocks: { '@/lib/observability/client/reportClientCaughtError': { reportClientCaughtError: error => errors.push(error.message) } },
  });
  return { api, errors, requests: () => requests };
}
test('one private matching read enriches every event without changing IDs, click IDs or timestamps', async () => {
  const f = fixture();
  for (const name of ['page_view', 'scroll_depth', 'view_item', 'select_item', 'add_to_cart', 'remove_from_cart', 'generate_lead', 'begin_checkout', 'view_item_list', 'view_category', 'view_cart', 'hero_interact', 'interact_with_accordion', 'purchase']) {
    const result = await f.api.enrichCanonicalEventWithCustomerMatching({ ...event, event_name: name });
    assert.deepEqual(JSON.parse(JSON.stringify(result.user_data)), matching.userData);
    assert.equal(result.external_id, matching.externalId);
    assert.equal(result.event_id, event.event_id); assert.equal(result.event_time, event.event_time);
    assert.deepEqual(result.click_id, event.click_id); assert.deepEqual(result.browser_id, event.browser_id);
  }
  assert.equal(f.requests(), 1); assert.deepEqual(f.errors, []);
});
test('anonymous and denied matching remain absent; malformed data never becomes identity', async () => {
  const denied = fixture();
  assert.equal((await denied.api.enrichCanonicalEventWithCustomerMatching({ ...event, consent: { ...event.consent, marketing: 'denied' } })).user_data, undefined);
  assert.equal(denied.requests(), 0);
  const anon = fixture({ matching: null });
  assert.equal((await anon.api.enrichCanonicalEventWithCustomerMatching(event)).user_data, undefined);
  const bad = fixture({ matching: { ...matching, userData: { email_sha256: ['raw@example.test'] } } });
  assert.equal((await bad.api.enrichCanonicalEventWithCustomerMatching(event)).user_data, undefined);
  assert.deepEqual(bad.errors, ['customer_matching_unavailable']);
});
test('all matching hashes survive Shopify attribute serialization only with marketing consent', () => {
  const api = loadTypeScript('lib/analytics/checkoutAttributionSnapshot.ts');
  const snapshot = api.createCheckoutAttributionSnapshot({ ...event, user_data: matching.userData });
  const attributes = api.checkoutAttributionSnapshotToShopifyAttributes(snapshot);
  const restored = api.parseOrderAttributionFromNoteAttributes(attributes.map(({ key, value }) => ({ name: key, value })));
  assert.deepEqual(JSON.parse(JSON.stringify(restored.user_data)), matching.userData);
  const denied = api.createCheckoutAttributionSnapshot({ ...event, user_data: matching.userData, consent: { ...event.consent, marketing: 'denied' } });
  assert.equal(api.checkoutAttributionSnapshotToShopifyAttributes(denied).some(x => x.key === 'utekos_customer_user_data_v1'), false);
});

test('a pending profile read never blocks synchronous event preparation or restores stale identity after login', async () => {
  let resolveOld, resolveNew;
  let count = 0;
  const window = { addEventListener() {}, dispatchEvent() {} };
  const api = loadTypeScript('lib/analytics/customerMatching.ts', {
    globals: { window, CustomEvent: class {} },
    fetch: () => new Promise(resolve => { if (++count === 1) resolveOld = resolve; else resolveNew = resolve; }),
    mocks: { '@/lib/observability/client/reportClientCaughtError': { reportClientCaughtError() {} } },
  });
  const old = api.readCustomerMatching();
  assert.equal(api.enrichWithCachedCustomerMatching(event), event);
  api.invalidateCustomerMatching(false);
  const newer = { ...matching, externalId: 'prospect_new_session' };
  resolveNew({ ok: true, json: async () => ({ matching: newer }) });
  await api.readCustomerMatching();
  resolveOld({ ok: true, json: async () => ({ matching }) });
  await old;
  assert.equal(api.enrichWithCachedCustomerMatching(event).external_id, newer.externalId);
  assert.equal(window.__utekosCustomerMatchingSnapshot.externalId, newer.externalId);
  assert.equal(count, 2);
});

test('background priming does not request identity without marketing consent', () => {
  const api = loadTypeScript('lib/analytics/customerMatching.ts', {
    fetch: () => { throw new Error('identity must not be requested'); },
    mocks: {
      '@/lib/consent/resolveTrackingAuthorization': { resolveTrackingAuthorization: () => ({ marketing: 'denied' }) },
      '@/lib/observability/client/reportClientCaughtError': { reportClientCaughtError() {} },
    },
  });
  api.primeCustomerMatching();
});

/* eslint-disable @typescript-eslint/no-require-imports */
// Offline contract tests: source modules run in the existing isolated VM harness.
// OIDC, edge context, Next request headers and every fetch are explicit fixtures.
const test = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest } = require('next/server');
const { webcrypto } = require('node:crypto');
const { loadTypeScript } = require('./load-typescript.cjs');

const BRIDGE_URL = 'https://backend.utekos.no/api/integrations/storefront-tracking/v1';
const ORIGIN = 'https://utekos.no';
const production = { VERCEL_ENV: 'production', NEXT_PUBLIC_VERCEL_ENV: 'production', NEXT_PUBLIC_TRACKING_ENABLED: 'true', VERCEL_GIT_COMMIT_SHA: 'a'.repeat(40) };
const acceptedAt = '2026-10-07T12:00:00.000Z';
const pageViewId = 'cfb9c40a-4be3-44bc-84a7-bdcd85f5e4c1';

function harness({ entry = 'lib/tracking/backend.ts', env = {}, incoming, tokenFailure = false, networkFailure = false, respond } = {}) {
  const sends = [], audiences = [], sessions = [], errors = [];
  const source = loadTypeScript(entry, {
    env: { ...production, ...env },
    mocks: {
      'node:net': require('node:net'),
      '@/lib/validation/zodMini': require('zod/mini'),
      './internalJourneyContext': { stripInternalJourneyContext: event => { const copy = { ...event }; delete copy.journey_id; delete copy.previous_page_view_id; return copy; } },
      '@vercel/oidc': { getVercelOidcToken: async options => { audiences.push(options); if (tokenFailure) throw new Error('fixture OIDC unavailable'); return 'fixture-oidc-token'; } },
      '@vercel/functions/headers': { ipAddress: () => '2001:db8::10', geolocation: () => ({ city: 'Tønsberg', country: 'NO', countryRegion: '39', postalCode: '3100' }) },
      '@/lib/facebook-login/session': { FACEBOOK_SESSION_COOKIE: 'utekos_v2_fb_session', readSession: (token, purpose) => { sessions.push({ token, purpose }); return token === 'verified-fixture-session' ? { userId: '123456' } : undefined; } },
      'next/dist/server/request/headers': { headers: async () => new Headers(incoming ?? { origin: ORIGIN, referer: `${ORIGIN}/produkter/utekos-dun`, 'user-agent': 'Fixture browser', cookie: '_fbp=fb.1.fixture; _epik=pinterest-fixture; utekos_v2_fb_session=verified-fixture-session' }) },
      'next/dist/server/web/spec-extension/request': { NextRequest },
    },
    globals: { Request, Response, Headers, Uint8Array, Buffer, crypto: webcrypto, console: { ...console, error: (...args) => errors.push(args) } },
    fetch: async (url, init) => {
      const envelope = JSON.parse(init.body);
      const body = JSON.parse(Buffer.from(envelope.bodyBase64, 'base64').toString('utf8'));
      sends.push({ url, init, envelope, body });
      if (networkFailure) throw new Error('fixture response lost');
      return respond ? respond({ url, init, envelope, body }, sends.length) : Response.json({ status: 'accepted' }, { status: 202 });
    },
  });
  return { ...source, sends, audiences, sessions, errors };
}
function request(path = '/api/events/page-view', { origin = ORIGIN, method = 'POST', body = '{"event_name":"page_view"}', headers = {} } = {}) {
  return new NextRequest(`${origin}${path}`, {
    method, ...(method === 'POST' ? { body } : {}), headers: {
      origin, 'content-type': 'application/json', 'user-agent': 'Fixture browser', ...headers,
    },
  });
}
function form() {
  const value = new FormData();
  value.set('leadTrackingContext', JSON.stringify({ consent: { analytics: 'granted', marketing: 'granted', preferences: 'granted', source: 'operator_policy', version: '1' }, page_url: `${ORIGIN}/produkter/utekos-dun`, page_view_id: pageViewId }));
  return value;
}
const waitlist = { receiptId: 'resend-fixture-receipt', email: 'fixture@example.com', phone: '+4712345678', firstName: 'Fixture' };
function receipt(submissionId, { status = 'accepted', eventId = submissionId, httpStatus = 200 } = {}) {
  return Response.json({ status, leadId: submissionId, eventId, dataLayerEvent: {
    canonical_event: { schema_version: 1, event_name: 'generate_lead', source: 'server', environment: 'production', event_id: eventId, event_time: acceptedAt,
      consent: { analytics: 'granted', marketing: 'granted', preferences: 'granted', source: 'operator_policy', version: '1' },
      page_url: `${ORIGIN}/produkter/utekos-dun`, page_view_id: pageViewId,
      custom_data: { submission_id: submissionId, form_id: 'product_waitlist_utekos_dun', lead_type: 'product_waitlist', currency: 'NOK', value: 415.65 },
    },
  } }, { status: httpStatus });
}

test('browser collectors fail closed outside production, with switch off, wrong origin, method or operation', async () => {
  for (const env of [{ VERCEL_ENV: 'preview' }, { NEXT_PUBLIC_VERCEL_ENV: 'preview' }, { NEXT_PUBLIC_TRACKING_ENABLED: 'false' }]) {
    const api = harness({ env });
    assert.equal((await api.forwardTrackingRequest(request())).status, 403);
    assert.equal(api.sends.length, 0); assert.equal(api.audiences.length, 0);
  }
  for (const [req, status] of [
    [request('/api/events/page-view', { origin: 'https://preview.example.test' }), 403],
    [request('/api/events/page-view', { headers: { origin: 'https://attacker.test' } }), 403],
    [request('/api/events/page-view', { method: 'OPTIONS' }), 405],
    [request('/internal/storefront/accepted-dun-waitlist'), 404],
    [request('/api/cron/canonical-provider-dispatch'), 404],
    [request('/api/events/search'), 404],
    [request('/api/events/view-search-results'), 404],
  ]) {
    const api = harness(); const response = await api.forwardTrackingRequest(req);
    assert.equal(response.status, status); assert.equal(api.sends.length, 0); assert.equal(api.audiences.length, 0);
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
});

test('authenticated collector forwards exact bytes and verified context, excluding private/spoofed cookies and headers', async () => {
  const raw = '{ "event_name": "page_view", "fixture": "æøå" }\r\n';
  const api = harness();
  const response = await api.forwardTrackingRequest(request('/api/meta/parameter-context?fbclid=fixture', { body: raw, headers: {
    cookie: '_fbp=fb.1.fixture; _epik=pinterest%3Bretained; backup_msclkid=bing-fixture; user_id=keeper; utekos_external_id=anon_fixture; utekos_cart=private-cart-key; cartId=private-legacy-cart; utekos_v2_fb_session=verified-fixture-session; utekos_fb_login_identity=private-legacy-session',
    'x-real-ip': '198.51.100.200', 'x-vercel-ip-country': 'US', 'x-utekos-facebook-login-id': '999',
  } }));
  assert.equal(response.status, 202); assert.equal(api.sends.length, 1);
  assert.equal(api.audiences[0].audience, BRIDGE_URL);
  const { url, init, envelope } = api.sends[0];
  assert.equal(url, BRIDGE_URL); assert.equal(new Headers(init.headers).get('authorization'), 'Bearer fixture-oidc-token');
  assert.equal(init.cache, 'no-store'); assert.equal(init.redirect, 'manual');
  assert.equal(Buffer.from(envelope.bodyBase64, 'base64').toString('utf8'), raw);
  assert.equal(envelope.search, '?fbclid=fixture'); assert.equal(envelope.context.clientIpAddress, '2001:db8::10');
  assert.equal(envelope.context.countryCode, 'NO'); assert.equal(envelope.context.city, 'Tønsberg');
  assert.equal(envelope.context.facebookLoginId, '123456'); assert.equal(envelope.context.deploySha, 'a'.repeat(40));
  assert.equal(envelope.headers['x-real-ip'], undefined); assert.equal(envelope.headers['x-vercel-ip-country'], undefined);
  assert.equal(envelope.headers['x-utekos-facebook-login-id'], undefined);
  assert.match(envelope.headers.cookie, /_epik=pinterest%3Bretained/);
  assert.match(envelope.headers.cookie, /backup_msclkid=bing-fixture/);
  assert.equal(envelope.headers.cookie.includes('private-'), false);
  assert.equal(envelope.headers.cookie.includes('verified-fixture-session'), false);
  assert.equal(api.sessions[0].purpose, 'session');
});

test('callback continuity ignores browser marketing toggle but never accepts preview, preserving original HMAC/OIDC', async () => {
  const raw = '{ "order":123, "message":"æøå" }\r\n';
  const api = harness({ env: { NEXT_PUBLIC_TRACKING_ENABLED: 'false', NEXT_PUBLIC_VERCEL_ENV: 'preview' } });
  const response = await api.forwardTrackingRequest(request('/api/shopify/webhooks/orders-paid', { body: raw, headers: {
    origin: 'https://checkout.shopify.com', authorization: 'Bearer original-platform-token', 'x-shopify-hmac-sha256': 'fixture-hmac', 'x-shopify-webhook-id': 'fixture-webhook',
  } }));
  assert.equal(response.status, 202); assert.equal(api.sends.length, 1);
  const { envelope, init } = api.sends[0];
  assert.equal(envelope.headers.authorization, 'Bearer original-platform-token');
  assert.equal(new Headers(init.headers).get('authorization'), 'Bearer fixture-oidc-token');
  assert.equal(envelope.headers['x-shopify-hmac-sha256'], 'fixture-hmac');
  assert.equal(Buffer.from(envelope.bodyBase64, 'base64').toString('utf8'), raw);
  const preview = harness({ env: { VERCEL_ENV: 'preview' } });
  assert.equal((await preview.forwardTrackingRequest(request('/api/shopify/webhooks/orders-paid'))).status, 403);
  assert.equal(preview.sends.length, 0);
});

test('response status, multiple cookies, callback CORS and collector receipt headers survive', async () => {
  const api = harness({ respond: () => {
    const headers = new Headers({ 'access-control-allow-origin': '*', 'access-control-expose-headers': 'X-Shopify-Checkout-Observation-Result', 'cross-origin-resource-policy': 'cross-origin', 'x-shopify-checkout-observation-result': 'accepted', 'x-shopify-checkout-canonical-result': 'not_applicable', 'x-utekos-traffic-classification': 'human_or_unknown', 'x-utekos-rejection': 'fixture', 'x-utekos-backend-deploy-sha': 'b'.repeat(40), 'cache-control': 'public,max-age=3600' });
    headers.append('set-cookie', '_fbp=one; Path=/; Expires=Wed, 21 Oct 2026 07:28:00 GMT');
    headers.append('set-cookie', '_fbc=two; Path=/');
    return new Response('fixture accepted', { status: 202, headers });
  } });
  const response = await api.forwardTrackingRequest(request('/api/shopify/checkout-observations'));
  assert.equal(response.status, 202); assert.equal(await response.text(), 'fixture accepted');
  assert.equal(response.headers.getSetCookie().length, 2);
  for (const key of ['access-control-expose-headers', 'cross-origin-resource-policy', 'x-shopify-checkout-observation-result', 'x-shopify-checkout-canonical-result', 'x-utekos-traffic-classification', 'x-utekos-rejection', 'x-utekos-backend-deploy-sha']) assert.ok(response.headers.get(key), key);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
});

test('missing OIDC, oversized body and lost response do not cause unauthenticated delivery or retries', async () => {
  const token = harness({ tokenFailure: true });
  assert.equal((await token.forwardTrackingRequest(request())).status, 502); assert.equal(token.sends.length, 0);
  const oversize = harness();
  assert.equal((await oversize.forwardTrackingRequest(request('/api/events/page-view', { body: 'x'.repeat(65537) }))).status, 413);
  assert.equal(oversize.audiences.length, 0); assert.equal(oversize.sends.length, 0);
  const lost = harness({ networkFailure: true });
  assert.equal((await lost.forwardTrackingRequest(request())).status, 502); assert.equal(lost.sends.length, 1);
  const logged = JSON.stringify([...token.errors, ...oversize.errors, ...lost.errors]);
  assert.equal(logged.includes('fixture-oidc-token'), false);
  assert.equal(logged.includes('event_name'), false);
});

test('form tracking ignores preview and invalid or foreign referrers without making network calls', async () => {
  for (const options of [
    { env: { VERCEL_ENV: 'preview' } },
    { incoming: { origin: ORIGIN, referer: '::::invalid' } },
    { incoming: { origin: ORIGIN, referer: 'https://attacker.test/form' } },
    { incoming: { origin: 'https://attacker.test', referer: 'https://attacker.test/form' } },
  ]) {
    const api = harness({ entry: 'lib/tracking/server-forms.ts', ...options });
    assert.equal(await api.recordAcceptedWaitlist(new FormData(), waitlist), undefined);
    assert.equal(api.sends.length, 0); assert.equal(api.audiences.length, 0);
  }
});

test('accepted Resend receipt yields stable ID and the exact confirmed browser Lead, with separate form observation', async () => {
  const api = harness({ entry: 'lib/tracking/server-forms.ts', respond: ({ envelope, body }) => envelope.operation.startsWith('/internal/') ? receipt(body.submissionId) : Response.json({ status: 'accepted' }, { status: 202 }) });
  const expectedId = api.submissionIdFromReceipt(waitlist.receiptId);
  assert.equal(api.submissionIdFromReceipt(waitlist.receiptId), expectedId);
  assert.notEqual(api.submissionIdFromReceipt('another-receipt'), expectedId);
  assert.match(expectedId, /^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  const event = await api.recordAcceptedWaitlist(form(), waitlist);
  assert.ok(event); assert.equal(event.event_id, expectedId); assert.equal(event.event_time, acceptedAt);
  assert.equal(event.canonical_event.custom_data.value, 415.65);
  assert.equal(api.sends.length, 2);
  assert.equal(api.sends[0].envelope.operation, '/internal/storefront/accepted-dun-waitlist');
  assert.equal(api.sends[0].body.submissionId, expectedId);
  assert.equal(api.sends[0].envelope.context.facebookLoginId, '123456');
  assert.equal(api.sends[1].envelope.operation, '/api/events/form-submit');
  assert.equal(api.sends[1].body.custom_data.result, 'accepted');
  assert.equal(JSON.stringify(api.sends[1].body).includes(waitlist.email), false);
  assert.equal(JSON.stringify(event).includes(waitlist.email), false);
});

test('unverified, unrelated or rejected lead receipts never produce a browser Lead', async () => {
  for (const variation of [
    { httpStatus: 202, status: 'lead_stored_event_unverified' },
    { eventId: pageViewId },
    { status: 'persistence_failed' },
  ]) {
    const api = harness({ entry: 'lib/tracking/server-forms.ts', respond: ({ envelope, body }) => envelope.operation.startsWith('/internal/') ? receipt(body.submissionId, variation) : Response.json({ status: 'accepted' }, { status: 202 }) });
    assert.equal(await api.recordAcceptedWaitlist(form(), waitlist), undefined, JSON.stringify(variation));
    assert.equal(api.sends.filter(call => call.envelope.operation.startsWith('/internal/')).length, 1);
    assert.equal(api.sends.some(call => call.envelope.operation === '/api/events/generate-lead'), false);
  }
});

const dealer = { receiptId: 'dealer-receipt', email: 'dealer@example.com', phone: '+4712345678', name: 'Testperson', storeName: 'Testbutikk', location: 'Bergen' };
function dealerForm(path = '/bli-forhandler') {
  const data = form();
  const context = JSON.parse(data.get('leadTrackingContext'));
  context.page_url = ORIGIN + path;
  data.set('leadTrackingContext', JSON.stringify(context));
  data.set('message', 'PRIVATE MESSAGE must never enter the collector');
  return data;
}
function dealerReceipt(body, status = 'accepted') {
  return Response.json({ status, eventId: body.submissionId, dataLayerEvent: { canonical_event: {
    schema_version: 1, event_name: 'generate_lead', source: 'server', environment: 'production',
    event_id: body.submissionId, event_time: body.acceptedAt, consent: body.trackingContext.consent,
    page_url: body.trackingContext.page_url,
    custom_data: { submission_id: body.submissionId, form_id: 'dealer_inquiry', lead_type: 'dealer_inquiry' },
  } } });
}
for (const path of ['/bli-forhandler', '/bli-forhandler/pdf']) test(`dealer receipt ${path} is bridged privately and read back without fictitious value`, async () => {
  const api = harness({ entry: 'lib/tracking/server-forms.ts', respond: ({ body }) => dealerReceipt(body) });
  const entry = await api.recordAcceptedDealerInquiry(dealerForm(path), dealer);
  assert.equal(entry.canonical_event.page_url, ORIGIN + path);
  assert.equal(entry.canonical_event.custom_data.value, undefined);
  assert.equal(entry.canonical_event.custom_data.currency, undefined);
  assert.equal(api.sends.length, 1);
  assert.equal(api.sends[0].envelope.operation, '/internal/storefront/accepted-dealer-inquiry');
  assert.equal(api.sends[0].body.message, undefined);
  assert.equal(api.sends[0].body.receiptId, undefined);
  assert.equal(entry.event_id, api.submissionIdFromReceipt(dealer.receiptId));
});

test('partial dealer collection and a lost response retry the same immutable receipt without re-emailing', async () => {
  for (const failure of ['pending', 'lost']) {
    const api = harness({ entry: 'lib/tracking/server-forms.ts', respond: ({ body }, count) => {
      if (count === 1) {
        if (failure === 'lost') throw new Error('lost response');
        return Response.json({ status: 'lead_stored_event_unverified' }, { status: 202 });
      }
      return dealerReceipt(body, 'duplicate');
    } });
    const entry = await api.recordAcceptedDealerInquiry(dealerForm(), dealer);
    assert.ok(entry);
    assert.equal(api.sends.length, 2);
    assert.deepEqual(api.sends[0].body, api.sends[1].body);
  }
});

test('dealer tracking stays off locally and never claims a browser conversion for unverified persistence', async () => {
  const local = harness({ entry: 'lib/tracking/server-forms.ts', env: { VERCEL_ENV: 'development' } });
  assert.equal(await local.recordAcceptedDealerInquiry(dealerForm(), dealer), undefined);
  assert.equal(local.sends.length, 0);
  for (const failure of ['pending', 'wrong-id', 'wrong-form', 'denied']) {
    const api = harness({ entry: 'lib/tracking/server-forms.ts', respond: async ({ body }) => {
      if (failure === 'pending') return Response.json({ status: 'lead_stored_event_unverified' }, { status: 202 });
      if (failure === 'denied') return Response.json({ status: 'stored_without_tracking' });
      const data = await dealerReceipt(body).json();
      if (failure === 'wrong-id') data.eventId = pageViewId;
      else { data.dataLayerEvent.canonical_event.custom_data.form_id = 'newsletter'; }
      return Response.json(data);
    } });
    assert.equal(await api.recordAcceptedDealerInquiry(dealerForm(), dealer), undefined);
    assert.equal(api.sends.length, failure === 'denied' ? 1 : 2);
  }
});

test('browser cannot forge accepted dealer form or lead through public collectors', async () => {
  for (const path of ['/api/events/generate-lead', '/api/events/form-submit']) {
    const api = harness();
    const response = await api.forwardTrackingRequest(request(path, { body: JSON.stringify({ source: 'server', custom_data: { form_id: 'dealer_inquiry' } }) }));
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, 'server_receipt_required');
    assert.equal(api.sends.length, 0);
    assert.equal(api.audiences.length, 0);
  }
});

const reservation = { ...waitlist, productId: 'gid://shopify/Product/1', variantId: 'gid://shopify/ProductVariant/67610887160056', color: 'Vargnatt', size: 'Small' };
function reservationReceipt(body, status = 'accepted') {
  return Response.json({ status, eventId: body.submissionId, dataLayerEvent: { canonical_event: {
    schema_version: 1, event_name: 'generate_lead', source: 'server', environment: 'production',
    event_id: body.submissionId, event_time: body.acceptedAt, consent: body.trackingContext.consent,
    page_url: body.trackingContext.page_url, page_view_id: body.trackingContext.page_view_id,
    custom_data: { submission_id: body.submissionId, form_id: 'product_reservation_utekos_dun', lead_type: 'product_reservation',
      product_handle: 'utekos-dun', product_id: body.productId, variant_id: body.variantId, color: body.color, size: body.size },
  } } });
}
test('Dun readback confirms the exact reserved variant without exposing contact data or assigning a value', async () => {
  const api = harness({ entry: 'lib/tracking/server-forms.ts', respond: ({ body }) => reservationReceipt(body) });
  const entry = await api.recordAcceptedDunReservation(form(), reservation);
  assert.ok(entry);
  assert.equal(entry.event_id, api.submissionIdFromReceipt(reservation.receiptId));
  assert.equal(entry.canonical_event.custom_data.variant_id, reservation.variantId);
  assert.equal(entry.canonical_event.custom_data.size, 'Small');
  assert.equal(entry.canonical_event.page_view_id, pageViewId);
  assert.equal(entry.custom_data.value, undefined);
  assert.equal(entry.custom_data.currency, undefined);
  assert.equal(api.sends.length, 1);
  assert.equal(api.sends[0].envelope.operation, '/internal/storefront/accepted-dun-reservation');
  assert.equal(api.sends[0].body.receiptId, undefined);
  for (const value of [reservation.email, reservation.phone, reservation.firstName]) assert.ok(!JSON.stringify(entry).includes(value));
});
test('Dun lost response retries the immutable receipt and accepts a confirmed duplicate', async () => {
  const api = harness({ entry: 'lib/tracking/server-forms.ts', respond: ({ body }, count) => {
    if (count === 1) throw new Error('lost response');
    return reservationReceipt(body, 'duplicate');
  } });
  assert.ok(await api.recordAcceptedDunReservation(form(), reservation));
  assert.equal(api.sends.length, 2);
  assert.deepEqual(api.sends[0].body, api.sends[1].body);
});
test('Dun rejects pending, mismatched and valued readbacks and remains silent in preview', async () => {
  const preview = harness({ entry: 'lib/tracking/server-forms.ts', env: { VERCEL_ENV: 'preview' } });
  assert.equal(await preview.recordAcceptedDunReservation(form(), reservation), undefined);
  assert.equal(preview.sends.length, 0);
  for (const failure of ['pending', 'id', 'variant', 'page', 'value']) {
    const api = harness({ entry: 'lib/tracking/server-forms.ts', respond: async ({ body }) => {
      if (failure === 'pending') return Response.json({ status: 'lead_stored_event_unverified' }, { status: 202 });
      const data = await reservationReceipt(body).json();
      if (failure === 'id') data.eventId = pageViewId;
      if (failure === 'variant') data.dataLayerEvent.canonical_event.custom_data.variant_id = 'gid://shopify/ProductVariant/2';
      if (failure === 'page') data.dataLayerEvent.canonical_event.page_url = ORIGIN + '/other';
      if (failure === 'value') Object.assign(data.dataLayerEvent.canonical_event.custom_data, { value: 415.65, currency: 'NOK' });
      return Response.json(data);
    } });
    assert.equal(await api.recordAcceptedDunReservation(form(), reservation), undefined, failure);
    assert.equal(api.sends.length, 2, failure);
  }
});

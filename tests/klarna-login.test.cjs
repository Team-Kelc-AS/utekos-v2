/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest, NextResponse } = require('next/server');
const { loadTypeScript } = require('./load-typescript.cjs');
const token = 'fixture-validated-token-'.repeat(8);
const userPage = '/produkter/comfyrobe?variant=1';
const verified = { subject: 'fixture', email: 'fixture@example.test', name: 'Fixture', givenName: 'Fixture' };
function fixture({ valid = true, state = true, receipt = true, failure = false } = {}) {
  const calls = [], sessions = [];
  const { POST } = loadTypeScript('app/api/identity/klarna/complete/route.ts', {
    globals: { Buffer },
    mocks: {
      'next/server': { NextResponse },
      '@/lib/cart/request': { sameOrigin: () => true, privateHeaders: { 'cache-control': 'private, no-store' } },
      '@/lib/klarna/identity': {
        KLARNA_IDENTITY_SESSION_COOKIE: 'session-fixture', KLARNA_IDENTITY_STATE_COOKIE: 'state-fixture',
        klarnaIdentityConfig: () => ({ key: Buffer.alloc(32), clientId: 'fixture', issuer: 'https://login.klarna.com' }),
        readKlarnaState: () => state ? { returnTo: userPage } : null,
        verifyKlarnaIdToken: async () => { if (!valid) throw new Error('unverified'); return verified; },
        klarnaIdentityVerificationFailure: () => ({ code: 'FIXTURE_REJECTED' }),
        createKlarnaSession: identity => { sessions.push(identity); return 'encrypted-session'; }, klarnaSessionMaxAge: 3600,
      },
      '@/lib/klarna/prospect': { forwardKlarnaProspect: async (request, identity, input) => {
        calls.push({ request, identity, input });
        if (failure) throw new Error('durable queue unavailable');
        return Response.json({ stored: true, ...(receipt ? { login_event_id: input.login.eventId } : {}) });
      } },
    },
  });
  return { calls, sessions, post: () => POST(new NextRequest('https://utekos.no/api/identity/klarna/complete', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken: token }),
  })) };
}

test('validated completion requires durable Login receipt before setting the session, using a stable ID and actual server time', async () => {
  const f = fixture(), before = Date.now();
  const response = await f.post();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { returnTo: userPage });
  assert.equal(f.sessions.length, 1);
  assert.match(response.headers.get('set-cookie'), /session-fixture=encrypted-session/);
  const { identity, input } = f.calls[0];
  assert.deepEqual(identity, verified);
  assert.equal(input.action, 'authenticated_login');
  assert.equal(input.login.pageUrl, 'https://utekos.no' + userPage);
  assert.ok(Date.parse(input.login.eventTime) >= before && Date.parse(input.login.eventTime) <= Date.now());
  assert.match(input.login.eventId, /^[a-f0-9-]{36}$/);
  assert.equal(JSON.stringify(input).includes(token), false);
  await f.post();
  assert.equal(f.calls[1].input.login.eventId, input.login.eventId);
  const { klarnaLoginEventId } = loadTypeScript('lib/klarna/login.ts');
  assert.notEqual(klarnaLoginEventId(token), klarnaLoginEventId(token + 'new-login'));
});

test('unverified, cancelled/expired and failed durable acceptance never report successful login', async () => {
  for (const options of [{ valid: false }, { state: false }, { receipt: false }, { failure: true }]) {
    const f = fixture(options), response = await f.post();
    assert.equal(response.status, options.valid === false ? 401 : options.state === false ? 403 : 503);
    assert.equal(f.sessions.length, 0);
    assert.doesNotMatch(response.headers.get('set-cookie') ?? '', /session-fixture=/);
    if (options.valid === false || options.state === false) assert.equal(f.calls.length, 0);
  }
});

test('browser completion survives immediate navigation with keepalive and does not reload or create browser Login/PageView', async () => {
  let init, invalidations = 0;
  const api = loadTypeScript('assets/components/klarna/completeKlarnaIdentity.ts', {
    fetch: async (_url, value) => { init = value; return Response.json({ returnTo: userPage }); },
    mocks: { '@/lib/analytics/customerMatching': { invalidateCustomerMatching: () => invalidations++ } },
  });
  assert.equal(await api.completeKlarnaIdentity(token), userPage);
  assert.equal(init.keepalive, true);
  assert.equal(init.credentials, 'same-origin');
  assert.equal(invalidations, 1);
  const rejected = loadTypeScript('assets/components/klarna/completeKlarnaIdentity.ts', {
    fetch: async () => Response.json({ error: 'Innlogging avbrutt' }, { status: 401 }),
    mocks: { '@/lib/analytics/customerMatching': { invalidateCustomerMatching: () => invalidations++ } },
  });
  await assert.rejects(rejected.completeKlarnaIdentity(token), /avbrutt/);
  assert.equal(invalidations, 1);
});

test('trusted prospect forwarding preserves browser IP, user agent, referrer and permitted cookies', async () => {
  let forwarded;
  const api = loadTypeScript('lib/klarna/prospect.ts', {
    mocks: {
      'next/server': { NextRequest },
      '@vercel/functions/headers': { ipAddress: () => '192.0.2.17' },
      './identity': { klarnaIdentityConfig: () => ({ issuer: 'https://login.klarna.com' }) },
      '@/lib/tracking/backend': {
        identityCookieHeader: () => '_fbc=fb.1.1793527000000.ExactCase_CLICK; _fbp=fb.1.1793527000000.123456789',
        forwardTrackingRequest: async request => { forwarded = request; return Response.json({ stored: true }); },
      },
    },
  });
  const login = { eventId: '22222222-2222-5222-8222-222222222222', eventTime: '2026-11-01T10:00:00.000Z',
    pageUrl: 'https://utekos.no' + userPage, consent: { marketing: 'granted' } };
  await api.forwardKlarnaProspect(new NextRequest('https://utekos.no/api/identity/klarna/complete', { headers: {
    'user-agent': 'Fixture browser', referer: 'https://utekos.no' + userPage,
  } }), verified, { action: 'authenticated_login', login });
  assert.equal(forwarded.headers.get('x-forwarded-for'), '192.0.2.17');
  assert.equal(forwarded.headers.get('user-agent'), 'Fixture browser');
  assert.equal(forwarded.headers.get('referer'), 'https://utekos.no' + userPage);
  assert.match(forwarded.headers.get('cookie'), /ExactCase_CLICK/);
  const body = await forwarded.json();
  assert.deepEqual(body.login, login);
  assert.equal(body.identity.email, verified.email);
  assert.equal(body.identity.issuer, 'https://login.klarna.com');
});

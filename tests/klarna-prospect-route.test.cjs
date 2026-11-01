/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest, NextResponse } = require('next/server');
const { loadTypeScript } = require('./load-typescript.cjs');

// Only fictional identities and encrypted test sessions; no provider/network calls.
const key = Buffer.alloc(32, 19);
const verified = { subject: 'fictional-customer', email: 'fictional@example.test', name: 'Fictional Customer' };
function fixture(mode = 'missing') {
  let now = Date.now();
  class Clock extends Date { static now() { return now; } }
  const identity = loadTypeScript('lib/klarna/identity.ts', {
    globals: { Buffer, Date: Clock },
    env: { KLARNA_IDENTITY_ENABLED: 'true', KLARNA_IDENTITY_CLIENT_ID: 'klarna_live_client_fixture', KLARNA_IDENTITY_SESSION_KEY: key.toString('base64') },
    mocks: { jose: { createRemoteJWKSet() {} } },
  });
  let cookie = mode === 'missing' ? undefined : identity.createKlarnaSession(verified, key);
  if (mode === 'tampered') cookie = 'invalid-cookie';
  if (mode === 'expired') now += (identity.klarnaSessionMaxAge + 1) * 1000;
  const forwarded = [];
  let cartReads = 0;
  const { POST } = loadTypeScript('app/api/identity/klarna/prospect/route.ts', {
    globals: { Buffer },
    mocks: {
      'next/server': { NextResponse },
      '@/lib/klarna/identity': identity,
      '@/lib/cart/server': {
        CART_COOKIE: 'fictional-cart',
        readCart: async () => { cartReads++; throw new Error('Unexpected cart read'); },
        cartView: () => { throw new Error('Unexpected cart view'); },
      },
      '@/lib/klarna/prospect': {
        prospectCartSnapshot: () => { throw new Error('Unexpected cart snapshot'); },
        forwardKlarnaProspect: async (_request, session, input) => {
          forwarded.push({ session, input });
          return NextResponse.json(input.action === 'matching' ? { matching: { externalId: 'fictional-prospect' } } : { profile: null });
        },
      },
    },
  });
  return {
    forwarded, cartReads: () => cartReads,
    post: (input, { origin = 'https://utekos.no', raw } = {}) => POST(new NextRequest('https://utekos.no/api/identity/klarna/prospect', {
      method: 'POST', headers: { origin, 'content-type': 'application/json', ...(cookie ? { cookie: `${identity.KLARNA_IDENTITY_SESSION_COOKIE}=${cookie}` } : {}) },
      body: raw ?? JSON.stringify(input),
    })),
  };
}

test('anonymous, expired and invalid sessions return a private empty matching result without forwarding or reading a cart', async () => {
  for (const mode of ['missing', 'expired', 'tampered']) {
    const f = fixture(mode), response = await f.post({ action: 'matching' });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { matching: null });
    assert.match(response.headers.get('cache-control'), /private, no-store/);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(f.forwarded.length, 0);
    assert.equal(f.cartReads(), 0);
  }
});

test('preference reads, writes and cart synchronization still require a valid session', async () => {
  const save = { action: 'save', emailMarketing: false, cartReminders: false, adMatching: false, comfyrobeSize: null, favoriteColor: null, interests: [] };
  for (const mode of ['missing', 'expired', 'tampered']) {
    const f = fixture(mode);
    for (const input of [{ action: 'state' }, { action: 'cart' }, save]) {
      assert.equal((await f.post(input)).status, 401);
    }
    assert.equal(f.forwarded.length, 0);
    assert.equal(f.cartReads(), 0);
  }
});

test('validated sessions continue forwarding matching and state with the server identity', async () => {
  const f = fixture('valid');
  assert.deepEqual(await (await f.post({ action: 'matching' })).json(), { matching: { externalId: 'fictional-prospect' } });
  assert.deepEqual(await (await f.post({ action: 'state' })).json(), { profile: null });
  assert.equal(f.forwarded.length, 2);
  assert.equal(f.forwarded[0].session.email, verified.email);
  assert.equal(f.forwarded[0].session.subject, verified.subject);
  assert.equal(f.forwarded[0].input.action, 'matching');
  assert.equal(f.forwarded[1].input.action, 'state');
  assert.equal(f.cartReads(), 0);
});

test('anonymous matching retains same-origin, strict input and payload-size protections', async () => {
  const f = fixture();
  assert.equal((await f.post({ action: 'matching' }, { origin: 'https://other.example.test' })).status, 403);
  assert.equal((await f.post({ action: 'matching', identity: verified })).status, 400);
  assert.equal((await f.post(null, { raw: '{broken' })).status, 400);
  assert.equal((await f.post({ action: 'matching' }, { raw: ' '.repeat(4097) })).status, 413);
  assert.equal(f.forwarded.length, 0);
});

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const bridge = 'https://backend.utekos.no/api/integrations/storefront-tracking/v1';
const fullId = 'gid://shopify/Cart/fixture?key=secret-fixture';
function request(origin = 'https://utekos.no', headerOrigin = origin) {
  return { nextUrl: new URL(origin), headers: new Headers({ origin: headerOrigin, 'user-agent': 'fixture-browser', 'x-utekos-client-ip': '203.0.113.99' }) };
}
function harness({ environment = 'production', tokenFails = false, networkFails = false } = {}) {
  const sends = [], audiences = [];
  const api = loadTypeScript('lib/klarna/backend.ts', {
    env: { VERCEL_ENV: environment, NEXT_PUBLIC_TRACKING_ENABLED: 'false', VERCEL_GIT_COMMIT_SHA: 'a'.repeat(40) },
    mocks: {
      'node:net': require('node:net'),
      '@vercel/oidc': { getVercelOidcToken: async input => { audiences.push(input); if (tokenFails) throw new Error('OIDC unavailable'); return 'fixture-token'; } },
      '@vercel/functions': { geolocation: () => ({ city: 'Oslo', country: 'NO', postalCode: '0001', countryRegion: '03' }), ipAddress: () => '192.0.2.1' },
      '@/lib/tracking/backend': { verifiedFacebookLoginId: () => '12345' },
    },
    fetch: async (url, init) => { sends.push({ url, init }); if (networkFails) throw new Error('Lost response'); return { ok: true, status: 200 }; },
  });
  return { ...api, sends, audiences };
}

test('Klarna sends authenticated owned context and secret cart cookie in the envelope exactly once', async () => {
  const api = harness();
  const send = await api.prepareKlarnaOrderForwarder(request(), fullId);
  assert.equal(api.sends.length, 0);
  await send(JSON.stringify({ authorizationToken: 'fixture-authorization', beginCheckoutEventId: 'f16a04b1-d0be-4d2c-9b73-cf69c67f2251' }));
  assert.equal(api.sends.length, 1);
  const { url, init } = api.sends[0];
  const envelope = JSON.parse(init.body);
  assert.equal(url, bridge);
  assert.equal(api.audiences[0].audience, bridge);
  assert.equal(init.headers.Authorization, 'Bearer fixture-token');
  assert.equal(init.cache, 'no-store');
  assert.equal(init.redirect, 'error');
  assert.equal(envelope.operation, '/api/klarna/orders');
  assert.equal(envelope.headers.cookie, `cartId=${encodeURIComponent(fullId)}`);
  assert.equal(envelope.headers.origin, 'https://utekos.no');
  assert.equal(envelope.context.clientIpAddress, '192.0.2.1');
  assert.equal(envelope.context.facebookLoginId, '12345');
  assert.equal(envelope.context.deploySha, 'a'.repeat(40));
  assert.equal(envelope.context.userAgent, 'fixture-browser');
  assert.equal(envelope.headers['x-utekos-client-ip'], undefined);
  const body = JSON.parse(Buffer.from(envelope.bodyBase64, 'base64').toString());
  assert.equal(body.authorizationToken, 'fixture-authorization');
  assert.equal(JSON.stringify(body).includes('secret-fixture'), false);
});

test('untrusted environments and missing authentication fail before payment submission', async () => {
  for (const options of [{ environment: 'preview' }, { environment: 'development' }, { tokenFails: true }]) {
    const api = harness(options);
    await assert.rejects(api.prepareKlarnaOrderForwarder(request(), fullId));
    assert.equal(api.sends.length, 0);
  }
  for (const value of [undefined, request('https://evil.example.test'), request('https://utekos.no', 'https://evil.example.test')]) {
    const api = harness();
    await assert.rejects(api.prepareKlarnaOrderForwarder(value, fullId));
    assert.equal(api.audiences.length, 0);
    assert.equal(api.sends.length, 0);
  }
});

test('a lost payment response is returned to the owner without automatic retry', async () => {
  const api = harness({ networkFails: true });
  const send = await api.prepareKlarnaOrderForwarder(request(), fullId);
  await assert.rejects(send('{}'), /Lost response/);
  assert.equal(api.sends.length, 1);
});

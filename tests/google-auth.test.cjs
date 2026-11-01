/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest, NextResponse } = require('next/server');
const { createServerClient } = require('@supabase/ssr');
const { loadTypeScript } = require('./load-typescript.cjs');

const env = {
  CUSTOMER_AUTH_SUPABASE_URL: 'https://customer-auth.example.test',
  CUSTOMER_AUTH_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_customer_test',
  CUSTOMER_ACCOUNT_ORIGIN: 'https://utekos.no',
};
const authCookie = 'utekos_customer_auth_session';
const returnCookie = 'utekos_google_return';
const user = {
  id: 'ca748d23-7250-4d54-b8ba-97f09faab32d', aud: 'authenticated',
  email: 'customer@example.test', email_confirmed_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'google' },
  user_metadata: {}, identities: [{ provider: 'google', identity_data: { sub: 'google-subject' } }],
};
const accessToken = [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'),
  'fixture-signature',
].join('.');

function fixture({ providerAvailable = true, verifiedUser = user, tokenValid = true } = {}) {
  const requests = [];
  const fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url ?? input.href);
    requests.push({ url, init });
    if (url.pathname === '/auth/v1/authorize') {
      return providerAvailable
        ? new Response(null, { status: 302, headers: { location: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=fixture&state=provider-state' } })
        : Response.json({ msg: 'Unsupported provider: missing OAuth secret' }, { status: 400 });
    }
    if (url.pathname === '/auth/v1/token') {
      if (!tokenValid) return Response.json({ error: 'invalid_grant', error_description: 'Expired code' }, { status: 400 });
      return Response.json({ access_token: accessToken, refresh_token: 'fixture-refresh-token', token_type: 'bearer', expires_in: 3600, user });
    }
    if (url.pathname === '/auth/v1/user') {
      assert.equal(new Headers(init.headers).get('authorization'), `Bearer ${accessToken}`);
      return Response.json(verifiedUser);
    }
    if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204 });
    throw new Error(`Unexpected auth request: ${url.pathname}`);
  };
  const load = (entry, overrides = env) => loadTypeScript(entry, {
    env: overrides, fetch,
    mocks: { 'next/server': { NextRequest, NextResponse }, '@supabase/ssr': { createServerClient } },
  });
  return {
    requests, load,
    start: load('app/(account)/auth/google/route.ts').GET,
    callback: load('app/(account)/auth/callback/route.ts').GET,
    status: load('app/api/identity/google/status/route.ts').GET,
    disconnect: load('app/api/identity/google/disconnect/route.ts').POST,
  };
}

const cookieHeader = response => response.cookies.getAll().filter(cookie => cookie.value).map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
const request = (url, cookies = '') => new NextRequest(`https://utekos.no${url}`, { headers: { cookie: cookies } });

test('Google starts directly, binds PKCE to HttpOnly cookies and only requests profile scopes', async () => {
  const f = fixture();
  const response = await f.start(request('/auth/google?returnTo=%2Fprodukter%2Futekos-techdown%3Fstorrelse%3Dliten'));
  assert.equal(new URL(response.headers.get('location')).origin, 'https://accounts.google.com');
  const provider = f.requests.find(r => r.url.pathname === '/auth/v1/authorize').url;
  assert.equal(provider.searchParams.get('provider'), 'google');
  assert.equal(provider.searchParams.get('redirect_to'), 'https://utekos.no/auth/callback');
  assert.equal(provider.searchParams.get('code_challenge_method'), 's256');
  assert.ok(provider.searchParams.get('code_challenge').length >= 43);
  assert.equal(provider.searchParams.get('scopes'), 'email profile');
  assert.equal(provider.searchParams.get('access_type'), null);
  assert.equal(response.cookies.get(returnCookie).value, '/produkter/utekos-techdown?storrelse=liten');
  const verifier = response.cookies.get(`${authCookie}-code-verifier`);
  assert.ok(verifier.value);
  assert.equal(verifier.httpOnly, true);
  assert.equal(verifier.secure, true);
  assert.equal(verifier.sameSite, 'lax');
  assert.equal(verifier.maxAge, 600);
  assert.match(response.headers.get('cache-control'), /no-store/);
});

test('callback verifies the user, persists server cookies and restores the original product', async () => {
  const f = fixture();
  const start = await f.start(request('/auth/google?returnTo=%2Fprodukter%2Futekos-techdown'));
  const result = await f.callback(request('/auth/callback?code=fixture-code', cookieHeader(start)));
  assert.equal(result.headers.get('location'), 'https://utekos.no/produkter/utekos-techdown');
  const tokenRequest = f.requests.find(r => r.url.pathname === '/auth/v1/token');
  const body = JSON.parse(tokenRequest.init.body);
  assert.equal(body.auth_code, 'fixture-code');
  assert.ok(body.code_verifier.length >= 43);
  assert.ok(f.requests.some(r => r.url.pathname === '/auth/v1/user'));
  assert.equal(result.cookies.get(returnCookie).maxAge, 0);
  const session = result.cookies.getAll().filter(cookie => (cookie.name === authCookie || cookie.name.startsWith(`${authCookie}.`)) && cookie.value);
  assert.ok(session.length > 0);
  for (const cookie of session) {
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.secure, true);
  }
  const status = await f.status(request('/api/identity/google/status', cookieHeader(result)));
  const statusBody = await status.json();
  assert.deepEqual(statusBody, { authenticated: true });
  assert.doesNotMatch(JSON.stringify(statusBody), /access_token|refresh_token|customer@example/);
});

test('missing PKCE, cancelled and expired callbacks never authenticate', async () => {
  for (const callback of ['/auth/callback?code=unbound-code', '/auth/callback?error=access_denied', '/auth/callback']) {
    const f = fixture();
    const result = await f.callback(request(callback));
    assert.equal(new URL(result.headers.get('location')).pathname, '/auth/error');
    assert.ok(!f.requests.some(r => r.url.pathname === '/auth/v1/token'));
    assert.ok(!result.cookies.getAll().some(cookie => cookie.name === authCookie && cookie.value));
  }
  const f = fixture({ tokenValid: false });
  const start = await f.start(request('/auth/google'));
  const result = await f.callback(request('/auth/callback?code=expired', cookieHeader(start)));
  assert.equal(new URL(result.headers.get('location')).searchParams.get('reason'), 'expired');
});

test('unverified email and identities without Google are rejected after code exchange', async () => {
  for (const verifiedUser of [{ ...user, email_confirmed_at: null }, { ...user, identities: [{ provider: 'email' }] }]) {
    const f = fixture({ verifiedUser });
    const start = await f.start(request('/auth/google'));
    const result = await f.callback(request('/auth/callback?code=fixture', cookieHeader(start)));
    assert.equal(new URL(result.headers.get('location')).searchParams.get('reason'), 'verification');
    assert.ok(!result.cookies.getAll().some(cookie => cookie.name === authCookie && cookie.value));
  }
});

test('misconfigured providers fail visibly on Utekos without a Shopify fallback', async () => {
  const f = fixture({ providerAvailable: false });
  const result = await f.start(request('/auth/google'));
  assert.equal(new URL(result.headers.get('location')).pathname, '/auth/error');
  assert.doesNotMatch(result.headers.get('location'), /shopify|missing.OAuth.secret/);
  const noConfig = f.load('app/(account)/auth/google/route.ts', {});
  assert.equal(new URL((await noConfig.GET(request('/auth/google'))).headers.get('location')).pathname, '/auth/error');
});

test('external returns, auth loops and incorrect origins cannot redirect a signed-in user', async () => {
  const f = fixture();
  const helper = f.load('lib/customer-auth/google.ts');
  for (const value of ['https://evil.test/', '//evil.test', '/\\evil.test', '/auth/google', '/auth/callback?code=secret', '/\nevil.test']) {
    assert.equal(helper.safeGoogleReturnTo(value), '/');
  }
  assert.equal(helper.safeGoogleReturnTo('/produkter/utekos-techdown?farge=havdyp'), '/produkter/utekos-techdown?farge=havdyp');
  const mismatch = await f.start(new NextRequest('https://untrusted.test/auth/google'));
  assert.equal(new URL(mismatch.headers.get('location')).pathname, '/auth/error');
  assert.equal(f.requests.length, 0);
});

test('logout requires the storefront origin and revokes only the current session', async () => {
  const f = fixture();
  const blocked = await f.disconnect(new NextRequest('https://utekos.no/api/identity/google/disconnect', { method: 'POST', headers: { origin: 'https://other.test' } }));
  assert.equal(blocked.status, 403);
  const start = await f.start(request('/auth/google'));
  const callback = await f.callback(request('/auth/callback?code=fixture', cookieHeader(start)));
  const result = await f.disconnect(new NextRequest('https://utekos.no/api/identity/google/disconnect', { method: 'POST', headers: { origin: 'https://utekos.no', cookie: cookieHeader(callback) } }));
  assert.equal(result.status, 200);
  const logout = f.requests.find(r => r.url.pathname === '/auth/v1/logout');
  assert.equal(logout.url.searchParams.get('scope'), 'local');
  for (const cookie of result.cookies.getAll().filter(cookie => cookie.name === authCookie || cookie.name.startsWith(`${authCookie}.`))) assert.equal(cookie.maxAge, 0);
});

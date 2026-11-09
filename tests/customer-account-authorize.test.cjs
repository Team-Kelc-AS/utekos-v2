/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest, NextResponse } = require('next/server');
const { loadTypeScript } = require('./load-typescript.cjs');

function subject(env = {}) {
  return loadTypeScript('app/(site)/(account)/customer/account/authorize/route.ts', {
    env,
    mocks: { 'next/dist/server/web/spec-extension/response': { NextResponse } },
  });
}

function request(email) {
  return new NextRequest('https://utekos.no/customer/account/authorize', {
    method: 'POST',
    body: new URLSearchParams({ email }),
  });
}

test('email submission uses a GET redirect with a safely encoded Shopify login hint', async () => {
  const response = await subject().POST(request('wishlist+test@example.test'));
  assert.equal(response.status, 303);
  const destination = new URL(response.headers.get('location'));
  assert.equal(destination.origin, 'https://shopify.com');
  assert.equal(destination.pathname, '/63421546744/account/login');
  assert.equal(destination.searchParams.get('login_hint'), 'wishlist+test@example.test');
  assert.match(response.headers.get('cache-control'), /no-store/);
});

test('invalid email never redirects to an identity provider', async () => {
  for (const email of ['', 'not-an-email', 'x'.repeat(260) + '@example.test']) {
    const response = await subject().POST(request(email));
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('location'), null);
  }
});

test('account links preserve hosted login and reject insecure configured destinations', async () => {
  const response = await subject({ SHOPIFY_CUSTOMER_ACCOUNT_URL: 'https://account.example.test/' }).GET();
  assert.equal(response.headers.get('location'), 'https://account.example.test/login');
  const invalid = await subject({ SHOPIFY_CUSTOMER_ACCOUNT_URL: 'http://account.example.test' }).GET();
  assert.equal(invalid.status, 503);
});

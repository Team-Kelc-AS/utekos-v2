/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

function session(env = {}) {
  return loadTypeScript('lib/facebook-login/session.ts', {
    env: {
      FACEBOOK_LOGIN_ENABLED: 'true',
      FACEBOOK_LOGIN_APP_ID: '123456',
      FACEBOOK_LOGIN_APP_SECRET: 'fixture-secret',
      FACEBOOK_LOGIN_IDENTITY_KEY: Buffer.alloc(32, 7).toString('base64'),
      ...env,
    },
    mocks: { '@/lib/validation/zodMini': require('zod/mini') },
    globals: { Buffer },
  });
}

test('encrypted Facebook state and session retain expiry and numeric user ID, stripping unknown fields', () => {
  const api = session();
  const expiresAt = Date.now() + 60_000;
  for (const [purpose, payload] of [
    ['state', { expiresAt }],
    ['session', { expiresAt, userId: '00123456' }],
  ]) {
    const token = api.sealSession({ ...payload, ignored: 'private-fixture' }, purpose);
    assert.deepEqual(JSON.parse(JSON.stringify(api.readSession(token, purpose))), payload);
    assert.equal(api.readSession(token, purpose === 'state' ? 'session' : 'state'), null);
  }
});

test('expired or invalid authenticated payloads never yield a Facebook identity', () => {
  const api = session();
  const expiresAt = Date.now() + 60_000;
  for (const payload of [
    { expiresAt: Date.now() - 1, userId: '123' },
    { expiresAt: String(expiresAt), userId: '123' },
    { expiresAt: null }, {}, [], null,
    ...['', 'abc', '12.3', ' 123', '-123', 123, null].map(userId => ({ expiresAt, userId })),
  ]) {
    assert.equal(api.readSession(api.sealSession(payload, 'session'), 'session'), null);
  }
});

test('malformed cookies, authentication tampering and wrong keys fail closed', () => {
  const api = session();
  const token = api.sealSession({ expiresAt: Date.now() + 60_000, userId: '123' }, 'session');
  for (const value of [undefined, '', 'not-a-token', '..', token.split('.').slice(0, 2).join('.')]) {
    assert.equal(api.readSession(value, 'session'), null);
  }
  for (let part = 0; part < 3; part++) {
    const parts = token.split('.');
    const bytes = Buffer.from(parts[part], 'base64url');
    bytes[0] ^= 1;
    parts[part] = bytes.toString('base64url');
    assert.equal(api.readSession(parts.join('.'), 'session'), null);
  }
  const wrongKey = session({ FACEBOOK_LOGIN_IDENTITY_KEY: Buffer.alloc(32, 8).toString('base64') });
  assert.equal(wrongKey.readSession(token, 'session'), null);
});

test('disabled or incomplete Facebook configuration never releases an identity', () => {
  const token = session().sealSession({ expiresAt: Date.now() + 60_000, userId: '123' }, 'session');
  for (const env of [
    { FACEBOOK_LOGIN_ENABLED: 'false' },
    { FACEBOOK_LOGIN_APP_ID: 'invalid' },
    { FACEBOOK_LOGIN_APP_SECRET: '' },
    { FACEBOOK_LOGIN_IDENTITY_KEY: '' },
  ]) {
    const api = session(env);
    assert.equal(api.readSession(token, 'session'), null);
    assert.throws(() => api.sealSession({ expiresAt: Date.now() + 60_000 }, 'state'), /Facebook unavailable/);
  }
});

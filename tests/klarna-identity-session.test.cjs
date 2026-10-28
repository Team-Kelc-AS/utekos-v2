/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const key = Buffer.alloc(32, 7);
function identity(env = {}, payload = {}) {
  return loadTypeScript('lib/klarna/identity.ts', {
    env: {
      KLARNA_IDENTITY_ENABLED: 'true',
      KLARNA_IDENTITY_CLIENT_ID: 'klarna_live_client_identity_fixture',
      KLARNA_IDENTITY_SESSION_KEY: key.toString('base64'),
      ...env,
    },
    mocks: { jose: { createRemoteJWKSet: () => {}, jwtVerify: async () => ({ payload }) } },
    globals: { Buffer },
  });
}

test('Klarna session accepts only authenticated data and rejects altered cookies', () => {
  const api = identity();
  const session = api.createKlarnaSession({
    subject: 'klarna-customer', email: 'kunde@example.test', name: 'Kunde Test',
  }, key);
  assert.equal(api.readKlarnaSession(session).email, 'kunde@example.test');
  assert.equal(api.readKlarnaSession(undefined), null);
  for (let part = 0; part < 3; part++) {
    const pieces = session.split('.');
    const bytes = Buffer.from(pieces[part], 'base64url');
    bytes[0] ^= 1;
    pieces[part] = bytes.toString('base64url');
    assert.equal(api.readKlarnaSession(pieces.join('.')), null);
  }
  assert.equal(identity({ KLARNA_IDENTITY_SESSION_KEY: Buffer.alloc(32, 8).toString('base64') }).readKlarnaSession(session), null);
  assert.equal(identity({ KLARNA_IDENTITY_ENABLED: 'false' }).readKlarnaSession(session), null);
});

test('Klarna identity does not reuse the payment client identifier', () => {
  const api = identity({ KLARNA_IDENTITY_CLIENT_ID: '', NEXT_PUBLIC_KLARNA_CLIENT_ID: 'klarna_live_client_payment_fixture' });
  assert.throws(() => api.klarnaIdentityConfig(), /configuration is incomplete/);
});

test('uses the ID token in the documented Klarna SDK sign-in response', () => {
  const sdk = loadTypeScript('assets/components/klarna/loadKlarnaIdentitySdk.ts');
  const token = 'x'.repeat(100);
  assert.equal(sdk.klarnaIdentityIdToken({
    user_account_profile: { email: 'untrusted@example.test' },
    user_account_linking: { user_account_linking_id_token: token },
  }), token);
  assert.throws(() => sdk.klarnaIdentityIdToken({ idToken: token }), /missing an ID token/);
});

test('Klarna scopes request optional profile data and only signed claims enter the session', async () => {
  const api = identity({}, {
    sub: 'klarna-customer', email: 'kunde@example.test', email_verified: true,
    given_name: 'Kari', family_name: 'Nordmann', phone: '+4740000000', phone_verified: true,
    date_of_birth: '1985-04-20', country: 'NO', locale: 'nb-NO',
    billing_address: { street_address: 'Testveien 1', postal_code: '0150', city: 'Oslo', country: 'NO' },
    national_id: 'never-store-this',
  });
  const scope = api.klarnaIdentityConfig().scope;
  for (const requested of ['profile:phone', 'profile:date_of_birth', 'profile:billing_address',
    'profile:shipping_address', 'profile:country', 'profile:locale']) assert.ok(scope.includes(requested));
  const verified = await api.verifyKlarnaIdToken('x'.repeat(100), 'client', 'https://login.klarna.com');
  assert.equal(verified.givenName, 'Kari');
  assert.equal(verified.familyName, 'Nordmann');
  assert.equal(verified.dateOfBirth, '1985-04-20');
  assert.equal(verified.billingAddress.city, 'Oslo');
  assert.equal(verified.phone, '+4740000000');
  assert.equal(verified.locale, 'nb-NO');
  assert.equal('national_id' in verified, false);
  const session = api.readKlarnaSession(api.createKlarnaSession(verified, key));
  assert.equal(session.billingAddress.postal_code, '0150');
  assert.equal(session.locale, 'nb-NO');
});

test('Klarna state is purpose isolated and only keeps local return paths', () => {
  const api = identity();
  const state = api.createKlarnaState('/konto', key);
  assert.equal(api.readKlarnaState(state, key).returnTo, '/konto');
  assert.equal(api.readKlarnaSession(state), null);
  for (const path of ['https://example.test/', '//example.test/', '/\\example.test/']) {
    assert.equal(api.safeReturnTo(path), '/konto');
  }
  assert.equal(api.safeReturnTo('/produkter/comfyrobe'), '/produkter/comfyrobe');
});

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const key = Buffer.alloc(32, 7);
function identity(env = {}, payload = {}, jose) {
  return loadTypeScript('lib/klarna/identity.ts', {
    env: {
      KLARNA_IDENTITY_ENABLED: 'true',
      KLARNA_IDENTITY_CLIENT_ID: 'klarna_live_client_identity_fixture',
      KLARNA_IDENTITY_SESSION_KEY: key.toString('base64'),
      ...env,
    },
    mocks: { jose: jose ?? { createRemoteJWKSet: () => {}, jwtVerify: async () => ({ payload }) } },
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

test('undisclosed optional claims do not reject a verified Klarna identity', async () => {
  const api = identity({}, {
    sub: 'klarna-customer', email: 'kunde@example.test', email_verified: true,
    given_name: null, family_name: null, phone: null, phone_verified: null,
    date_of_birth: null, shipping_address: null, address: null,
    country: null, locale: null,
    billing_address: { street_address: 'Testveien 1', street_address2: null, region: null },
  });
  const verified = await api.verifyKlarnaIdToken('x'.repeat(100), 'client', 'https://login.klarna.com');
  assert.equal(verified.email, 'kunde@example.test');
  assert.equal('phone' in verified, false);
  assert.equal('dateOfBirth' in verified, false);
  assert.equal(verified.billingAddress.street_address2, undefined);
  assert.equal(api.readKlarnaSession(api.createKlarnaSession(verified, key)).email, 'kunde@example.test');
});

test('required verified email remains mandatory and diagnostics contain no profile values', async () => {
  for (const payload of [
    { sub: 'customer', email: 'private@example.test', email_verified: false },
    { sub: 'customer', email: null, email_verified: true },
    { sub: null, email: 'private@example.test', email_verified: true },
    { sub: 'customer', email: 'private@example.test', email_verified: true, phone: 'invalid-private-phone' },
  ]) {
    const api = identity({}, payload);
    await assert.rejects(api.verifyKlarnaIdToken('x'.repeat(100), 'client', 'https://login.klarna.com'), error => {
      const failure = api.klarnaIdentityVerificationFailure(error);
      assert.equal(failure.code, 'KLARNA_PROFILE_INVALID');
      assert.ok(failure.fields.length > 0);
      assert.doesNotMatch(JSON.stringify(failure), /private|customer/);
      return true;
    });
  }
  const api = identity();
  assert.equal(JSON.stringify(api.klarnaIdentityVerificationFailure({
    code: 'ERR_JWT_CLAIM_VALIDATION_FAILED', claim: 'aud', payload: { email: 'private@example.test' },
  })), JSON.stringify({ code: 'ERR_JWT_CLAIM_VALIDATION_FAILED', claim: 'aud' }));
  assert.equal(JSON.stringify(api.klarnaIdentityVerificationFailure({
    code: 'secret-token', message: 'private@example.test',
  })), JSON.stringify({ code: 'KLARNA_VERIFICATION_FAILED' }));
});

test('real JWT verification rejects forged, expired, wrong-audience and wrong-issuer tokens', async () => {
  const jose = await import('jose');
  const { privateKey, publicKey } = await jose.generateKeyPair('RS256');
  const jwk = { ...await jose.exportJWK(publicKey), kid: 'fixture-key', alg: 'RS256' };
  const issuer = 'https://login.klarna.com';
  const clientId = 'klarna_live_client_identity_fixture';
  const api = identity({}, {}, {
    ...jose,
    createRemoteJWKSet: url => {
      assert.ok([
        `${issuer}/.well-known/jwks.json`,
        'https://login.playground.klarna.com/.well-known/jwks.json',
      ].includes(url.href));
      return jose.createLocalJWKSet({ keys: [jwk] });
    },
  });
  const sign = (claims = {}, signingKey = privateKey) => new jose.SignJWT({
    sub: 'customer', email: 'kunde@example.test', email_verified: true,
    date_of_birth: null, phone: null, ...claims,
  }).setProtectedHeader({ alg: 'RS256', kid: 'fixture-key' })
    .setIssuer(issuer).setAudience(clientId).setIssuedAt().setExpirationTime('5m').sign(signingKey);
  const valid = await sign();
  assert.equal((await api.verifyKlarnaIdToken(valid, clientId, issuer)).email, 'kunde@example.test');
  for (const [token, audience, expectedIssuer] of [
    [valid, 'another-client', issuer],
    [valid, clientId, 'https://login.playground.klarna.com'],
    [await new jose.SignJWT({ email: 'kunde@example.test', email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: 'fixture-key' }).setSubject('customer')
      .setIssuer(issuer).setAudience(clientId).setIssuedAt().setExpirationTime(1).sign(privateKey), clientId, issuer],
    [await sign({}, (await jose.generateKeyPair('RS256')).privateKey), clientId, issuer],
  ]) {
    await assert.rejects(api.verifyKlarnaIdToken(token, audience, expectedIssuer));
  }
});

test('Klarna identity does not reuse the payment client identifier', () => {
  const api = identity({ KLARNA_IDENTITY_CLIENT_ID: '', NEXT_PUBLIC_KLARNA_CLIENT_ID: 'klarna_live_client_payment_fixture' });
  assert.throws(() => api.klarnaIdentityConfig(), /configuration is incomplete/);
});

test('Klarna redirects only to the configured origin', () => {
  assert.equal(identity().klarnaIdentityConfig().redirectOrigin, 'https://utekos.no');
  assert.equal(identity({
    KLARNA_IDENTITY_REDIRECT_ORIGIN: 'http://localhost:3000', NODE_ENV: 'development',
  }).klarnaIdentityConfig().redirectOrigin, 'http://localhost:3000');
  assert.throws(() => identity({
    KLARNA_IDENTITY_REDIRECT_ORIGIN: 'http://localhost:3000', NODE_ENV: 'production',
  }).klarnaIdentityConfig(), /configuration is incomplete/);
  assert.throws(() => identity({
    KLARNA_IDENTITY_REDIRECT_ORIGIN: 'http://example.test', NODE_ENV: 'development',
  }).klarnaIdentityConfig(), /configuration is incomplete/);
});

test('uses the ID token in the documented Klarna SDK sign-in response', () => {
  const sdk = loadTypeScript('assets/components/klarna/loadKlarnaIdentitySdk.ts');
  const token = 'x'.repeat(100);
  assert.equal(sdk.klarnaIdentityIdToken({
    customerProfile: { email: 'untrusted@example.test' },
    idToken: token,
  }), token);
  assert.throws(() => sdk.klarnaIdentityIdToken({
    user_account_linking: { user_account_linking_id_token: token },
  }), /missing an ID token/);
  assert.throws(() => sdk.klarnaIdentityIdToken({ customerProfile: { email: 'untrusted@example.test' } }), /missing an ID token/);
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
  const state = api.createKlarnaState('/produkter/comfyrobe', key);
  assert.equal(api.readKlarnaState(state, key).returnTo, '/produkter/comfyrobe');
  assert.equal(api.readKlarnaSession(state), null);
  for (const path of ['https://example.test/', '//example.test/', '/\\example.test/']) {
    assert.equal(api.safeReturnTo(path), '/');
  }
  assert.equal(api.safeReturnTo('/produkter/comfyrobe'), '/produkter/comfyrobe');
});

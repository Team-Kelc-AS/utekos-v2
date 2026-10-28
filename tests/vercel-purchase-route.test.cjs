/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const EVENT_ID = 'f347309b-4727-4826-866b-e5584105527a';
const ENDPOINT = 'https://utekos.no/api/internal/vercel-commerce/purchase';

function harness({ validToken = true, enabled = true } = {}) {
  const checks = [], tracked = [];
  const subject = loadTypeScript('app/api/internal/vercel-commerce/purchase/route.ts', {
    mocks: {
      '@vercel/analytics/server': { track: async (...args) => tracked.push(args) },
      '@vercel/oidc': { verifyVercelOidcToken: async (...args) => {
        checks.push(args);
        if (!validToken) throw new Error('invalid signature');
      } },
      '@/lib/tracking/environment': {
        productionTrackingEnabled: () => enabled,
        isTrackingOrigin: url => new URL(url).origin === 'https://utekos.no',
      },
    },
    globals: { Request, Response, Headers, TextEncoder },
  });
  return { ...subject, checks, tracked };
}

function request(body = { event_id: EVENT_ID, currency: 'NOK', value: 845 }, token = 'signed') {
  return new Request(ENDPOINT, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('purchase route verifies backend identity and submits only purchase value and currency', async () => {
  const subject = harness();
  const result = await subject.POST(request({ event_id: EVENT_ID, currency: 'NOK', value: 845 }));
  assert.equal(result.status, 202);
  assert.equal((await result.json()).status, 'submitted_unverified');
  assert.equal(subject.checks.length, 1);
  assert.equal(subject.checks[0][1].projectId, 'prj_EHFI28tMUlIQsNguxjcKHPlLAlFE');
  assert.equal(subject.checks[0][1].environment, 'production');
  assert.equal(subject.checks[0][1].audience, ENDPOINT);
  assert.equal(subject.tracked.length, 1);
  assert.equal(subject.tracked[0][0], 'purchase');
  assert.deepEqual(JSON.parse(JSON.stringify(subject.tracked[0][1])), { currency: 'NOK', value: 845 });
});

test('purchase route rejects missing or invalid identity, invalid body and disabled tracking', async () => {
  const invalid = harness({ validToken: false });
  assert.equal((await invalid.POST(request())).status, 401);
  assert.equal(invalid.tracked.length, 0);
  const malformed = harness();
  assert.equal((await malformed.POST(request({ event_id: EVENT_ID, currency: 'NOK', value: 845, email: 'private@example.test' }))).status, 400);
  assert.equal(malformed.tracked.length, 0);
  const disabled = harness({ enabled: false });
  assert.equal((await disabled.POST(request())).status, 403);
  assert.equal(disabled.checks.length, 0);
});

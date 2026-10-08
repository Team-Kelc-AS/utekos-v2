/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');
const { deliverCanonicalEvent } = loadTypeScript('lib/tracking/delivery.ts', { globals: { TextEncoder } });
const event = { event_id: 'f53a202b-6177-479f-959c-9e7dd017098a', event_time: '2026-10-07T12:00:00.000Z', custom_data: { value: 800, currency: 'NOK' } };

for (const failure of [408, 429, 500, 503, 'network', 'timeout']) {
  test(`collector retries ${failure} once with unchanged serialized identity and value`, async () => {
    const attempts = [];
    const result = await deliverCanonicalEvent('/api/events/add-to-cart', event, async (url, init) => {
      attempts.push({ url, init });
      if (attempts.length === 1) {
        if (failure === 'network') throw new TypeError('connection lost');
        if (failure === 'timeout') throw new DOMException('timeout', 'TimeoutError');
        return new Response(null, { status: failure });
      }
      return new Response(null, { status: 202 });
    });
    assert.equal(attempts.length, 2);
    assert.equal(attempts[0].init.body, attempts[1].init.body);
    assert.deepEqual(JSON.parse(attempts[1].init.body), event);
    assert.equal(result.status, 'accepted_unverified');
    assert.equal(result.httpStatus, 202);
    assert.equal(attempts[0].init.cache, 'no-store');
    assert.equal(attempts[0].init.credentials, 'same-origin');
    assert.equal(attempts[0].init.keepalive, true);
    assert.ok(attempts[0].init.signal);
  });
}
test('collector validation rejection is not retried; repeated transport failure stays unverified', async () => {
  let calls = 0;
  await assert.rejects(deliverCanonicalEvent('/api/events/add-to-cart', event, async () => { calls++; return new Response(null, { status: 400 }); }), /collector_http_400/);
  assert.equal(calls, 1);
  calls = 0;
  await assert.rejects(deliverCanonicalEvent('/api/events/add-to-cart', event, async () => { calls++; throw new TypeError('lost response'); }), /lost response/);
  assert.equal(calls, 2);
});
test('HTTP acceptance never claims provider receipt', async () => {
  const result = await deliverCanonicalEvent('/api/events/page-view', event, async () => new Response(null, { status: 200 }));
  assert.equal(result.status, 'accepted_unverified');
  assert.equal(result.httpStatus, 200);
});

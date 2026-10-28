/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

function harness() {
  const callbacks = [];
  const tracked = [];
  const subject = loadTypeScript('lib/tracking/vercelCommerceEvents.ts', {
    mocks: {
      '@vercel/analytics/server': { track: async (...args) => tracked.push(args) },
      'next/server': { after: callback => callbacks.push(callback) },
    },
    globals: { Buffer, TextEncoder },
  });
  return { ...subject, callbacks, tracked };
}

function body(name, analytics = 'granted') {
  return Buffer.from(JSON.stringify({
    event_name: name,
    consent: { analytics },
    custom_data: { currency: 'NOK', value: 845, customer_email: 'private@example.test' },
  }));
}

test('accepted add_to_cart and begin_checkout create only consented, minimal Vercel events', async () => {
  const subject = harness();
  const request = new Request('https://utekos.no/api/events/add-to-cart', { headers: {
    'user-agent': 'Fixture browser', cookie: 'private=session', 'x-forwarded-for': '203.0.113.200',
  } });
  subject.scheduleVercelCommerceEvent('/api/events/add-to-cart', 202, body('add_to_cart'), request, '192.0.2.10');
  subject.scheduleVercelCommerceEvent('/api/events/begin-checkout', 202, body('begin_checkout'), request, '192.0.2.10');
  subject.scheduleVercelCommerceEvent('/api/events/add-to-cart', 200, body('add_to_cart'), request);
  subject.scheduleVercelCommerceEvent('/api/events/add-to-cart', 202, body('add_to_cart', 'denied'), request);
  subject.scheduleVercelCommerceEvent('/api/events/add-to-cart', 202, body('begin_checkout'), request);
  subject.scheduleVercelCommerceEvent('/api/events/add-to-cart', 202, Buffer.from('not json'), request);
  assert.equal(subject.callbacks.length, 2);
  for (const callback of subject.callbacks) await callback();
  assert.deepEqual(subject.tracked.map(call => call[0]), ['add_to_cart', 'begin_checkout']);
  for (const call of subject.tracked) {
    assert.deepEqual(JSON.parse(JSON.stringify(call[1])), { currency: 'NOK', value: 845 });
    assert.equal(call[2].headers.cookie, undefined);
    assert.equal(call[2].headers['x-forwarded-for'], '192.0.2.10');
    assert.equal(JSON.stringify(call).includes('private@example.test'), false);
  }
});

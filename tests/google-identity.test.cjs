/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');
const { enrichCanonicalEventWithGoogleAnalyticsIds: enrich } = loadTypeScript('lib/analytics/googleAnalyticsBrowserIds.ts');
const event = { event_id: 'preserved', consent: { analytics: 'granted' }, browser_id: { fbp: 'preserved' } };
const dependencies = getGoogleTagValue => ({ getGoogleTagValue, clearTimer: clearTimeout, setTimer: setTimeout, timeoutMs: 40, retryMs: 5 });

test('denied analytics and already complete identities do not query Google', async () => {
  const deps = dependencies(() => assert.fail('must not query Google'));
  const denied = { ...event, consent: { analytics: 'denied' } };
  assert.equal(await enrich(denied, deps), denied);
  const ready = { ...event, browser_id: { ga_client_id: '123.456', ga_session_id: '789' } };
  assert.equal(await enrich(ready, deps), ready);
});

test('partial Google response preserves known IDs and other providers at the deadline', async () => {
  const result = await enrich(event, dependencies((field, callback) => callback(field === 'client_id' ? ' 123.456 ' : undefined)));
  assert.equal(result.event_id, event.event_id);
  assert.equal(result.browser_id.fbp, 'preserved');
  assert.equal(result.browser_id.ga_client_id, '123.456');
  assert.equal(result.browser_id.ga_session_id, undefined);
});

test('unavailable Google tag settles at the deadline and stops retries', async () => {
  let calls = 0;
  const deps = dependencies(() => { calls++; throw new Error('blocked'); });
  assert.equal(await enrich(event, deps), event);
  const ended = calls;
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(calls, ended);
});

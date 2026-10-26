/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildSync } = require('esbuild');
const { chromium, webkit } = require('playwright');

const root = path.resolve(__dirname, '..');
const code = buildSync({
  absWorkingDir: root,
  stdin: { contents: "export { deliverCanonicalEvent } from './src/lib/tracking/delivery';", resolveDir: root, loader: 'ts' },
  bundle: true, platform: 'browser', format: 'iife', globalName: 'deliveryFixture', write: false,
}).outputFiles[0].text;

for (const [engine, browserType] of [['chromium', chromium], ['webkit', webkit]]) {
  test(`${engine}: a visible event survives another SDK exhausting the shared keepalive budget`, async () => {
    const browser = await browserType.launch();
    let releaseOther;
    try {
      const page = await browser.newPage();
      const requests = [];
      await page.route('https://collector.test/**', async route => {
        const request = route.request();
        const pathname = new URL(request.url()).pathname;
        if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<body>Local transport fixture</body>' });
        if (pathname === '/other-sdk') {
          return new Promise(resolve => {
            releaseOther = () => route.fulfill({ status: 202, body: '{}' }).finally(resolve);
          });
        }
        requests.push({ pathname, body: request.postData() });
        return route.fulfill({ status: 202, body: '{}' });
      });
      await page.goto('https://collector.test/');
      await page.addScriptTag({ content: code });
      const otherStarted = page.waitForRequest('https://collector.test/other-sdk');
      await page.evaluate(() => {
        window.otherSdkRequest = fetch('/other-sdk', { method: 'POST', keepalive: true, body: 'x'.repeat(62_000) });
      });
      await otherStarted;
      const result = await page.evaluate(async () => {
        const event = { event_id: 'offline-fixture-event', value: 845, padding: 'x'.repeat(8_000) };
        const outcome = await deliveryFixture.deliverCanonicalEvent('/api/events/add-to-cart', event);
        return { outcome, event };
      });
      assert.equal(result.outcome.status, 'accepted_unverified');
      assert.equal(result.outcome.httpStatus, 202);
      assert.equal(requests.length, 1, 'the rejected keepalive never reached the collector; retry reaches it once');
      assert.equal(requests[0].pathname, '/api/events/add-to-cart');
      assert.deepEqual(JSON.parse(requests[0].body), result.event, 'fallback preserves the exact event ID and value');
    } finally {
      await releaseOther?.();
      await browser.close();
    }
  });
}

/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { chromium, webkit } = require('playwright');

const baseURL = process.env.KLARNA_RETURN_BASE_URL;

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(`Klarna return page works without claiming payment from a query string (${name})`, { skip: !baseURL }, async () => {
    const browser = await engine.launch();
    try {
      for (const javaScriptEnabled of [true, false]) {
        for (const width of [390, 1440]) {
          const context = await browser.newContext({ javaScriptEnabled, viewport: { width, height: 900 } });
          // Render only: no production telemetry or payment requests.
          await context.route('**/*', route => {
            const request = route.request();
            const url = new URL(request.url());
            if (!['GET', 'HEAD'].includes(request.method()) || request.resourceType() === 'ping' || /\/(?:tr|collect)\/?$/.test(url.pathname)) {
              return route.fulfill({ status: 204 });
            }
            return route.continue();
          });
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          const response = await page.goto(new URL('/kjop/fullfort?klarna_order_id=untrusted-fixture', baseURL).href, { waitUntil: 'load' });
          await page.evaluate(() => document.fonts.ready);
          if (javaScriptEnabled) await page.waitForTimeout(1000);
          assert.equal(response.status(), 200);
          assert.deepEqual(errors, []);
          assert.equal(await page.locator('h1').innerText(), 'Din bestilling');
          assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
          assert.doesNotMatch(await page.locator('main').innerText(), /untrusted-fixture|Betalingen din er registrert/);
          assert.equal(await page.getByRole('link', { name: 'Få hjelp med bestillingen' }).getAttribute('href'), '/kontaktskjema');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
          if (name === 'chromium' && javaScriptEnabled) await page.screenshot({ path: `/tmp/utekos-klarna-return-${width}.png`, fullPage: true });
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  });
}

/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { chromium, webkit } = require('playwright');

// Run against a built server or deployment, not next dev: the observed failure
// is in the production fallback render. Example: NOT_FOUND_BASE_URL=http://localhost:3105.
const baseURL = process.env.NOT_FOUND_BASE_URL;
const missingPaths = ['/does-not-exist-hydration-probe', '/comyrobe-xs', '/missing/nested-page'];

for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  test(`unknown URLs remain real, usable 404s without hydration errors (${engineName})`, { skip: !baseURL }, async () => {
    const browser = await engine.launch();
    try {
      for (const javaScriptEnabled of [true, false]) {
        const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 390, height: 844 } });
        // This is a rendering regression check, not a source of production events.
        await context.route('**/*', route => {
          const request = route.request();
          const url = new URL(request.url());
          if (!['GET', 'HEAD'].includes(request.method()) || request.resourceType() === 'ping' || /\/(?:tr|collect)\/?$/.test(url.pathname)) {
            return route.fulfill({ status: 204 });
          }
          return route.continue();
        });
        for (const pathname of missingPaths) {
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          page.on('console', message => {
            if (message.type() === 'error' && /hydrat|didn't match|Minified React/.test(message.text())) errors.push(message.text());
          });
          const response = await page.goto(new URL(pathname, baseURL).href, { waitUntil: 'domcontentloaded' });
          assert.equal(response.status(), 404, pathname);
          if (javaScriptEnabled) await page.waitForTimeout(2000);
          assert.deepEqual(errors, [], pathname);
          assert.equal(await page.locator('html').getAttribute('lang'), 'nb');
          assert.match(await page.locator('meta[name="robots"]').first().getAttribute('content'), /noindex/);
          assert.equal(await page.locator('h1').innerText(), 'Denne siden finnes ikke');
          assert.equal(await page.getByRole('link', { name: 'Se alle produkter' }).getAttribute('href'), '/produkter');
          assert.equal(await page.getByRole('link', { name: 'Kontakt oss', exact: true }).getAttribute('href'), '/kontaktskjema');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
          await page.close();
        }
        await context.close();
      }
    } finally {
      await browser.close();
    }
  });
}

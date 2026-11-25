/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const baseURL = process.env.KLARNA_ARRIVAL_TEST_BASE_URL;

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(`Klarna does not interrupt a new visit (${name})`, { skip: !baseURL, timeout: 60000 }, async () => {
    const origin = new URL(baseURL).origin;
    const browser = await engine.launch();
    try {
      await Promise.all([390, 820, 1440].map(async width => {
        const context = await browser.newContext({ viewport: { width, height: 1000 }, serviceWorkers: 'block' });
        try {
          await context.route('**/*', route => {
            const request = route.request();
            const url = new URL(request.url());
            if (url.origin !== origin || !['GET', 'HEAD'].includes(request.method())) return route.fulfill({ status: 204 });
            if (url.pathname === '/api/identity/klarna/status') {
              return route.fulfill({ json: { connected: false, available: true, originSupported: true } });
            }
            return route.continue();
          });
          const page = await context.newPage();
          const response = await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
          assert.ok(response.ok(), `storefront returned HTTP ${response.status()}`);
          await page.locator('main').first().waitFor();
          // The previous desktop offer could appear five seconds after hydration.
          await page.waitForTimeout(8000);
          assert.equal(await page.locator('[data-klarna-identity-modal]').count(), 0, `popup at ${width}px`);
        } finally {
          await context.close();
        }
      }));
    } finally {
      await browser.close();
    }
  });
}

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');

// Run against next start after a production build. The browser must parse the
// actual server HTML before React hydrates; a client-only fixture misses this.
const baseURL = process.env.HYDRATION_BASE_URL;
const paths = ['/uteguiden/sherpacore', '/uteguiden/hydroguard', '/kontaktskjema'];

for (const [engine, browserType] of [['chromium', chromium], ['webkit', webkit]]) {
  for (const width of [390, 1440]) {
    test(`${engine} ${width}px: article HTML hydrates and its accordion remains usable`, { skip: !baseURL }, async () => {
      const browser = await browserType.launch();
      try {
        const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
        // Rendering checks must never create production conversion events.
        await context.route('**/*', route => {
          const request = route.request(), url = new URL(request.url());
          if (!['GET', 'HEAD'].includes(request.method()) || request.resourceType() === 'ping' || /\/(?:tr|collect)\/?$/.test(url.pathname)) {
            return route.fulfill({ status: 204 });
          }
          return route.continue();
        });
        for (const pathname of paths) {
          const page = await context.newPage();
          const hydrationErrors = [];
          page.on('pageerror', error => { if (/Minified React|hydrat/i.test(error.message)) hydrationErrors.push(error.message); });
          page.on('console', message => { if (message.type() === 'error' && /hydrat|Minified React|cannot be a descendant/i.test(message.text())) hydrationErrors.push(message.text()); });
          const response = await page.goto(new URL(pathname, baseURL).href, { waitUntil: 'load' });
          assert.equal(response.status(), 200, pathname);
          if (pathname === '/uteguiden/sherpacore') {
            const question = page.getByRole('button', { name: 'Inneholder SherpaCore™ ull?', exact: true });
            await question.click();
            await page.getByText('Nei, stoffet består av 100 % polyester;', { exact: false }).waitFor({ state: 'visible' });
            assert.equal(await question.getAttribute('aria-expanded'), 'true');
            await question.click();
            assert.equal(await question.getAttribute('aria-expanded'), 'false');
          }
          await page.waitForTimeout(500);
          assert.deepEqual(hydrationErrors, [], pathname);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, pathname);
          await page.close();
        }
        await context.close();
      } finally { await browser.close(); }
    });
  }
}

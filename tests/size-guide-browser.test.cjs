/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { chromium, webkit } = require('playwright');

const baseURL = process.env.SIZE_GUIDE_BASE_URL;

for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  test(`Comfyrobe size guide opens without another script download (${engineName})`, { skip: !baseURL, timeout: 60_000 }, async () => {
    const browser = await engine.launch();
    try {
      for (const width of [390, 1440]) {
        const context = await browser.newContext({ viewport: { width, height: 844 } });
        await context.route('**/*', route => {
          const request = route.request();
          // Rendering the guide must never send checkout or telemetry requests.
          if (!['GET', 'HEAD'].includes(request.method()) || request.resourceType() === 'ping') return route.fulfill({ status: 204 });
          return route.continue();
        });
        const page = await context.newPage();
        page.setDefaultTimeout(10_000);
        await page.goto(new URL('/produkter/comfyrobe', baseURL).href, { waitUntil: 'load' });
        await page.waitForFunction(() => {
          const button = document.querySelector('button[data-track="OsCaravanSizeGuideOpen"]');
          return button && Object.keys(button).some(key => key.startsWith('__reactProps$') && typeof button[key]?.onClick === 'function');
        });
        // Reproduce an unavailable chunk after the product page has loaded.
        // The guide must remain available, including its first opening.
        await page.route('**/_next/static/**/*.js', route => route.abort('failed'));
        const trigger = page.locator('button[data-track="OsCaravanSizeGuideOpen"]').first();
        await trigger.click();
        const dialog = page.getByRole('dialog', { name: 'Størrelsesguide', exact: true });
        await dialog.waitFor();
        assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
        assert.equal(await dialog.getByRole('region', { name: 'Måletabell for Comfyrobe-størrelser' }).count(), 1);
        assert.deepEqual(await dialog.getByRole('columnheader').allTextContents(), ['Måling', 'XS', 'M/L', 'XL']);
        assert.doesNotMatch(await page.locator('body').innerText(), /Kunne ikke laste størrelsesguiden/);
        const bounds = await dialog.boundingBox();
        assert.ok(bounds.x >= -1 && bounds.y >= -1 && bounds.x + bounds.width <= width + 1 && bounds.y + bounds.height <= 845);
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(await trigger.evaluate(element => element === document.activeElement), true);
        await trigger.click();
        await dialog.waitFor();
        await dialog.getByRole('button', { name: 'Lukk', exact: true }).last().click();
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(await trigger.evaluate(element => element === document.activeElement), true);
        await context.close();
      }
    } finally {
      await browser.close();
    }
  });
}

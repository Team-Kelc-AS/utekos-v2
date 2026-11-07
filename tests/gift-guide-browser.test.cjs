/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { chromium, webkit } = require('playwright');
const baseURL = process.env.GIFT_GUIDE_BASE_URL;

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(`gift guide renders directly and keeps its theme scoped (${name})`, {
    skip: !baseURL, timeout: 90_000,
  }, async () => {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage();
      await page.addInitScript(() => sessionStorage.setItem('utekos:klarna-arrival-dismissed:v1', '1'));
      for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(viewport);
        const response = await page.goto(new URL('/gaveguide', baseURL).href, { waitUntil: 'domcontentloaded' });
        assert.equal(response.status(), 200);
        assert.equal(new URL(page.url()).pathname, '/gaveguide');
        await page.evaluate(() => document.fonts.ready);
        const heading = page.locator('#gift-hero-heading');
        await heading.waitFor({ state: 'visible' });
        await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('#gift-hero-heading').parentElement).opacity) === 1);
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://utekos.no/gaveguide');
        await page.waitForFunction(() => Array.from(document.querySelectorAll('[data-gift-hero] img')).every(image => image.complete && image.naturalWidth > 0));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.locator('#gift-products-heading').waitFor({ state: 'visible' });
        assert.ok(await page.locator('nav[aria-label="Produktvarianter"] a').count() > 0);
        const giftColor = await page.locator('body > header').evaluate(element => getComputedStyle(element).backgroundColor);
        assert.equal(giftColor, 'rgb(124, 32, 43)');
        await page.screenshot({ path: `/tmp/utekos-gaveguide-${name}-${viewport.width}.png` });
        if (viewport.width === 1440) {
          await page.getByRole('link', { name: 'Finn julegaven', exact: true }).click();
          await page.waitForURL(url => url.hash === '#julegaver');
          assert.equal(new URL(page.url()).hash, '#julegaver');
        }
        await page.getByRole('link', { name: 'Utekos – til forsiden', exact: true }).click();
        await page.waitForURL(new URL('/', baseURL).href);
        await page.waitForFunction(() => getComputedStyle(document.querySelector('body > header')).backgroundColor !== 'rgb(124, 32, 43)');
      }
    } finally {
      await browser.close();
    }
  });
}

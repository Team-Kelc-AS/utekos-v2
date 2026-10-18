import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const origin = process.env.PRODUCTS_TEST_ORIGIN ?? 'http://localhost:3000';
for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${origin}/produkter`, { waitUntil: 'networkidle' });
      const rows = page.locator('[data-product-row]');
      const original = await rows.evaluateAll((elements) => elements.map((row) => ({
        id: row.dataset.productRow,
        variants: [...row.querySelectorAll('[data-variant-card]')].map((card) => card.getAttribute('data-variant-card')),
      })));
      assert.ok(original.length > 0);
      const unhoveredWish = rows.first().getByRole('button', { name: /Ønskeliste:/ }).first();
      assert.equal(await unhoveredWish.getAttribute('aria-pressed'), 'false');
      assert.equal(await unhoveredWish.locator('svg').nth(1).evaluate((el) => getComputedStyle(el).opacity), '0');
      assert.equal(await rows.first().locator('[data-slot=carousel-item]').first().evaluate((el) => getComputedStyle(el).opacity), '1');
      const waiting = page.locator('[data-row-motion=waiting]').first();
      await waiting.waitFor();
      const rowId = await waiting.getAttribute('data-product-row');
      const row = page.locator(`[data-product-row="${rowId}"]`);
      await row.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await page.waitForFunction((id) => document.querySelector(`[data-product-row="${id}"]`)?.getAttribute('data-row-motion') === 'playing', rowId);
      assert.ok(await row.evaluate((el) => el.getAnimations({ subtree: true }).length > 0));
      await row.getByRole('button', { name: /Ønskeliste:/ }).first().focus();
      assert.equal(await row.getAttribute('data-row-motion'), null);
      assert.equal(await row.locator('[data-slot=carousel-item]').first().evaluate((el) => getComputedStyle(el).opacity), '1');
      for (let index = 0; index < await rows.count(); index++) {
        await rows.nth(index).scrollIntoViewIfNeeded();
        await page.waitForTimeout(760);
      }
      assert.deepEqual(await rows.evaluateAll((elements) => elements.map((element) => ({
        id: element.dataset.productRow,
        variants: [...element.querySelectorAll('[data-variant-card]')].map((card) => card.getAttribute('data-variant-card')),
      }))), original);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await rows.first().scrollIntoViewIfNeeded();
      const buy = rows.first().getByRole('button', { name: /Legg .* i handlekurv/ }).first();
      await buy.hover();
      await page.waitForTimeout(250);
      assert.notEqual(await buy.evaluate((el) => getComputedStyle(el).transform), 'none');
      await buy.evaluate((el) => el.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
      }, { once: true, capture: true }));
      await page.mouse.down();
      await page.waitForTimeout(240);
      assert.ok(await buy.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a < 1));
      // The one-shot click listener verifies press feedback without creating a cart.
      await page.mouse.up();
      const wishlist = rows.first().getByRole('button', { name: /Ønskeliste:/ }).first();
      await wishlist.hover();
      await page.waitForTimeout(300);
      assert.notEqual(await wishlist.evaluate((el) => getComputedStyle(el).transform), 'none');
      await page.getByRole('tooltip').filter({ hasText: 'Legg i ønskeliste' }).waitFor();
      assert.equal(await wishlist.locator('svg').nth(1).evaluate((el) => getComputedStyle(el).opacity), '1');
      if (width < 1280) {
        const next = rows.first().getByRole('button', { name: 'Neste variant' });
        const before = await rows.first().locator('[data-slot=carousel-content] > div').getAttribute('style');
        await next.click();
        await page.waitForTimeout(500);
        assert.notEqual(await rows.first().locator('[data-slot=carousel-content] > div').getAttribute('style'), before);
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('[data-row-motion=waiting]').count(), 0);
      assert.equal(await buy.evaluate((el) => getComputedStyle(el).transitionDuration), '0s');
      assert.deepEqual(errors, []);
      console.log(`${engineName} ${width}: row entry, focus, hover, press, carousel, reduced motion passed`);
      await page.close();
    }
    const noJs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
    await noJs.goto(`${origin}/produkter`, { waitUntil: 'networkidle' });
    assert.ok(await noJs.locator('[data-variant-card]').count() > 0);
    assert.equal(await noJs.locator('[data-row-motion]').count(), 0);
    assert.equal(await noJs.locator('[data-variant-card]').first().evaluate((el) => getComputedStyle(el).opacity), '1');
    await noJs.close();
    const reduced = await browser.newPage({ reducedMotion: 'reduce' });
    await reduced.goto(`${origin}/produkter`, { waitUntil: 'networkidle' });
    assert.equal(await reduced.locator('[data-row-motion]').count(), 0);
    await reduced.close();
    console.log(`${engineName}: no-JS and initial reduced motion passed`);
  } finally {
    await browser.close();
  }
}

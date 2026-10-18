import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium, webkit } from 'playwright';

// Foreground verification owns this production server and always stops it.
// Run after `pnpm run build`: node tests/header-menu.browser.mjs
const port = 3101;
const origin = process.env.MENU_TEST_ORIGIN ?? `http://localhost:${port}`;
const route = '/handlehjelp/storrelsesguide';
const server = process.env.MENU_TEST_ORIGIN ? null : spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
const ready = server ? new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Production server did not start')), 20_000);
  server.stdout.on('data', (data) => {
    if (data.toString().includes('Ready')) { clearTimeout(timeout); resolve(); }
  });
  server.once('exit', () => { clearTimeout(timeout); reject(new Error('Production server exited')); });
}) : Promise.resolve();
let browser;
try {
  await ready;
  for (const [name, engine] of Object.entries({ chromium, webkit })) {
    if (process.env.MENU_BROWSER && process.env.MENU_BROWSER !== name) continue;
    browser = await engine.launch({ headless: true });
    for (const width of [320, 390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const menu = page.getByRole('dialog', { name: 'Meny', exact: true });
      const trigger = page.getByRole('button', { name: 'Åpne meny', exact: true, includeHidden: true });
      const open = async () => { await trigger.click(); await menu.waitFor(); };
      const closed = async () => {
        await menu.waitFor({ state: 'detached' });
        assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
        await page.waitForFunction(() => document.body.style.overflow === '', undefined, { timeout: 1000 });
      };
      await page.goto(origin + route, { waitUntil: 'networkidle' });
      await open();
      // Immediately focus a staggered item: neither it nor its ancestor may be transparent.
      const summary = menu.getByRole('button', { name: 'Produkter', exact: true });
      await summary.focus();
      assert.equal(await summary.evaluate((el) => getComputedStyle(el.closest('li')).opacity), '1');
      assert.equal(await menu.evaluate((el) => getComputedStyle(el).opacity), '1');
      for (let i = 0; i < 24; i++) {
        await page.keyboard.press(i < 12 ? 'Tab' : 'Shift+Tab');
        await page.waitForFunction(() => document.querySelector('[role=dialog]')?.contains(document.activeElement), undefined, { timeout: 1000 });
      }
      await summary.hover();
      await page.waitForTimeout(220);
      assert.equal(await summary.evaluate((el) => getComputedStyle(el).textDecorationLine), 'none');
      assert.notEqual(await summary.evaluate((el) => getComputedStyle(el).transform), 'none');
      await summary.click();
      assert.equal(await summary.getAttribute('aria-expanded'), 'true');
      await menu.getByRole('link', { name: 'Alle produkter', exact: true }).waitFor();
      const panelId = await summary.getAttribute('aria-controls');
      const accordionPanel = page.locator(`[id="${panelId}"]`);
      assert.ok((await accordionPanel.evaluate((el) => getComputedStyle(el).transitionProperty)).includes('height'));
      // Observe a real intermediate height rather than only checking CSS declarations.
      await page.waitForTimeout(70);
      const dimensions = await accordionPanel.evaluate((el) => ({
        actual: el.getBoundingClientRect().height,
        target: parseFloat(getComputedStyle(el).getPropertyValue('--accordion-panel-height')),
      }));
      assert.ok(dimensions.actual > 0 && dimensions.actual < dimensions.target, JSON.stringify(dimensions));
      await summary.click();
      // Reverse the transition before it finishes: final state must match the trigger.
      await summary.evaluate((el) => el.click());
      assert.equal(await summary.getAttribute('aria-expanded'), 'true');
      await page.waitForTimeout(300);
      assert.ok(await accordionPanel.evaluate((el) => el.getBoundingClientRect().height > 0));
      const nestedLink = menu.getByRole('link', { name: 'Alle produkter', exact: true });
      await nestedLink.hover();
      assert.equal(await nestedLink.evaluate((el) => getComputedStyle(el).textDecorationLine), 'none');
      await summary.focus();
      await page.keyboard.press('Enter');
      await accordionPanel.waitFor({ state: 'detached' });
      await page.keyboard.press('Escape');
      await closed();
      assert.ok(await trigger.evaluate((el) => el === document.activeElement));
      // Repeat and close while entry is still in progress, without locator stability waits.
      for (let repeat = 0; repeat < 3; repeat++) {
        await open();
        await menu.getByRole('button', { name: 'Lukk meny' }).evaluate((el) => el.click());
        await closed();
      }
      if (width > 384) {
        await open();
        await page.mouse.click(width - 8, 450);
        await closed();
      }
      await open();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      // A modified link click should not dismiss the dialog.
      await menu.getByRole('link', { name: 'Utekos – til forsiden' }).evaluate((el) => {
        el.addEventListener('click', (event) => event.preventDefault(), { once: true });
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
      });
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
      // Real Next navigation should dismiss the modal without holding up the route change.
      const destination = menu.locator('nav > ul > li > a').first();
      const href = await destination.getAttribute('href');
      await destination.click();
      await page.waitForURL(origin + href);
      await closed();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open();
      assert.equal(await menu.evaluate((el) => getComputedStyle(el).opacity), '1');
      assert.equal(await menu.evaluate((el) => el.getAnimations({ subtree: true }).length), 0);
      await page.keyboard.press('Escape');
      await closed();
      assert.deepEqual(errors, [], `${name} ${width}: browser errors`);
      console.log(`${name} ${width}: navigation, focus, interruption, reduced motion passed`);
      await page.close();
    }
    const touch = await browser.newPage({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
    await touch.goto(origin + route, { waitUntil: 'networkidle' });
    await touch.getByRole('button', { name: 'Åpne meny', exact: true }).tap();
    const touchTrigger = touch.getByRole('dialog', { name: 'Meny', exact: true }).getByRole('button', { name: 'Produkter', exact: true });
    await touchTrigger.tap();
    assert.equal(await touchTrigger.getAttribute('aria-expanded'), 'true');
    await touchTrigger.tap();
    await touch.waitForTimeout(300);
    assert.equal(await touchTrigger.getAttribute('aria-expanded'), 'false');
    await touchTrigger.evaluate((el) => new Promise((resolve, reject) => {
      const deadline = performance.now() + 1000;
      function settled() {
        if (getComputedStyle(el).transform === 'none') resolve();
        else if (performance.now() > deadline) reject(new Error('Touch press style did not settle'));
        else requestAnimationFrame(settled);
      }
      settled();
    }));
    await touch.close();
    console.log(`${name}: touch accordion and non-sticky hover passed`);
    // Delayed lazy chunk must expose the existing loading status.
    const slow = await browser.newPage();
    await slow.goto(origin + route, { waitUntil: 'networkidle' });
    await slow.route('**/_next/static/chunks/*.js', async (request) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await request.continue();
    });
    await slow.getByRole('button', { name: 'Åpne meny', exact: true }).click();
    await slow.getByRole('status').filter({ hasText: 'Åpner meny' }).waitFor();
    await slow.getByRole('dialog', { name: 'Meny', exact: true }).waitFor();
    await slow.keyboard.press('Escape');
    await slow.getByRole('dialog', { name: 'Meny', exact: true }).waitFor({ state: 'detached' });
    await slow.close();
    // Native animation failures must still leave a working menu and dismissible overlay.
    const failure = await browser.newPage();
    await failure.addInitScript(() => { Element.prototype.animate = () => { throw new Error('Injected animation failure'); }; });
    await failure.goto(origin + route, { waitUntil: 'networkidle' });
    await failure.getByRole('button', { name: 'Åpne meny', exact: true }).click();
    const failedMenu = failure.getByRole('dialog', { name: 'Meny', exact: true });
    await failedMenu.waitFor();
    assert.equal(await failedMenu.evaluate((el) => getComputedStyle(el).opacity), '1');
    await failure.keyboard.press('Escape');
    await failedMenu.waitFor({ state: 'detached' });
    await failure.close();
    console.log(`${name}: slow loading and animation failure passed`);
    await browser.close();
    browser = undefined;
  }
} finally {
  await browser?.close();
  if (server && server.exitCode === null && server.signalCode === null) {
    const exited = new Promise((resolve) => server.once('exit', resolve));
    server.kill();
    await exited;
  }
}

/* eslint-disable @typescript-eslint/no-require-imports */
// Actual local storefront; all provider requests and mutations are intercepted.
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const baseURL = process.env.KLARNA_ARRIVAL_TEST_BASE_URL;
const title = 'Meld deg inn nå og få gratis frakt på din neste ordre.';
const sdk = `export async function KlarnaSDK(){const events={};return {Identity:{on(name,fn){events[name]=fn},button(config){window.__klarnaButtons??=[];window.__klarnaButtons.push(config);const callbacks={};let host;return {on(name,fn){callbacks[name]=fn},mount(container){host=document.createElement('klarna-identity-button');const button=document.createElement('button');button.textContent='Fortsett med Klarna';button.style.cssText='width:100%;height:100%;border:0;border-radius:999px;font:500 20px sans-serif;background:'+(config.theme==='light'?'#f9f8f5':'#0b051d')+';color:'+(config.theme==='light'?'#0b051d':'#fff');button.onclick=async()=>{callbacks.click?.();await events.signin?.({idToken:'fixture-token-'.repeat(10)})};host.append(button);container.replaceChildren(host);callbacks.ready?.()},unmount(){host?.remove()}}}}}}`;

async function fixture(engine, width, overrides = {}) {
  const browser = await engine.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height: 1000 }, serviceWorkers: 'block' });
  const state = { connected: false, available: true, originSupported: true, ...overrides };
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === '/api/identity/klarna/status') return route.fulfill({ json: state });
    if (url.pathname === '/api/identity/klarna/prepare') return route.fulfill({ json: { clientId: 'klarna_fixture_client', scope: 'openid profile:name profile:email profile:phone profile:billing_address', redirectUri: new URL('/klarna/identity/callback', baseURL).href } });
    if (url.pathname === '/api/identity/klarna/complete') { state.connected = true; return route.fulfill({ json: { returnTo: '/' } }); }
    if (url.pathname === '/api/identity/klarna/prospect') return route.fulfill({ json: { profile: null, matching: null } });
    if (url.href === 'https://js.klarna.com/web-sdk/v2/klarna.mjs') return route.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: sdk });
    if (url.origin !== new URL(baseURL).origin || !['GET', 'HEAD'].includes(request.method())) return route.fulfill({ status: 204 });
    return route.continue();
  });
  return { browser, page, state, errors };
}

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(`arrival offer geometry, themes, login and dismissal (${name})`, { skip: !baseURL, timeout: 120000 }, async () => {
    for (const width of name === 'chromium' ? [320, 390, 760, 761, 1440] : [390, 1440]) {
      const f = await fixture(engine, width);
      try {
        await f.page.goto(baseURL, { waitUntil: 'domcontentloaded' });
        const dialog = f.page.getByRole('dialog', { name: title, exact: true });
        await f.page.locator('body').waitFor();
        // The timer starts after hydration, so the offer can never precede 2s.
        const seenAt = await f.page.evaluate(() => performance.now());
        if (seenAt < 1700) assert.equal(await dialog.count(), 0);
        await dialog.waitFor();
        await dialog.getByRole('button', { name: 'Fortsett med Klarna', exact: true }).waitFor();
        const metrics = await dialog.evaluate(el => {
          const r = el.getBoundingClientRect(), s = getComputedStyle(el);
          const image = el.querySelector('img');
          return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, radius: s.borderRadius,
            background: s.backgroundImage, color: s.color, fill: s.backgroundColor, scroll: el.scrollHeight, client: el.clientHeight,
            src: image.getAttribute('src'), loaded: image.complete && image.naturalWidth > 0,
            closeColor: getComputedStyle(el.querySelector('button[aria-label="Lukk vinduet"] svg')).color,
            theme: window.__klarnaButtons.at(-1).theme, now: performance.now(), viewport: innerHeight };
        });
        assert.ok(metrics.now >= 2000);
        assert.ok(metrics.loaded);
        assert.equal(metrics.height, width <= 760 ? 240 : 329);
        assert.ok(metrics.scroll <= metrics.client + 1, JSON.stringify(metrics));
        if (width <= 760) {
          assert.equal(metrics.width, width); assert.equal(metrics.x, 0); assert.equal(metrics.bottom, metrics.viewport);
          assert.equal(metrics.radius, '0px'); assert.equal(metrics.background, 'none');
          assert.equal(metrics.fill, 'rgb(240, 238, 233)'); assert.equal(metrics.color, 'rgb(1, 11, 10)');
          assert.equal(metrics.closeColor, metrics.color);
          assert.equal(metrics.theme, 'default'); assert.match(metrics.src, /black-plus/);
        } else {
          assert.ok(Math.abs(metrics.width - 609.4) < .1); assert.ok(Math.abs(metrics.x - (width - 609.4) / 2) < .5);
          assert.ok(Math.abs(metrics.y - (metrics.viewport - 329) / 2) < .1);
          assert.equal(metrics.theme, 'light'); assert.match(metrics.src, /white-plus/);
          assert.match(metrics.background, /90deg, rgb\(0, 18, 17\), rgb\(1, 11, 10\)/);
        }
        await f.page.screenshot({ path: `outputs/klarna-arrival-${name}-${width}.png` });
        if (width === 390) {
          await dialog.getByRole('button', { name: 'Fortsett med Klarna', exact: true }).click();
          await dialog.waitFor({ state: 'detached' });
          assert.equal(f.state.connected, true);
        } else {
          await f.page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
          await f.page.reload({ waitUntil: 'domcontentloaded' });
          await f.page.waitForTimeout(2300);
          assert.equal(await dialog.count(), 0);
        }
        assert.deepEqual(f.errors, []);
      } finally { await f.browser.close(); }
    }
  });
}

test('arrival offer respects connected/unavailable state and existing dialogs', { skip: !baseURL, timeout: 60000 }, async () => {
  for (const state of [{ connected: true }, { available: false }, { existingDialog: true }]) {
    const f = await fixture(chromium, 390, state);
    try {
      await f.page.goto(baseURL, { waitUntil: 'domcontentloaded' });
      if (state.existingDialog) await f.page.getByRole('button', { name: 'Åpne meny', exact: true }).click();
      await f.page.waitForTimeout(2500);
      assert.equal(await f.page.locator('[data-klarna-identity-modal]').count(), 0);
    } finally { await f.browser.close(); }
  }
});

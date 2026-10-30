/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { chromium, webkit } = require('playwright');
const baseURL = process.env.KLARNA_PREFERENCES_BASE_URL;
const empty = { emailMarketing: false, cartReminders: false, adMatching: false, comfyrobeSize: null, favoriteColor: null, interests: [] };

async function fixture(engine, { width = 390, profile = null, connected = true, malformed = false } = {}) {
  const browser = await engine.launch();
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const state = { profile, connected, malformed, saves: 0, failSave: false, delayState: 0 };
  await context.route('**/*', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (path === '/api/identity/klarna/status') return route.fulfill({ json: { available: true, originSupported: true, connected: state.connected } });
    if (path === '/api/identity/klarna/prospect') {
      const input = request.postDataJSON();
      if (input.action === 'state') { if (state.delayState) await new Promise(resolve => setTimeout(resolve, state.delayState)); return route.fulfill({ json: state.malformed ? {} : { profile: state.profile } }); }
      state.saves++;
      if (state.failSave) return route.fulfill({ status: 503, json: { error: 'test failure' } });
      state.profile = { ...input }; delete state.profile.action;
      return route.fulfill({ json: { saved: true, shopifySync: 'complete' } });
    }
    if (path === '/api/klarna/client-config') return route.fulfill({ json: { client_id: 'klarna_live_client_fixture', environment: 'production' } });
    if (request.url().startsWith('https://x.klarnacdn.net/kp/lib/v1/api.js')) return route.fulfill({ contentType: 'text/javascript', body: `window.Klarna={Payments:{Buttons:{init:()=>({load:(config,done)=>{const host=document.querySelector(config.container);host.innerHTML='<button type="button" aria-label="Klarna Express">Klarna Express</button>';done({show_form:true})}})}}};window.klarnaAsyncCallback?.();` });
    if (path === '/api/identity/klarna/complete') { state.connected = true; return route.fulfill({ json: { returnTo: '/handlehjelp/preferanser' } }); }
    if (path === '/api/identity/klarna/prepare') return route.fulfill({ json: { clientId: 'klarna_live_client_fixture', scope: 'openid email', redirectUri: new URL('/klarna/identity/callback', baseURL).href } });
    if (request.url().startsWith('https://js.klarna.com/web-sdk/v2/klarna.mjs')) return route.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: `export async function KlarnaSDK(){const events={};return {Identity:{on(name,fn){events[name]=fn},button(){const callbacks={};return {on(name,fn){callbacks[name]=fn},mount(host){const button=document.createElement('button');button.type='button';button.textContent='Fortsett med Klarna';button.onclick=async()=>{callbacks.click?.();await events.signin?.({idToken:'fixture-token-'.repeat(10)})};host.replaceChildren(button);callbacks.ready?.()},unmount(){}}}}}}` });
    if (!['GET', 'HEAD'].includes(request.method()) || request.resourceType() === 'ping') return route.fulfill({ status: 204 });
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  return { page, context, state, errors, close: () => browser.close() };
}
async function product(page, path = '/produkter/comfyrobe') {
  await page.goto(new URL(path, baseURL).href, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-klarna-connected-express]').waitFor();
}
async function openMenuPreferences(page) {
  await page.getByRole('button', { name: 'Åpne meny', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'Meny', exact: true });
  await menu.getByRole('button', { name: 'Mine preferanser og samtykker', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Mine preferanser og samtykker', exact: true });
  await dialog.locator('[data-slot="questionnaire"]').waitFor();
  return dialog;
}
for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  test(`compact product entry, themed modal, separate interests, save and suppress (${engineName})`, { skip: !baseURL, timeout: 150000 }, async () => {
    for (const width of engineName === 'chromium' ? [320, 390, 1440] : [390]) {
      const f = await fixture(engine, { width }); const { page, state } = f;
      try {
        await product(page);
        const entry = page.locator('[data-klarna-product-preferences]'); await entry.scrollIntoViewIfNeeded();
        const metrics = await entry.locator('button').evaluate(el => {
          const style = getComputedStyle(el), r = el.getBoundingClientRect();
          const guide = document.querySelector('[data-tracking-size-guide]').getBoundingClientRect();
          return { height: r.height, top: r.top, guideBottom: guide.bottom, pt: style.paddingTop, pb: style.paddingBottom, image: style.backgroundImage, pageImage: getComputedStyle(document.querySelector('main[data-product-theme]')).backgroundImage };
        });
        assert.ok(metrics.height <= 72); assert.ok(metrics.top >= metrics.guideBottom); assert.equal(metrics.pt, metrics.pb); assert.equal(metrics.image, metrics.pageImage);
        assert.equal(await page.getByText('Gjør Utekos litt mer relevant for deg. Alle valgene er frivillige.', { exact: true }).count(), 0);
        assert.equal(await page.locator('[class*="purchaseActions"] [data-klarna-preferences]').count(), 0);
        await entry.getByRole('button').click();
        const dialog = page.getByRole('dialog', { name: 'Mine preferanser og samtykker', exact: true });
        await dialog.getByText('Spørsmål 1 av 4', { exact: true }).waitFor();
        await dialog.getByRole('radio', { name: 'S/XS', exact: true }).check(); await dialog.getByRole('button', { name: 'Neste', exact: true }).click();
        await dialog.getByRole('radio', { name: 'Fjellblå', exact: true }).check(); await dialog.getByRole('button', { name: 'Neste', exact: true }).click();
        await dialog.getByRole('checkbox', { name: 'Camping', exact: true }).check();
        assert.equal(await dialog.getByRole('checkbox', { name: 'Bobil', exact: true }).isChecked(), false);
        await dialog.getByRole('checkbox', { name: 'Bobil', exact: true }).check();
        await dialog.getByRole('checkbox', { name: 'Annet', exact: true }).check();
        assert.equal(await dialog.getByText('Camping og bobil', { exact: true }).count(), 0);
        await dialog.getByRole('button', { name: 'Forrige', exact: true }).click();
        assert.equal(await dialog.getByRole('radio', { name: 'Fjellblå', exact: true }).isChecked(), true);
        await dialog.getByRole('button', { name: 'Neste', exact: true }).click(); await dialog.getByRole('button', { name: 'Neste', exact: true }).click();
        assert.equal(state.saves, 0);
        await dialog.getByRole('button', { name: 'Lagre valgene mine', exact: true }).click();
        await entry.waitFor({ state: 'detached' });
        const buy = page.getByRole('button', { name: 'Kjøp nå', exact: true }).first();
        await buy.focus(); assert.equal(await buy.evaluate(el => document.activeElement === el && !el.closest('[inert]')), true);
        assert.deepEqual(state.profile, { ...empty, comfyrobeSize: 'XS', favoriteColor: 'Fjellblå', interests: ['camping', 'bobil', 'annet'] });
        assert.equal(state.saves, 1);
        await page.locator('footer [data-klarna-saved-preferences]').waitFor();
        await page.reload({ waitUntil: 'domcontentloaded' }); await page.locator('[data-klarna-connected-express]').waitFor();
        assert.equal(await page.locator('[data-klarna-product-preferences]').count(), 0);
        const edit = await openMenuPreferences(page);
        await edit.getByText('Spørsmål 1 av 4', { exact: true }).waitFor();
        await page.keyboard.press('Escape'); await edit.waitFor({ state: 'hidden' });
        assert.equal(await page.getByRole('dialog', { name: 'Meny', exact: true }).isVisible(), true);
        assert.deepEqual(f.errors, []);
      } finally { await f.close(); }
    }
  });
}
test('page and footer links; saved empty choices stay away from purchase; retry malformed state and save failure', { skip: !baseURL, timeout: 90000 }, async () => {
  const f = await fixture(chromium, { profile: empty }); const { page, state } = f;
  try {
    await product(page);
    await page.locator('footer [data-klarna-saved-preferences]').waitFor();
    const links = page.locator('footer a[href="/handlehjelp/preferanser"]'); assert.equal(await links.count(), 2);
    assert.equal(await page.locator('[data-klarna-product-preferences]').count(), 0);
    await page.goto(new URL('/handlehjelp/preferanser', baseURL).href);
    const form = page.locator('main [data-klarna-preferences]');
    await form.getByRole('checkbox', { name: 'Camping', exact: true }).check(); assert.equal(await form.getByRole('checkbox', { name: 'Bobil', exact: true }).isChecked(), false);
    state.failSave = true; await form.getByRole('button', { name: 'Lagre valgene mine' }).click(); await form.getByRole('alert').waitFor();
    state.failSave = false; await form.getByRole('button', { name: 'Lagre valgene mine' }).click(); await form.getByRole('status').filter({ hasText: 'Valgene er lagret.' }).waitFor();
    assert.deepEqual(state.profile.interests, ['camping']);
    state.malformed = true; await page.reload(); await page.getByRole('alert').filter({ hasText: 'Valgene kunne ikke hentes.' }).waitFor();
    state.malformed = false; await page.getByRole('button', { name: 'Hent valgene på nytt' }).click(); await form.getByRole('checkbox', { name: 'Camping', exact: true }).waitFor();
    assert.equal(await form.getByRole('checkbox', { name: 'Camping', exact: true }).isChecked(), true);
    assert.deepEqual(f.errors, []);
  } finally { await f.close(); }
});
test('not logged in: no Express or preference prompt at purchase, menu/page offer Klarna login', { skip: !baseURL, timeout: 60000 }, async () => {
  const f = await fixture(chromium, { connected: false }); const { page } = f;
  try {
    await page.goto(new URL('/produkter/comfyrobe', baseURL).href); await page.getByRole('button', { name: 'Kjøp nå', exact: true }).first().waitFor();
    assert.equal(await page.locator('[data-klarna-connected-express]').count(), 0); assert.equal(await page.locator('[data-klarna-product-preferences]').count(), 0);
    await page.goto(new URL('/handlehjelp/preferanser', baseURL).href); await page.getByRole('button', { name: 'Fortsett med Klarna', exact: true }).waitFor();
    assert.equal(await page.locator('main [data-slot="questionnaire"]').count(), 0); assert.deepEqual(f.errors, []);
  } finally { await f.close(); }
});

test('variant gradients, menu hover, borders and modal geometry follow the selected product', { skip: !baseURL, timeout: 120000 }, async () => {
  const images = new Set(), borders = new Set();
  for (const [path, theme] of [['/produkter/comfyrobe', 'comfyrobe'], ['/produkter/utekos-mikrofiber?farge=fjellbla', 'patriot-blue'], ['/produkter/utekos-mikrofiber?farge=vargnatt', 'vargnatt']]) {
    const f = await fixture(chromium); const { page } = f;
    try {
      await page.goto(new URL(path, baseURL).href, { waitUntil: 'domcontentloaded' });
      await page.locator('[data-klarna-product-preferences]').waitFor();
      assert.equal(await page.locator('main[data-product-theme]').getAttribute('data-product-theme'), theme);
      const expected = await page.locator('main[data-product-theme]').evaluate(el => getComputedStyle(el).backgroundImage); images.add(expected);
      const menuButton = page.getByRole('button', { name: 'Åpne meny', exact: true }); await menuButton.hover();
      assert.equal(await menuButton.evaluate(el => getComputedStyle(el).backgroundImage), expected);
      const dialog = await openMenuPreferences(page);
      const geometry = await dialog.evaluate(el => {
        const r = el.getBoundingClientRect(), css = getComputedStyle(el);
        return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, image: css.backgroundImage, border: css.borderTopColor, scroll: el.scrollWidth, client: el.clientWidth };
      });
      borders.add(geometry.border); assert.equal(geometry.image, expected); assert.ok(Math.abs(geometry.x - 195) < 1); assert.ok(Math.abs(geometry.y - 450) < 1); assert.ok(geometry.scroll <= geometry.client + 1);
      await dialog.screenshot({ path: `/tmp/utekos-preferences-modal-${theme}.png` });
      await page.addStyleTag({ content: 'html { font-size: 200% !important }' });
      for (let step = 1; step < 4; step++) { await dialog.getByText(`Spørsmål ${step} av 4`, { exact: true }).waitFor(); await dialog.getByRole('button', { name: 'Neste', exact: true }).click(); }
      await dialog.getByRole('button', { name: 'Lagre valgene mine', exact: true }).scrollIntoViewIfNeeded();
      assert.ok(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
      await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' }); assert.deepEqual(f.errors, []);
    } finally { await f.close(); }
  }
  assert.equal(images.size, 3); assert.ok(borders.size >= 2);
});


test('login refresh waits for the saved profile before showing an editor', { skip: !baseURL, timeout: 60000 }, async () => {
  const f = await fixture(chromium, { connected: false, profile: { ...empty, comfyrobeSize: 'XL', interests: ['bobil'] } });
  try {
    f.state.delayState = 200;
    await f.page.goto(new URL('/handlehjelp/preferanser', baseURL).href);
    await f.page.getByRole('button', { name: 'Fortsett med Klarna', exact: true }).click();
    const form = f.page.locator('main [data-klarna-preferences]');
    await form.getByRole('checkbox', { name: 'Bobil', exact: true }).waitFor();
    assert.equal(await form.getByRole('checkbox', { name: 'Bobil', exact: true }).isChecked(), true);
    assert.equal(await form.getByRole('checkbox', { name: 'Camping', exact: true }).isChecked(), false);
    assert.ok((await form.getByLabel('Foretrukket Comfyrobe™-passform', { exact: true }).textContent()).includes('L/XXL'));
    assert.equal(f.state.saves, 0); assert.deepEqual(f.errors, []);
  } finally { await f.close(); }
});

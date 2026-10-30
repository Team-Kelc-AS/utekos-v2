/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { chromium, webkit } = require('playwright');
const baseURL = process.env.KLARNA_PREFERENCES_BASE_URL;
const empty = { emailMarketing: false, cartReminders: false, adMatching: false, comfyrobeSize: null, favoriteColor: null, interests: [] };

async function fixture(browser, width, handlePreferences) {
  const context = await browser.newContext({ viewport: { width, height: 1000 } });
  await context.route('**/*', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/identity/klarna/status') return route.fulfill({ json: { available: true, originSupported: true, connected: true } });
    if (path === '/api/identity/klarna/prospect') return handlePreferences(route, request.postDataJSON());
    if (!['GET', 'HEAD'].includes(request.method()) || request.resourceType() === 'ping') return route.fulfill({ status: 204 });
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.goto(new URL('/produkter/comfyrobe', baseURL).href, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-klarna-identity-offer]').first().scrollIntoViewIfNeeded();
  const panel = page.locator('[data-klarna-preferences]').first();
  const trigger = panel.getByRole('button', { name: 'Mine preferanser og samtykker', exact: true });
  await trigger.waitFor();
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  await trigger.focus();
  await page.keyboard.press('Enter');
  return { context, page, panel, trigger };
}

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(`preferences stay contained, save, and reload (${name})`, { skip: !baseURL, timeout: 120000 }, async () => {
    const browser = await engine.launch();
    try {
      for (const [width, scale] of (name === 'chromium' ? [[320, 1], [390, 1], [768, 1], [1440, 1], [390, 2]] : [[390, 1]])) {
        let stored = null;
        let saves = 0;
        const { context, page, panel, trigger } = await fixture(browser, width, async (route, input) => {
          if (input.action === 'state') return route.fulfill({ json: { profile: stored } });
          saves++;
          stored = { ...input };
          delete stored.action;
          return route.fulfill({ json: { saved: true, shopifySync: 'complete' } });
        });
        try {
          await panel.getByRole('button', { name: 'Lagre valgene mine' }).waitFor();
          assert.equal(saves, 0);
          if (scale === 2) await page.addStyleTag({ content: 'html { font-size: 200% !important }' });
          await panel.getByLabel('Foretrukket Comfyrobe™-passform', { exact: true }).click();
          await page.getByRole('option', { name: 'S/XS', exact: true }).click();
          await panel.getByLabel('Favorittfarge fra utvalget vårt', { exact: true }).click();
          await page.getByRole('option', { name: 'Fjellblå', exact: true }).click();
          await panel.getByRole('checkbox', { name: 'Hytte', exact: true }).check();
          await panel.getByRole('checkbox', { name: 'Annet', exact: true }).check();
          await panel.getByRole('button', { name: 'Lagre valgene mine' }).click();
          await panel.getByRole('status').filter({ hasText: 'Valgene er lagret.' }).waitFor();
          assert.deepEqual(stored, { ...empty, comfyrobeSize: 'XS', favoriteColor: 'Fjellblå', interests: ['hytte', 'annet'] });
          assert.equal(saves, 1);
          assert.ok(await panel.getByText('Utekos kan bruke mine Klarna-opplysninger til å vise personlig tilpasset innhold.', { exact: true }).isVisible());
          const geometry = await trigger.evaluate(el => {
            const trigger = el.getBoundingClientRect(), icon = el.lastElementChild.getBoundingClientRect();
            const panel = el.closest('[data-klarna-preferences]');
            return { iconRight: icon.right, triggerRight: trigger.right, scroll: panel.scrollWidth, client: panel.clientWidth };
          });
          assert.ok(geometry.iconRight <= geometry.triggerRight);
          assert.ok(geometry.scroll <= geometry.client + 1);
          await page.reload({ waitUntil: 'domcontentloaded' });
          await page.locator('[data-klarna-identity-offer]').first().scrollIntoViewIfNeeded();
          await trigger.waitFor();
          assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
          await trigger.click();
          await panel.getByRole('checkbox', { name: 'Hytte', exact: true }).waitFor();
          assert.equal(await panel.getByRole('checkbox', { name: 'Hytte', exact: true }).isChecked(), true);
          assert.equal(await panel.getByRole('checkbox', { name: 'Annet', exact: true }).isChecked(), true);
          assert.equal(saves, 1);
        } finally { await context.close(); }
      }
    } finally { await browser.close(); }
  });
}

test('malformed state cannot overwrite stored preferences; load and save failures can be retried', { skip: !baseURL, timeout: 60000 }, async () => {
  const browser = await chromium.launch();
  let loads = 0, saves = 0, malformed = true;
  try {
    const { context, panel } = await fixture(browser, 390, async (route, input) => {
      if (input.action === 'state') { loads++; return route.fulfill({ json: malformed ? {} : { profile: empty } }); }
      if (++saves === 1) return route.fulfill({ status: 503, json: { error: 'unavailable' } });
      return route.fulfill({ json: { saved: true, shopifySync: 'pending' } });
    });
    try {
      await panel.getByRole('alert').filter({ hasText: 'Valgene kunne ikke hentes.' }).waitFor();
      assert.equal(await panel.getByRole('button', { name: 'Lagre valgene mine' }).count(), 0);
      malformed = false;
      await panel.getByRole('button', { name: 'Hent valgene på nytt' }).click();
      await panel.getByRole('button', { name: 'Lagre valgene mine' }).click();
      await panel.getByRole('alert').filter({ hasText: 'Valgene kunne ikke lagres.' }).waitFor();
      await panel.getByRole('button', { name: 'Lagre valgene mine' }).click();
      await panel.getByRole('status').filter({ hasText: 'Valgene er lagret. E-postvalget venter på synkronisering.' }).waitFor();
      assert.ok(loads >= 2);
      assert.equal(saves, 2);
    } finally { await context.close(); }
  } finally { await browser.close(); }
});

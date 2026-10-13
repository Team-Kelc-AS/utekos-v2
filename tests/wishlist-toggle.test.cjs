/* eslint-disable @typescript-eslint/no-require-imports */
// Real Toggle, wishlist persistence, modal and tracking runtime in Chromium.
// Every network request is intercepted; no provider or login is contacted.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require('esbuild');
const { chromium, expect } = require('playwright/test');
const { loadTypeScript } = require('./load-typescript.cjs');
const root = path.resolve(__dirname, '..');
const store = loadTypeScript('lib/wishlist/wishlistStore.ts');
let browser, script, css;

test.before(async () => {
  const result = await esbuild.build({
    stdin: { resolveDir: root, loader: 'tsx', contents: `
      import {createRoot} from 'react-dom/client';
      import {WishlistButton} from './src/assets/components/wishlist/WishlistButton';
      import {attachCommerceTracking} from './src/lib/tracking/runtime';
      import {subscribeStorefrontActions,emitStorefrontAction} from './src/lib/tracking/browser-events';
      const commerce = {currency:'NOK',value:800,gross_value:1000,tax_value:200,items:[{
        item_id:'1',product_id:'1',variant_id:'1',item_name:'Fixture product',product_handle:'test-product',
        quantity:1,unit_price:800,gross_unit_price:1000,tax_amount:200,tax_rate:.25,taxable:true,
        price_includes_tax:true,available_for_sale:true,currently_not_in_stock:false,quantity_available:10,
        selected_options:[],collection_ids:[],collection_titles:[]
      }]};
      window.actions=[];
      subscribeStorefrontActions(action=>window.actions.push({...action,persisted:JSON.parse(localStorage.getItem('utekos_wishlist_v1'))}));
      window.replay=()=>{const a=window.actions[0];emitStorefrontAction(a.name,a.detail)};
      attachCommerceTracking();
      const props={productId:'1',handle:'test-product',variantId:'1',title:'Fixture product',returnTo:'/produkter/test-product'};
      createRoot(document.getElementById('root')).render(<div data-tracking-commerce={JSON.stringify(commerce)}>
        <div id="card"><WishlistButton {...props} showHoverCard /></div>
        <div id="product"><WishlistButton {...props} showLabel /></div>
        <div id="variant"><WishlistButton {...props} /></div>
      </div>);
    ` },
    absWorkingDir: root, bundle: true, format: 'iife', platform: 'browser',
    jsx: 'automatic', outdir: '/tmp/utekos-wishlist-test', write: false,
    define: {
      'process.env.NEXT_PUBLIC_TRACKING_ENABLED': 'window.__trackingEnabled',
      'process.env.NEXT_PUBLIC_VERCEL_ENV': '"production"',
      'process.env.VERCEL_ENV': '"production"',
      'process.env.NODE_ENV': '"production"', 'process.env': '{}',
    },
  });
  script = result.outputFiles.find(f => f.path.endsWith('.js')).text;
  css = result.outputFiles.find(f => f.path.endsWith('.css')).text;
  browser = await chromium.launch();
});
test.after(async () => { await browser?.close(); });

async function fixture(t, trackingEnabled = true) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  t.after(() => context.close());
  const requests = [], forbidden = [], errors = [];
  t.after(() => { assert.deepEqual(forbidden, []); assert.deepEqual(errors, []); });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === 'https://utekos.no' && request.isNavigationRequest()) return route.fulfill({
      contentType: 'text/html', body: '<!doctype html><title>Wishlist fixture</title><div id="root"></div>',
    });
    if (url.origin === 'https://utekos.no' && url.pathname === '/api/identity/facebook/status')
      return route.fulfill({ json: { connected: true } });
    if (url.origin === 'https://utekos.no' && url.pathname.startsWith('/api/')) {
      requests.push({ path: url.pathname, body: request.postDataJSON() });
      if (url.pathname === '/api/meta/client-ip') return route.fulfill({ json: { client_ip_address: '192.0.2.1' } });
      if (url.pathname === '/api/meta/parameter-context') return route.fulfill({ json: { fbp: 'fb.1.1700000000000.123456789' } });
      return route.fulfill({ status: 202, json: { status: 'accepted' } });
    }
    if (url.pathname === '/favicon.ico') return route.fulfill({ status: 204 });
    forbidden.push(url.origin + url.pathname);
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('https://utekos.no/produkter/test-product');
  await page.evaluate(enabled => {
    window.__trackingEnabled = enabled ? 'true' : 'false';
    window.dataLayer = [];
    window.dataLayer.push = function (...entries) {
      for (const e of entries) if (e?.[0] === 'get' && typeof e[3] === 'function') e[3](e[2] === 'client_id' ? '123.456' : '789');
      return Array.prototype.push.apply(this, entries);
    };
  }, trackingEnabled);
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: script });
  await expect(page.locator('[data-slot=toggle]')).toHaveCount(3);
  return { page, events: () => requests.filter(r => r.body?.event_name === 'add_to_wishlist') };
}

test('all placements toggle together; add opens login and reports once, remove does neither, re-add gets a new mutation', async t => {
  const { page, events } = await fixture(t);
  const buttons = page.locator('[data-slot=toggle]');
  await page.locator('#card svg').first().click(); // Nested SVG target preserves commerce lookup.
  await expect(page.getByRole('dialog', { name: 'Utekos ønskeliste' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fortsett med e-post' })).toBeVisible();
  for (const button of await buttons.all()) await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => events().length).toBe(1);
  const action = await page.evaluate(() => window.actions[0]);
  assert.equal(action.name, 'utekos:wishlist-added');
  assert.equal(action.persisted.entries[0].mutationId, action.detail.mutationId);
  assert.equal(events()[0].body.custom_data.wishlist_mutation_id, action.detail.mutationId);
  assert.equal(events()[0].body.event_time, action.detail.eventTime);
  assert.deepEqual(events()[0].body.custom_data.items, action.detail.commerce.items);
  assert.equal(events()[0].body.custom_data.currency, 'NOK');
  assert.equal(events()[0].body.custom_data.value, 800);
  const sibling = await page.context().newPage();
  await sibling.goto('https://utekos.no/produkter/test-product');
  await sibling.evaluate(() => { window.__trackingEnabled = 'false'; });
  await sibling.addStyleTag({ content: css });
  await sibling.addScriptTag({ content: script });
  await expect(sibling.locator('#card button')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Lukk', exact: true }).click();
  await page.locator('#product button').click();
  for (const button of await buttons.all()) await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(sibling.locator('#card button')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('utekos_wishlist_v1')).entries.length), 0);
  assert.equal(events().length, 1);
  await page.locator('#variant button').focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(() => events().length).toBe(2);
  await expect(sibling.locator('#card button')).toHaveAttribute('aria-pressed', 'true');
  assert.notEqual(events()[0].body.custom_data.wishlist_mutation_id, events()[1].body.custom_data.wishlist_mutation_id);
  await page.evaluate(() => window.replay());
  await expect.poll(() => page.evaluate(() => window.actions.length)).toBe(3);
  assert.equal(events().length, 2, 'runtime deduplicates replayed mutation');
  assert.equal(await page.evaluate(() => dataLayer.filter(e => e.event === 'add_to_wishlist').length), 2);
});

test('failed addition/removal retain persisted state and never send add_to_wishlist', async t => {
  const { page, events } = await fixture(t);
  await page.evaluate(() => { window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('Quota'); }; });
  const button = page.locator('#card button');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  assert.equal(await page.evaluate(() => window.actions.length), 0);
  assert.equal(events().length, 0);
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await button.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(() => events().length).toBe(1);
  await page.getByRole('button', { name: 'Lukk', exact: true }).click();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Quota'); }; });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  assert.equal(await page.evaluate(() => window.actions.length), 1);
  assert.equal(events().length, 1);
});

test('production tracking disabled still allows local wishlist without sending conversion events', async t => {
  const { page, events } = await fixture(t, false);
  await page.locator('#card button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('utekos_wishlist_v1')).entries.length), 1);
  assert.equal(events().length, 0);
  assert.equal(await page.evaluate(() => dataLayer.filter(e => e.event === 'add_to_wishlist').length), 0);
});

test('remove preserves other variants and a re-add creates a new mutation', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const input = { productId: '1', variantId: '1', storage, now: () => '2026-10-13T12:00:00.000Z' };
  store.addWishlistItem({ ...input, randomId: () => 'first' });
  store.addWishlistItem({ ...input, variantId: '2', randomId: () => 'other' });
  assert.equal(store.removeWishlistItem(input), true);
  assert.deepEqual(Array.from(store.readWishlistState(storage).entries, e => e.variantId), ['2']);
  assert.equal(store.removeWishlistItem(input), true);
  const added = store.addWishlistItem({ ...input, randomId: () => 'second' });
  assert.equal(added.mutationId, 'second');
  assert.equal(store.addWishlistItem(input).added, false);
});

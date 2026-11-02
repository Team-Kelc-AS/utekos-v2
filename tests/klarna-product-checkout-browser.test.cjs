/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { chromium, webkit } = require('playwright');
const base = process.env.KLARNA_PRODUCT_BASE_URL;
const money = amount => ({ amount: String(amount), currencyCode: 'NOK' });
const cart = {
  id: 'gid://shopify/Cart/fixture', checkout: { checkout_id: 'fixture', creation_revision: 'fixture' },
  totalQuantity: 1, subtotal: money(1990), total: money(1990), commerce: null,
  discountCodes: [], requiresStandardCheckout: false,
  lines: [{ id: 'fixture-line', variantId: 'gid://shopify/ProductVariant/46944403915000', quantity: 1,
    title: 'Utekos TechDown™', handle: 'utekos-techdown', variantTitle: 'Stor / Havdyp',
    selectedOptions: [], available: true, image: null, total: money(1990), commerce: null }],
};
const sdk = `window.__klarnaFixture={authorizations:[]};window.Klarna={Payments:{Buttons:{init:()=>({load:(options,done)=>{
  const button=document.createElement('button');button.type='button';button.textContent='Betal med Klarna';
  button.onclick=()=>options.on_click((settings,payload,callback)=>{window.__recordAuthorize();window.__klarnaFixture.authorizations.push({settings,payload});window.__klarnaFixture.cancel=callback});
  document.querySelector(options.container).replaceChildren(button);done({show_form:true});
}})}}};window.klarnaAsyncCallback?.();`;

async function fixture(engine, { width = 390, fallback = false, prepareError = false, checkoutError = false } = {}) {
  const browser = await engine.launch();
  try {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const state = { preparations: [], checkouts: [], adds: [], orders: 0, authorizations: 0, release: null, onPrepare: null, onAdd: null };
  await context.exposeBinding('__recordAuthorize', () => { state.authorizations++; });
  const currentCart = fallback ? { ...cart, requiresStandardCheckout: true, discountCodes: [{ code: 'FIXTURE', applicable: true }] } : cart;
  await context.addInitScript(() => sessionStorage.setItem('utekos:klarna-arrival-dismissed:v1', '1'));
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (request.url().startsWith('https://x.klarnacdn.net/kp/lib/v1/api.js')) return route.fulfill({ contentType: 'application/javascript', body: sdk });
    if (url.origin === 'https://checkout.example.test') return route.fulfill({ contentType: 'text/html', body: '<h1>Fixture checkout</h1>' });
    if (url.origin !== new URL(base).origin) return route.fulfill({ status: 204 });
    if (url.pathname === '/api/identity/klarna/status') return route.fulfill({ json: { available: true, connected: true, originSupported: false } });
    if (url.pathname === '/api/klarna/client-config') return route.fulfill({ json: { client_id: 'klarna_live_client_fixture', environment: 'production' } });
    if (url.pathname === '/api/klarna/prepare') {
      state.preparations.push({ body: request.postDataJSON(), capability: request.headers()['x-utekos-checkout-fallback'] });
      const hold = new Promise(resolve => { state.release = resolve; });
      state.onPrepare?.(); await hold;
      if (prepareError) return route.fulfill({ status: 503, json: { cart: currentCart, warnings: [], error: 'Fixture: Klarna kunne ikke åpnes.' } });
      return route.fulfill({ json: { cart: currentCart, warnings: [], checkoutMethod: fallback ? 'shopify' : 'klarna',
        ...(fallback ? {} : { orderPayload: { order_amount: 199000, order_lines: [] }, shopifyCartId: cart.id }) } });
    }
    if (url.pathname === '/api/cart/checkout') {
      state.checkouts.push(request.postDataJSON());
      if (checkoutError) return route.fulfill({ status: 503, json: { error: 'Fixture: kassen kunne ikke åpnes.' } });
      return route.fulfill({ json: { checkoutUrl: 'https://checkout.example.test/cart?discount=FIXTURE' } });
    }
    if (url.pathname === '/api/klarna/orders') { state.orders++; return route.fulfill({ status: 500, json: { error: 'Orders forbidden in browser fixtures' } }); }
    if (url.pathname === '/api/cart' && request.method() === 'POST') {
      state.adds.push(request.postDataJSON());
      const hold = new Promise(resolve => { state.release = resolve; });
      state.onAdd?.(); await hold;
      return route.fulfill({ json: { cart: currentCart, warnings: [] } });
    }
    if (url.pathname === '/api/cart') return route.fulfill({ json: { cart: currentCart, warnings: [] } });
    if (url.pathname.startsWith('/api/identity/klarna/prospect')) return route.fulfill({ json: { profile: null, matching: null } });
    if (!['GET', 'HEAD'].includes(request.method()) || request.resourceType() === 'ping') return route.fulfill({ status: 204 });
    return route.continue();
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(20000);
  await page.goto(new URL('/produkter/utekos-techdown', base).href, { waitUntil: 'domcontentloaded' });
  const add = page.locator('[class*="purchaseActions"] > button').first();
  const sticky = page.locator('aside[aria-label="Kjøp valgt variant"] button').first();
  const klarna = page.getByRole('button', { name: 'Betal med Klarna', exact: true }).first();
  await page.locator('[id^="klarna-express-checkout-"]').first().scrollIntoViewIfNeeded();
  await klarna.waitFor();
  return { page, add, sticky, klarna, state, errors, close: () => browser.close() };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  test(`Klarna owns its loading state and cancellation releases every control (${name})`, { skip: !base, timeout: 90000 }, async () => {
    for (const width of [390, 1440]) {
      const f = await fixture(engine, { width });
      try {
        const started = new Promise(resolve => { f.state.onPrepare = resolve; });
        const label = await f.add.innerText();
        await f.klarna.click(); await started;
        assert.equal(await f.add.isDisabled(), true);
        assert.equal(await f.add.getAttribute('aria-busy'), 'false');
        assert.equal(await f.sticky.getAttribute('aria-busy'), 'false');
        assert.equal(await f.add.innerText(), label);
        await f.page.screenshot({ path: `/tmp/utekos-klarna-checkout-fixed-${name}-${width}.png` });
        f.state.release();
        await f.page.waitForFunction(() => window.__klarnaFixture.authorizations.length === 1);
        assert.equal(f.state.preparations.length, 1);
        assert.equal(f.state.preparations[0].body.handle, 'utekos-techdown');
        assert.equal(f.state.checkouts.length, 1);
        assert.equal(f.state.checkouts[0].method, 'klarna');
        await f.page.evaluate(() => window.__klarnaFixture.cancel({ approved: false }));
        await f.page.waitForFunction(() => !document.querySelector('[class*="purchaseActions"] > button').disabled);
        assert.equal(f.state.orders, 0); assert.deepEqual(f.errors, []);
      } finally { await f.close(); }
    }
  });

  test(`discounted Klarna click preserves the cart and navigates once without authorization (${name})`, { skip: !base, timeout: 60000 }, async () => {
    const f = await fixture(engine, { fallback: true });
    try {
      const started = new Promise(resolve => { f.state.onPrepare = resolve; });
      await f.klarna.click(); await started;
      assert.equal(await f.add.getAttribute('aria-busy'), 'false');
      f.state.release();
      await f.page.waitForURL('https://checkout.example.test/**');
      assert.equal(f.state.preparations.length, 1);
      assert.equal(f.state.preparations[0].capability, 'shopify');
      assert.equal(f.state.checkouts.length, 1);
      assert.equal(f.state.checkouts[0].method, 'shopify');
      assert.equal(f.state.adds.length, 0); assert.equal(f.state.orders, 0);
      assert.equal(f.state.authorizations, 0);
      assert.equal(new URL(f.page.url()).searchParams.get('discount'), 'FIXTURE');
      assert.deepEqual(f.errors, []);
    } finally { await f.close(); }
  });

  test(`failed discount handoff releases the cart without opening payment (${name})`, { skip: !base, timeout: 60000 }, async () => {
    const f = await fixture(engine, { fallback: true, checkoutError: true });
    try {
      const started = new Promise(resolve => { f.state.onPrepare = resolve; });
      await f.klarna.click(); await started; f.state.release();
      await f.page.getByRole('alert').filter({ hasText: 'Fixture: kassen kunne ikke åpnes.' }).waitFor();
      assert.equal(await f.add.isDisabled(), false);
      assert.equal(await f.add.getAttribute('aria-busy'), 'false');
      assert.equal(f.state.checkouts.length, 1); assert.equal(f.state.orders, 0);
      assert.equal(f.state.authorizations, 0); assert.equal(f.state.preparations.length, 1);
      assert.deepEqual(f.errors, []);
    } finally { await f.close(); }
  });

  test(`preparation errors leave both purchase controls idle and available (${name})`, { skip: !base, timeout: 60000 }, async () => {
    const f = await fixture(engine, { prepareError: true });
    try {
      const started = new Promise(resolve => { f.state.onPrepare = resolve; });
      await f.klarna.click(); await started; f.state.release();
      await f.page.getByRole('alert').filter({ hasText: 'Fixture: Klarna kunne ikke åpnes.' }).waitFor();
      assert.equal(await f.add.isDisabled(), false);
      assert.equal(await f.add.getAttribute('aria-busy'), 'false');
      assert.equal(await f.sticky.getAttribute('aria-busy'), 'false');
      assert.equal(f.state.checkouts.length, 0); assert.equal(f.state.orders, 0);
      assert.equal(await f.page.evaluate(() => window.__klarnaFixture.authorizations.length), 0);
      assert.deepEqual(f.errors, []);
    } finally { await f.close(); }
  });

  test(`only the clicked add-to-cart button shows its progress (${name})`, { skip: !base, timeout: 60000 }, async () => {
    const f = await fixture(engine);
    try {
      const started = new Promise(resolve => { f.state.onAdd = resolve; });
      await f.add.click(); await started;
      assert.equal(await f.add.getAttribute('aria-busy'), 'true');
      assert.equal(await f.add.innerText(), 'Legger til …');
      assert.equal(await f.sticky.getAttribute('aria-busy'), 'false');
      f.state.release();
      await f.page.waitForFunction(() => document.querySelector('[class*="purchaseActions"] > button').getAttribute('aria-busy') === 'false');
      assert.equal(f.state.adds.length, 1); assert.equal(f.state.preparations.length, 0);
      assert.deepEqual(f.errors, []);
    } finally { await f.close(); }
  });
}

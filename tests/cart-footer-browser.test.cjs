/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { chromium, webkit } = require('playwright');

const baseURL = process.env.CART_FOOTER_BASE_URL;
const money = amount => ({ amount: String(amount), currencyCode: 'NOK' });
const fixtureCart = () => ({
  id: 'cart-footer-fixture', checkout: null, totalQuantity: 1,
  discountCodes: [], requiresStandardCheckout: false, commerce: null,
  subtotal: money(699), total: money(699),
  lines: [{
    id: 'fixture-line', variantId: 'fixture-variant', quantity: 1,
    title: 'Comfyrobe™', handle: 'comfyrobe', variantTitle: 'XS–S',
    available: true, image: null, total: money(699), commerce: null,
  }],
});

for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  test(`cart footer layout and checkout states (${engineName})`, { skip: !baseURL, timeout: 90_000 }, async () => {
    const browser = await engine.launch();
    try {
      for (const width of [390, 1440]) {
        const height = 900;
        const context = await browser.newContext({ viewport: { width, height } });
        let cart = fixtureCart();
        let finishMutation;
        let checkoutRequests = 0;
        const pageErrors = [];
        await context.route('**/*', async route => {
          const request = route.request();
          const url = new URL(request.url());
          if (url.pathname === '/api/cart') {
            if (request.method() === 'POST') await new Promise(resolve => { finishMutation = resolve; });
            return route.fulfill({ json: { cart, warnings: [] } });
          }
          if (url.pathname === '/api/cart/suggestions') return route.fulfill({ json: { products: [] } });
          if (url.pathname === '/api/cart/checkout') {
            checkoutRequests++;
            assert.equal(request.postDataJSON().method, 'shopify');
            return route.fulfill({ json: { checkoutUrl: new URL('/__cart-footer-fixture-checkout', baseURL).href } });
          }
          if (url.pathname === '/__cart-footer-fixture-checkout') return route.fulfill({ contentType: 'text/html', body: '<h1>Fixture checkout</h1>' });
          if (url.href.startsWith('https://js.klarna.com/web-sdk/')) {
            return route.fulfill({ contentType: 'application/javascript', body: `
              window.Klarna = window.Klarna || {};
              window.Klarna.OnsiteMessaging = { refresh: () => { window.cartPlacementRefreshes = (window.cartPlacementRefreshes || 0) + 1; } };
            ` });
          }
          // No telemetry, payment authorization or real checkout is sent by this test.
          if (!['GET', 'HEAD'].includes(request.method()) || request.resourceType() === 'ping') return route.fulfill({ status: 204 });
          return route.continue();
        });
        const page = await context.newPage();
        page.setDefaultTimeout(10_000);
        page.on('pageerror', error => pageErrors.push(error.message));
        await page.goto(new URL('/produkter/comfyrobe', baseURL).href, { waitUntil: 'load' });
        await page.waitForFunction(() => {
          const trigger = document.querySelector('button[aria-label^="Åpne handlekurv"]');
          return trigger && Object.keys(trigger).some(key => key.startsWith('__reactProps$') && typeof trigger[key]?.onClick === 'function');
        });
        await page.getByRole('button', { name: /Åpne handlekurv/ }).click();
        await page.getByRole('dialog').waitFor();
        const refresh = async () => {
          await Promise.all([
            page.waitForResponse(response => new URL(response.url()).pathname === '/api/cart' && response.request().method() === 'GET'),
            page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))),
          ]);
        };
        await refresh();
        const footer = page.locator('[data-slot="drawer-footer"]');
        await footer.getByText('Delsum', { exact: true }).waitFor();
        assert.equal(await footer.getByRole('button', { name: 'Betal med Klarna', exact: true }).count(), 0);
        await page.waitForFunction(() => window.cartPlacementRefreshes > 0);

        const geometry = await footer.evaluate(element => {
          const r = element.getBoundingClientRect();
          const checkoutButton = element.querySelector('button[aria-label^="Gå til kassen"]');
          const button = checkoutButton.getBoundingClientRect();
          const placement = element.querySelector('klarna-placement');
          return {
            bottom: r.bottom, gap: getComputedStyle(checkoutButton.parentElement).gap,
            padding: getComputedStyle(element).padding, buttonHeight: button.height,
            amount: placement.dataset.purchaseAmount, theme: placement.dataset.theme,
            overflow: element.scrollWidth > element.clientWidth,
          };
        });
        assert.ok(Math.abs(geometry.bottom - height) <= 2);
        assert.equal(geometry.gap, '12px');
        assert.equal(geometry.padding, '16px');
        assert.equal(geometry.buttonHeight, 54);
        assert.equal(geometry.amount, '69900');
        assert.equal(geometry.theme, 'dark');
        assert.equal(geometry.overflow, false);
        const dialogText = await page.getByRole('dialog').innerText();
        assert.doesNotMatch(dialogText, /Bruk «Til kassen»|Ved kjøp fra 999 kr|Du trenger ingen rabattkode|Fortsett å handle/);
        assert.ok(dialogText.indexOf('gratis frakt') < dialogText.indexOf('Delsum'));

        await Promise.all([
          page.waitForRequest(request => new URL(request.url()).pathname === '/api/cart' && request.method() === 'POST'),
          page.getByRole('button', { name: 'Øk antall for Comfyrobe™', exact: true }).click(),
        ]);
        await page.waitForFunction(() => document.querySelector('[data-slot="drawer-footer"] button[aria-label^="Behandler bestilling"]')?.disabled);
        assert.equal(await footer.getByRole('button', { name: 'Behandler bestilling...', exact: true }).isDisabled(), true);
        assert.equal(checkoutRequests, 0);
        cart = { ...cart, totalQuantity: 2, subtotal: money(1398), total: money(1398), lines: [{ ...cart.lines[0], quantity: 2, total: money(1398) }] };
        assert.equal(typeof finishMutation, 'function');
        finishMutation();
        await page.waitForFunction(() => document.querySelector('klarna-placement[data-purchase-amount="139800"]'));
        assert.ok(await page.evaluate(() => window.cartPlacementRefreshes >= 2));

        cart = { ...cart, lines: cart.lines.map(line => ({ ...line, available: false })) };
        await refresh();
        await footer.getByRole('alert').waitFor();
        assert.equal(await footer.getByRole('button', { name: /Fjern utsolgte varer/ }).isDisabled(), true);

        cart = { ...cart, total: money(1258.2), requiresStandardCheckout: true, discountCodes: [{ code: 'FIXTURE', applicable: true }], lines: cart.lines.map(line => ({ ...line, available: true })) };
        await refresh();
        await page.waitForFunction(() => document.querySelector('klarna-placement[data-purchase-amount="125820"]'));
        assert.equal(await footer.getByRole('button', { name: 'Betal med Klarna', exact: true }).count(), 0);
        await footer.getByRole('button', { name: /Gå til kassen med subtotal/ }).click();
        await page.waitForURL('**/__cart-footer-fixture-checkout');
        assert.equal(checkoutRequests, 1);
        assert.deepEqual(pageErrors, []);
        await context.close();
      }
    } finally {
      await browser.close();
    }
  });
}

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const source = fs.readFileSync(process.env.PIXEL_SOURCE_FILE ?? path.join(__dirname, '../public/analytics/meta-pixel-canonical-v1.js'), 'utf8');
let browser;
test.before(async () => { browser = await chromium.launch(); });
test.after(async () => { await browser.close(); });

async function run(t, { snapshot = {}, cookies = {}, mintFbp, marketing = 'granted', eventTimeOffset = 0 } = {}) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  t.after(() => context.close());
  await context.route('**/*', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Offline identity regression</title>' }));
  const page = await context.newPage();
  await page.goto('https://utekos.no/produkter/utekos-techdown');
  await page.evaluate(({ snapshot, cookies, mintFbp, marketing, eventTimeOffset }) => {
    for (const [name, value] of Object.entries(cookies)) document.cookie = `${name}=${value}; Path=/`;
    window.calls = [];
    window.fbq = function (...args) {
      calls.push(args);
      if (args[0] === 'init' && mintFbp) document.cookie = `_fbp=fb.1.${Date.now()}.123456789; Path=/`;
    };
    window.fbq.callMethod = () => {};
    window.fbq.instance = { locks: { isLocked: () => false } };
    const id = '726f6a3c-4db6-46ec-8c3c-fab4f2607d57';
    const entry = { event: 'page_view', event_id: id, canonical_event: { event_id: id, event_name: 'page_view', event_time: new Date(Date.now() + eventTimeOffset).toISOString(), page_url: location.href, consent: { marketing }, browser_id: snapshot } };
    window.dataLayer = [entry];
    window.fixtureEntry = entry;
  }, { snapshot, cookies, mintFbp, marketing, eventTimeOffset });
  await page.addScriptTag({ content: source });
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('utekos:meta-canonical-browser-event', { detail: fixtureEntry }));
  });
  return page.evaluate(() => ({
    dispatch: __utekosMetaPixelState.dispatches['PageView:726f6a3c-4db6-46ec-8c3c-fab4f2607d57'],
    tracked: calls.filter(call => call[0] === 'trackSingle'),
    cookie: document.cookie,
    captured: fixtureEntry.canonical_event,
  }));
}

test('SDK creates the first fbp after capture: PageView sends exactly once without altering canonical identity', async t => {
  const result = await run(t, { mintFbp: true });
  assert.equal(result.tracked.length, 1);
  assert.equal(result.tracked[0][2], 'PageView');
  assert.equal(result.tracked[0][4].eventID, result.captured.event_id);
  assert.equal(result.dispatch.skipped, undefined);
  assert.deepEqual(result.captured.browser_id, {});
  assert.doesNotMatch(result.cookie, /_fbc=/);
});

test('an existing fbp replaced by another identity still blocks Pixel', async t => {
  const result = await run(t, { snapshot: { fbp: `fb.1.${Date.now() - 10000}.old` }, mintFbp: true });
  assert.equal(result.tracked.length, 0);
  assert.equal(result.dispatch.skipped, 'different_live_meta_identity');
});

test('a different live fbc still blocks Pixel even when the SDK creates a first fbp', async t => {
  const result = await run(t, {
    snapshot: { fbc: `fb.1.${Date.now() - 10000}.originalClick` },
    cookies: { _fbc: `fb.1.${Date.now()}.newClick` }, mintFbp: true,
  });
  assert.equal(result.tracked.length, 0);
  assert.equal(result.dispatch.skipped, 'different_live_meta_identity');
});

test('a previously existing fbp cannot be adopted by a snapshot without browser identity', async t => {
  const result = await run(t, { cookies: { _fbp: `fb.1.${Date.now() - 60000}.unknown` } });
  assert.equal(result.tracked.length, 0);
  assert.equal(result.dispatch.skipped, 'different_live_meta_identity');
});

test('matching click and browser identities keep exact values and deduplicate replay', async t => {
  const fbc = `fb.1.${Date.now() - 10000}.CaseSensitive.ClickID_ABC`;
  const fbp = `fb.1.${Date.now() - 10000}.123456789`;
  const result = await run(t, { snapshot: { fbc, fbp }, cookies: { _fbc: fbc, _fbp: fbp } });
  assert.equal(result.tracked.length, 1);
  assert.equal(result.captured.browser_id.fbc, fbc);
  assert.ok(result.cookie.includes(`_fbc=${fbc}`));
});

test('denied marketing consent sends no Pixel event', async t => {
  const result = await run(t, { mintFbp: true, marketing: 'denied' });
  assert.equal(result.tracked.length, 0);
});

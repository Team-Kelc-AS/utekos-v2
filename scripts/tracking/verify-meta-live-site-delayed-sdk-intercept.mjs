#!/usr/bin/env node

// Reads the production site and Meta SDK; every synthetic event POST and
// Pixel/Gateway send is intercepted locally before it can reach a provider.

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const pixelId = '1092362672918571';
const clicks = ['SyntheticTransportProbeA20261031', 'SyntheticTransportProbeB20261031'];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ serviceWorkers: 'block' });
const pixelRequests = [];
const canonicalRequests = [];
const gatewayRequests = [];
const blocked = [];
let releaseConfig;
const configGate = new Promise(resolve => { releaseConfig = resolve; });
const candidatePixelScript = await readFile(
  new URL('../../public/analytics/meta-pixel-canonical-v1.js', import.meta.url),
  'utf8',
);
await context.addInitScript(() => {
  const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
  if (!descriptor?.get || !descriptor?.set) return;
  window.__syntheticFbcWrites = [];
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: () => descriptor.get.call(document),
    set: value => {
      if (String(value).startsWith('_fbc=')) {
        window.__syntheticFbcWrites.push({
          at: Date.now(),
          value: String(value).split(';')[0],
          stack: new Error().stack?.split('\n').slice(1, 5).join(' | '),
        });
      }
      return descriptor.set.call(document, value);
    },
  });
});

try {
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.origin === 'https://utekos.no' &&
        url.pathname === '/analytics/meta-pixel-canonical-v1.js') {
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: candidatePixelScript });
    }

    if (url.hostname === 'www.facebook.com' && /^\/tr\/?$/.test(url.pathname)) {
      pixelRequests.push({
        name: url.searchParams.get('ev'),
        eventId: url.searchParams.get('eid'),
        fbc: url.searchParams.get('fbc'),
        fbp: url.searchParams.get('fbp'),
      });
      return route.fulfill({ status: 204, body: '' });
    }
    if (url.pathname === '/events' && request.method() === 'POST') {
      const body = JSON.parse(request.postData() ?? '{}');
      if (body['fb.pixel_id'] === pixelId) {
        gatewayRequests.push({
          eventId: body.event_id,
          eventName: body.event_name,
          fbc: body['fb.clickID'],
          keys: Object.keys(body),
        });
      }
      return route.abort();
    }
    if (url.origin === 'https://connect.facebook.net' &&
        url.pathname.startsWith('/signals/config/')) {
      const response = await route.fetch();
      assert.equal(response.status(), 200);
      const body = await response.text();
      const botBlocking = `instance.optIn("${pixelId}", "BotBlocking", true);`;
      assert.ok(body.includes(botBlocking), 'live Meta config shape changed');
      await configGate;
      return route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: body.replace(botBlocking, ''),
      });
    }
    if (url.origin === 'https://connect.facebook.net' &&
        url.pathname === '/en_US/fbevents.js') {
      const response = await route.fetch();
      assert.equal(response.status(), 200);
      return route.fulfill({ response });
    }
    if (url.origin === 'https://utekos.no' &&
        url.pathname.startsWith('/api/events/') && request.method() === 'POST') {
      const body = JSON.parse(request.postData() ?? '{}');
      canonicalRequests.push({ path: url.pathname, body });
      return route.fulfill({ status: 202, json: { status: 'accepted' } });
    }
    if (url.origin === 'https://utekos.no' &&
        url.pathname === '/api/meta/client-ip' && request.method() === 'POST') {
      return route.fulfill({ status: 200, json: { client_ip_address: '192.0.2.1' } });
    }
    if (url.origin === 'https://utekos.no' &&
        url.pathname === '/api/meta/parameter-context' && request.method() === 'POST') {
      const cookies = request.headers()['cookie'] ?? '';
      const fbc = /(?:^|;\s*)_fbc=([^;]+)/.exec(cookies)?.[1];
      const fbp = /(?:^|;\s*)_fbp=([^;]+)/.exec(cookies)?.[1];
      return route.fulfill({ status: 200, json: {
        ...(fbc ? { fbc: decodeURIComponent(fbc) } : {}),
        ...(fbp ? { fbp: decodeURIComponent(fbp) } : {}),
      } });
    }
    if (url.origin === 'https://utekos.no' && request.method() === 'POST') {
      return route.fulfill({ status: 202, json: { status: 'accepted' } });
    }
    if (url.origin === 'https://utekos.no' &&
        (request.method() === 'GET' || request.method() === 'HEAD')) {
      return route.continue();
    }
    blocked.push(`${url.hostname}${url.pathname}`);
    return route.abort();
  });

  const pageA = await context.newPage();
  const pageB = await context.newPage();
  const errors = [];
  pageA.on('pageerror', error => errors.push(error.message));
  pageB.on('pageerror', error => errors.push(error.message));
  const canonicalEvents = [];

  for (const [index, click] of clicks.entries()) {
    const page = index === 0 ? pageA : pageB;
    const previousCanonicalCount = canonicalRequests.filter(row =>
      row.path === '/api/events/page-view').length;
    const response = await page.goto(
      `https://utekos.no/produkter/comfyrobe?fbclid=${click}`,
      { waitUntil: 'domcontentloaded' },
    );
    assert.equal(response?.status(), 200);
    await page.waitForFunction(() =>
      window.dataLayer?.some(entry => entry?.event === 'page_view'),
    null, { timeout: 20000 });
    await page.waitForFunction(() =>
      window.__utekosMetaPixelState?.scriptStatus === 'loaded',
    null, { timeout: 20000 });

    const deadline = Date.now() + 20000;
    let canonical;
    while (Date.now() < deadline && !canonical) {
      const pageViews = canonicalRequests.filter(row => row.path === '/api/events/page-view');
      canonical = pageViews[previousCanonicalCount]?.body;
      if (!canonical) await page.waitForTimeout(100);
    }

    assert.ok(canonical, 'canonical PageView did not reach the intercepted API');
    assert.equal(canonical.consent?.marketing, 'granted');
    assert.equal(canonical.click_id?.fbclid, click);
    assert.equal(canonical.browser_id?.fbc?.split('.')[3], click);
    canonicalEvents.push(canonical);
  }

  // The live page bundle predates the candidate prior-click record. Exercise
  // the candidate Pixel against that record; the app writer has a separate
  // browser regression in tracking-browser.test.cjs.
  await pageB.evaluate(priorClick => {
    const key = 'utekos_meta_identifiers_v2';
    const stored = JSON.parse(localStorage.getItem(key));
    stored.priorClicks = [{ fbclid: priorClick, observedAt: Date.now() }];
    localStorage.setItem(key, JSON.stringify(stored));
  }, clicks[0]);


  releaseConfig();
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline && !pixelRequests.some(row =>
    row.name === 'PageView' && row.eventId === canonicalEvents[1].event_id)) {
    await pageB.waitForTimeout(100);
  }
  const pixelA = pixelRequests.filter(row => row.name === 'PageView' &&
    row.eventId === canonicalEvents[0].event_id);
  const pixelB = pixelRequests.filter(row => row.name === 'PageView' &&
    row.eventId === canonicalEvents[1].event_id);
  const diagnostics = {
    pixelNames: pixelRequests.map(row => row.name),
    pixelA: pixelA.length,
    pixelB: pixelB.length,
    stateA: await pageA.evaluate(() => ({
      scriptStatus: window.__utekosMetaPixelState?.scriptStatus,
      pixelConsent: window.__utekosMetaPixelState?.pixelConsent,
      dispatches: Object.values(window.__utekosMetaPixelState?.dispatches ?? {})
        .map(row => ({ skipped: row.skipped, scriptStatus: row.scriptStatus })),
    })),
    stateB: await pageB.evaluate(() => ({
      scriptStatus: window.__utekosMetaPixelState?.scriptStatus,
      pixelConsent: window.__utekosMetaPixelState?.pixelConsent,
      dispatches: Object.values(window.__utekosMetaPixelState?.dispatches ?? {})
        .map(row => ({ skipped: row.skipped, scriptStatus: row.scriptStatus })),
    })),
    cookieScopes: (await context.cookies('https://utekos.no'))
      .filter(row => row.name === '_fbc' || row.name === '_fbp')
      .map(row => ({
        name: row.name,
        domain: row.domain,
        matchesA: row.value === (row.name === '_fbc' ? canonicalEvents[0].browser_id.fbc : canonicalEvents[0].browser_id.fbp),
        matchesB: row.value === (row.name === '_fbc' ? canonicalEvents[1].browser_id.fbc : canonicalEvents[1].browser_id.fbp),
        clickA: row.value.includes(clicks[0]),
        clickB: row.value.includes(clicks[1]),
      })),
    canonicalAFbc: canonicalEvents[0].browser_id.fbc,
    canonicalBFbc: canonicalEvents[1].browser_id.fbc,
    browserASeenFbc: await pageA.evaluate(() => document.cookie.split('; ').filter(row => row.startsWith('_fbc='))),
    browserBSeenFbc: await pageB.evaluate(() => document.cookie.split('; ').filter(row => row.startsWith('_fbc='))),
    storedA: await pageA.evaluate(() => localStorage.getItem('utekos_meta_identifiers_v2')),
    storedB: await pageB.evaluate(() => localStorage.getItem('utekos_meta_identifiers_v2')),
    writesA: await pageA.evaluate(() => window.__syntheticFbcWrites),
    writesB: await pageB.evaluate(() => window.__syntheticFbcWrites),
    blockedHosts: [...new Set(blocked.map(value => value.split('/')[0]))],
    errors: errors.slice(0, 3),
  };
  if (pixelB.length !== 1 || pixelA.some(row =>
      row.fbc !== canonicalEvents[0].browser_id.fbc ||
      row.fbp !== canonicalEvents[0].browser_id.fbp)) {
    process.stderr.write(JSON.stringify(diagnostics) + '\n');
  }
  assert.ok(pixelA.length <= 1);
  assert.equal(pixelB.length, 1, 'newer click must reach Pixel');
  assert.ok(pixelA.every(row => row.fbc === canonicalEvents[0].browser_id.fbc &&
    row.fbp === canonicalEvents[0].browser_id.fbp),
  'held A must never be sent with B identity');
  assert.equal(pixelB[0].fbc, canonicalEvents[1].browser_id.fbc);
  assert.equal(pixelB[0].fbp, canonicalEvents[1].browser_id.fbp);
  assert.notEqual(canonicalEvents[0].event_id, canonicalEvents[1].event_id);
  assert.equal(errors.length, 0, `page errors: ${errors.slice(0, 3).join('; ')}`);

  process.stdout.write(JSON.stringify({
    canonicalPageViews: canonicalRequests.filter(row => row.path === '/api/events/page-view').length,
    firstClickPixel: pixelA.length,
    secondClickPixel: pixelB.length,
    delayedSdkCrossClickMismatch: false,
    gatewayAttemptsIntercepted: gatewayRequests.length,
    gatewayWithClickId: gatewayRequests.filter(row => Boolean(row.fbc)).length,
    gatewayWithEventId: gatewayRequests.filter(row => Boolean(row.eventId)).length,
    gatewayEventNames: [...new Set(gatewayRequests.map(row => row.eventName))],
    gatewayPayloadKeys: [...new Set(gatewayRequests.flatMap(row => row.keys))],
    blockedHosts: [...new Set(blocked.map(value => value.split('/')[0]))],
    pageErrors: errors.length,
  }) + '\n');
} finally {
  await context.close();
  await browser.close();
}

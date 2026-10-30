#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

const pixelScript = fs.readFileSync(
  process.env.META_PIXEL_SCRIPT_PATH ??
    path.join(scriptDirectory, '../../public/analytics/meta-pixel-canonical-v1.js'),
  'utf8',
);
const pixelId = /var PIXEL_ID = '(\d+)'/.exec(pixelScript)?.[1];
assert.ok(pixelId, 'canonical Pixel ID was not found');

async function until(predicate, description) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await delay(25);
  }
  throw new Error(`Timed out waiting for ${description}`);
}

async function scenario(browser, kind) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const pixelRequests = [];
  const openBridgeRequests = [];
  const blocked = [];
  let configRequested = false;
  let releaseConfig;
  const configGate = new Promise(resolve => { releaseConfig = resolve; });

  try {
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin === 'https://utekos.no' && url.pathname === '/__pixel_sdk_probe__') {
        return route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<!doctype html><html><head></head><body>Pixel SDK probe</body></html>',
        });
      }
      if (url.href === 'https://connect.facebook.net/en_US/fbevents.js') {
        const response = await route.fetch();
        assert.equal(response.status(), 200, 'live fbevents.js fetch');
        return route.fulfill({ response });
      }
      if (url.origin === 'https://connect.facebook.net' && url.pathname.startsWith('/signals/config/')) {
        configRequested = true;
        const response = await route.fetch();
        assert.equal(response.status(), 200, 'live Pixel config fetch');
        const original = await response.text();
        // Headless Chromium is blocked by Meta's BotBlocking rule. Remove only
        // that opt-in in this intercepted test copy to reach the transport.
        const botOptIn = `instance.optIn("${pixelId}", "BotBlocking", true);`;
        assert.ok(original.includes(botOptIn), 'BotBlocking config shape changed');
        await configGate;
        return route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: original.replace(botOptIn, ''),
        });
      }
      if (url.hostname === 'www.facebook.com' && url.pathname.startsWith('/tr')) {
        pixelRequests.push({
          event: url.searchParams.get('ev'),
          eventId: url.searchParams.get('eid'),
          fbc: url.searchParams.get('fbc'),
          fbp: url.searchParams.get('fbp'),
        });
        return route.fulfill({ status: 204, body: '' });
      }
      if (url.pathname === '/events') {
        const payload = JSON.parse(route.request().postData() ?? '{}');
        if (payload['fb.pixel_id'] === pixelId) {
          openBridgeRequests.push({
            event: payload.event_name,
            eventId: payload.event_id,
            fbc: payload['fb.clickID'],
            fbp: payload['fb.fbp'],
          });
        }
        return route.abort();
      }
      blocked.push(url.hostname + url.pathname);
      return route.abort();
    });

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto('https://utekos.no/__pixel_sdk_probe__');
    const identifiers = await page.evaluate(scenarioKind => {
      const timestamp = Date.now() - 5000;
      const fbc = `fb.1.${timestamp}.SyntheticClickA.ABcD1234`;
      const fbp = `fb.1.${timestamp}.SyntheticBrowserA`;
      document.cookie = `_fbc=${fbc}; Path=/`;
      document.cookie = `_fbp=${fbp}; Path=/`;
      if (scenarioKind === 'duplicate-aligned') {
        document.cookie = `_fbc=${fbc}; Domain=.utekos.no; Path=/`;
      }
      window.dataLayer = [{
        event: 'page_view',
        event_id: 'sdk-probe-A',
        canonical_event: {
          event_id: 'sdk-probe-A',
          event_name: 'page_view',
          event_time: new Date().toISOString(),
          browser_id: { fbc, fbp },
          consent: { marketing: 'granted' },
          custom_data: {},
        },
      }];
      return { fbc, fbp };
    }, kind);

    if (kind === 'duplicate-aligned') {
      const values = await page.evaluate(() =>
        document.cookie.split('; ').filter(cookie => cookie.startsWith('_fbc=')));
      assert.equal(values.length, 2, 'both host and domain cookie scopes are present');
    }

    await page.addScriptTag({ content: pixelScript });
    await page.waitForFunction(() =>
      typeof fbq?.callMethod === 'function' &&
      __utekosMetaPixelState.scriptStatus === 'loaded');
    await until(() => configRequested, 'Pixel config request');
    assert.equal(configRequested, true, 'Pixel config was requested');
    assert.equal(await page.evaluate(() => fbq.instance.locks.isLocked()), true);

    if (kind.startsWith('async-queue')) {
      await page.evaluate(() => {
        fbq.instance.asyncParamFetchers.set('probe_hold', {
          request: new Promise(resolve => { window.__releaseAsyncProbe = resolve; }),
          callback() {},
        });
        fbq.instance.asyncParamPromisesAllSettled = false;
      });
    }

    if (kind === 'new-click' || kind === 'new-click-other-tab') {
      const clickPage = kind === 'new-click-other-tab'
        ? await context.newPage()
        : page;
      if (clickPage !== page) {
        await clickPage.goto('https://utekos.no/__pixel_sdk_probe__');
      }
      await clickPage.evaluate(() => {
        const timestamp = Date.now() + 1000;
        document.cookie = `_fbc=fb.1.${timestamp}.SyntheticClickB; Path=/`;
        document.cookie = `_fbp=fb.1.${timestamp}.SyntheticBrowserB; Path=/`;
      });
    }

    if (['missing-cookie', 'transient-missing-cookie', 'missing-then-new-click'].includes(kind)) {
      await page.evaluate(() => {
        document.cookie = '_fbc=; Path=/; Max-Age=0';
      });
    }

    releaseConfig();

    if (kind === 'transient-missing-cookie' || kind === 'missing-then-new-click') {
      await page.waitForFunction(() => !fbq.instance.locks.isLocked());
      await delay(350);
      assert.equal(
        await page.evaluate(() => __utekosMetaPixelState.sent['PageView:sdk-probe-A']),
        undefined,
        'the missing cookie remains eligible for restoration',
      );
      await page.evaluate(({ scenarioKind, fbc }) => {
        if (scenarioKind === 'transient-missing-cookie') {
          document.cookie = `_fbc=${fbc}; Path=/`;
        } else {
          const timestamp = Date.now() + 1000;
          document.cookie = `_fbc=fb.1.${timestamp}.SyntheticClickB; Path=/`;
          document.cookie = `_fbp=fb.1.${timestamp}.SyntheticBrowserB; Path=/`;
        }
      }, { scenarioKind: kind, fbc: identifiers.fbc });
    }

    if (kind.startsWith('async-queue')) {
      await page.waitForFunction(() =>
        !fbq.instance.locks.isLocked() &&
        fbq.instance.eventQueue.length === 1 &&
        __utekosMetaPixelState.dispatches['PageView:sdk-probe-A']);
      const clickPage = kind === 'async-queue-other-tab'
        ? await context.newPage()
        : page;
      if (clickPage !== page) {
        await clickPage.goto('https://utekos.no/__pixel_sdk_probe__');
      }
      await clickPage.evaluate(navigate => {
        const timestamp = Date.now() + 1000;
        if (navigate) {
          history.pushState({}, '', '/produkter/test-product?fbclid=SyntheticClickB');
        }
        document.cookie = `_fbc=fb.1.${timestamp}.SyntheticClickB; Path=/`;
        document.cookie = `_fbp=fb.1.${timestamp}.SyntheticBrowserB; Path=/`;
      }, kind === 'async-queue-navigation');
      await page.waitForFunction(() => document.cookie.includes('SyntheticClickB'));
      await page.evaluate(() => window.__releaseAsyncProbe('ready'));
    }

    if (['new-click', 'new-click-other-tab', 'missing-cookie', 'missing-then-new-click'].includes(kind)) {
      await page.waitForFunction(() =>
        __utekosMetaPixelState.dispatches['PageView:sdk-probe-A']?.skipped ===
        'different_live_meta_identity');
      await delay(500);
      assert.equal(pixelRequests.filter(request => request.eventId === 'sdk-probe-A').length, 0);
      assert.equal(openBridgeRequests.filter(request => request.eventId === 'sdk-probe-A').length, 0);
    } else {
      await until(
        () => pixelRequests.some(request => request.eventId === 'sdk-probe-A'),
        `${kind} Pixel request`,
      );
      const requests = pixelRequests.filter(request => request.eventId === 'sdk-probe-A');
      assert.equal(requests.length, 1);
      assert.equal(requests[0].event, 'PageView');
      assert.equal(requests[0].fbc, identifiers.fbc);
      assert.equal(requests[0].fbp, identifiers.fbp);
      await until(
        () => openBridgeRequests.some(request => request.eventId === 'sdk-probe-A'),
        `${kind} OpenBridge request`,
      );
      const mirrored = openBridgeRequests.filter(request => request.eventId === 'sdk-probe-A');
      assert.ok(mirrored.every(request =>
        request.event === 'PageView' &&
        request.fbc === identifiers.fbc &&
        request.fbp === identifiers.fbp),
      `${kind} OpenBridge identity must match the original event`);
    }

    assert.deepEqual(errors, [], 'no uncaught browser errors');
    return { kind, pixelRequests: pixelRequests.length, openBridgeRequests: openBridgeRequests.length, blockedHosts: [...new Set(blocked.map(url => url.split('/')[0]))] };
  } finally {
    releaseConfig();
    await context.close();
  }
}

async function main() {
  const selectedKinds = process.env.META_PIXEL_SCENARIOS?.split(',');
  for (const [name, browserType, kinds] of [
    ['chromium', chromium, [
      'stable-click',
      'duplicate-aligned',
      'new-click',
      'new-click-other-tab',
      'missing-cookie',
      'transient-missing-cookie',
      'missing-then-new-click',
      'async-queue',
      'async-queue-other-tab',
      'async-queue-navigation',
    ]],
    ['webkit', webkit, [
      'transient-missing-cookie',
      'missing-then-new-click',
      'async-queue-other-tab',
      'async-queue-navigation',
    ]],
  ]) {
    const browser = await browserType.launch({ headless: true });
    try {
      for (const kind of kinds) {
        if (selectedKinds && !selectedKinds.includes(kind)) continue;
        const result = await scenario(browser, kind);
        process.stdout.write(`${name} ${result.kind}: ${result.pixelRequests} intercepted Pixel request(s); ${result.openBridgeRequests} intercepted OpenBridge request(s); ${result.blockedHosts.length} other external host(s) blocked\n`);
      }
    } finally {
      await browser.close();
    }
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

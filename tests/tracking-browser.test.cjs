/* eslint-disable @typescript-eslint/no-require-imports */
// Offline integration: the real runtime, observers, Parameter Builder and pinned
// Pixel transport run in Chromium. Every request is fulfilled or aborted; no
// GTM container, provider event, Shopify mutation or production URL is fetched.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { chromium, webkit } = require('playwright');
const esbuild = require('esbuild');
const pixel = fs.readFileSync(path.join(root, 'public/analytics/meta-pixel-canonical-v1.js'), 'utf8');
let browser, safari, bundle, previewBundle;

async function buildHarness(environment) {
  const result = await esbuild.build({
    stdin: { contents: `export {reportNavigation,attachCommerceTracking,prepareCanonicalCheckout,confirmCheckoutTracking,createBrowserEvent,dispatchEvent} from './src/lib/tracking/runtime';
      export {enrichCanonicalEventWithMetaAttribution} from './src/lib/analytics/enrichCanonicalEventWithMetaAttribution';
      export {observeStorefront,observeTrackedPage} from './src/lib/tracking/dom-observers';
      export {emitStorefrontAction} from './src/lib/tracking/browser-events';
      export {createCanonicalGenerateLead,buildGenerateLeadDataLayerEvent} from './src/lib/analytics/generateLeadEvent';
      export {recordVariantIntent} from './src/lib/tracking/variant-selection';
      import {createElement,useEffect} from 'react';
      import {createRoot,hydrateRoot} from 'react-dom/client';
      import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from './src/assets/components/ui/Accordion';
      import {useBrowserTrackingEnabled} from './src/lib/tracking/useBrowserTrackingEnabled';
      export function mountProductAccordion() {
        const container=document.createElement('div');document.querySelector('[data-tracking-product]').append(container);
        createRoot(container).render(createElement(Accordion,null,
          createElement(AccordionItem,{id:'materialer',value:'materialer'},
            createElement(AccordionTrigger,null,'Materialer'),
            createElement(AccordionContent,null,'Produktets materialer'))));
      }
      export function hydrateTrackingGate() {
        const container=document.createElement('div');container.id='hydrated-tracking-gate';document.body.append(container);
        window.__gateHydrationErrors=[];
        function Gate() {
          const enabled=useBrowserTrackingEnabled();
          useEffect(()=>{window.__gateReady=true},[]);
          return enabled?createElement('span',null,'enabled'):null;
        }
        // SSR intentionally produces empty markup because browser eligibility is unknown.
        hydrateRoot(container,createElement(Gate),{onRecoverableError(error){window.__gateHydrationErrors.push(error.message)}});
      }`, resolveDir: root, loader: 'ts' },
    absWorkingDir: root, bundle: true, format: 'iife', globalName: 'UtekosTrackingHarness', platform: 'browser', target: 'chrome120', write: false,
    // CSS Modules in the real Accordion need an output path even for an in-memory build.
    outfile: 'tracking-harness.js',
    define: { 'process.env.NEXT_PUBLIC_TRACKING_ENABLED': '"true"', 'process.env.NEXT_PUBLIC_VERCEL_ENV': JSON.stringify(environment), 'process.env.VERCEL_ENV': JSON.stringify(environment), 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
  });
  return result.outputFiles[0].text;
}
test.before(async () => {
  bundle = await buildHarness('production');
  previewBundle = await buildHarness('preview');
  browser = await chromium.launch({ headless: true });
  safari = await webkit.launch({ headless: true });
});
test.after(async () => { await browser?.close(); await safari?.close(); });

test('accepted Dun reservation projects one rich unvalued Pixel Lead with the server ID', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/utekos-dun');
  await api.waitFor('page_view');
  const entry = await api.page.evaluate(pageEvent => {
    const event = UtekosTrackingHarness.createCanonicalGenerateLead({
      eventId: crypto.randomUUID(), eventTime: '2026-10-10T10:00:00.000Z', environment: 'production',
      consent: pageEvent.consent, pageUrl: location.href, pageViewId: pageEvent.page_view_id,
      browserId: pageEvent.browser_id,
      customData: { submission_id: 'accepted-reservation', form_id: 'product_reservation_utekos_dun', lead_type: 'product_reservation',
        product_handle: 'utekos-dun', product_id: 'gid://shopify/Product/1', variant_id: 'gid://shopify/ProductVariant/67610887160056', color: 'Vargnatt', size: 'Small' },
    });
    const entry = UtekosTrackingHarness.buildGenerateLeadDataLayerEvent(event);
    UtekosTrackingHarness.emitStorefrontAction('utekos:accepted-lead', entry);
    UtekosTrackingHarness.emitStorefrontAction('utekos:accepted-lead', entry);
    return entry;
  }, api.events('page_view')[0]);
  await api.waitFor('generate_lead');
  const result = await api.page.evaluate(() => ({ leads: dataLayer.filter(event => event?.event === 'generate_lead'), pixel: window.__pixelCalls.filter(call => call[2] === 'Lead') }));
  assert.equal(result.leads.length, 1);
  assert.equal(result.pixel.length, 1);
  assert.equal(result.pixel[0][4].eventID, entry.event_id);
  assert.deepEqual(result.pixel[0][3], { form_id: 'product_reservation_utekos_dun', lead_type: 'product_reservation', product_handle: 'utekos-dun',
    product_id: 'gid://shopify/Product/1', variant_id: 'gid://shopify/ProductVariant/67610887160056', color: 'Vargnatt', size: 'Small' });
  assert.equal(api.events('generate_lead').length, 0, 'confirmed server Lead is never collected again');
});

function commerce(id = '1') {
  return { currency: 'NOK', value: 800, gross_value: 1000, tax_value: 200, items: [{
    item_id: `gid://shopify/ProductVariant/${id}`, product_id: 'gid://shopify/Product/1', variant_id: `gid://shopify/ProductVariant/${id}`,
    item_name: 'Fixture product', product_handle: 'test-product', item_brand: 'Utekos', item_variant: `Variant ${id}`,
    quantity: 1, unit_price: 800, gross_unit_price: 1000, tax_amount: 200, tax_rate: .25, taxable: true, price_includes_tax: true,
    available_for_sale: true, currently_not_in_stock: false, quantity_available: 10, selected_options: [{ name: 'Størrelse', value: id }], collection_ids: [], collection_titles: [],
  }] };
}
const attr = value => JSON.stringify(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
function content(url, { longJourney = false } = {}) {
  const parsed = new URL(url);
  if (parsed.pathname === '/bli-forhandler' || parsed.pathname === '/bli-forhandler/pdf') {
    const isPdf = parsed.pathname.endsWith('/pdf');
    return `<main data-tracking-route="${parsed.pathname}"><h1>Forhandlerhenvendelse</h1>
      ${isPdf ? '' : '<a id="dealer-open" href="/bli-forhandler/pdf" data-tracking-cta="dealer_pdf_open" onclick="event.preventDefault()"><span>Åpne PDF</span></a>'}
      <a id="dealer-download" href="/images/kunnskap/forhandler-utfyllbar.pdf" data-tracking-cta="dealer_pdf_download" download onclick="event.preventDefault()">Last ned PDF</a>
      <form data-tracking-form="dealer_inquiry" data-tracking-form-name="${isPdf ? 'Forhandlersamarbeid PDF' : 'Forhandlersamarbeid'}" onsubmit="event.preventDefault()" novalidate>
        <input id="dealer-website" name="website" aria-label="Spamfelt">
        <input id="dealer-name" name="name" aria-label="Kontaktperson">
        <textarea id="dealer-message" name="message" aria-label="Melding"></textarea>
        <input id="dealer-privacy" name="privacy" type="checkbox" aria-label="Personvern">
        <button id="dealer-submit" type="submit" data-tracking-cta="${isPdf ? 'dealer_pdf_submit' : 'dealer_web_submit'}"><span>Send henvendelsen</span></button>
        <button id="dealer-disabled" type="button" data-tracking-cta="dealer_disabled" disabled>Venter</button>
      </form></main>`;
  }
  if (parsed.pathname.startsWith('/produkter/test-product')) {
    const id = parsed.searchParams.get('variant') || '1';
    const selection = parsed.searchParams.has('variant') ? `variant=${id}` : '';
    return `<main data-tracking-route="${parsed.pathname}" ${longJourney ? 'style="min-height:3500px"' : ''}><article data-tracking-product="${parsed.pathname}" data-tracking-selection="${selection}" data-tracking-commerce="${attr(commerce(id))}"><h1>Fixture product ${id}</h1></article>${longJourney ? '<section data-journey-section="reviews" style="position:absolute;top:1900px;height:250px;width:400px">Reviews fixture</section>' : ''}</main>`;
  }
  return `<main data-tracking-route="${parsed.pathname}" data-tracking-page="${Number(parsed.searchParams.get('page') ?? '1')}"><h1>Fixture list</h1><section data-tracking-list="fixture-list" data-tracking-list-name="Fixture list"><div id="card" data-tracking-commerce="${attr(commerce())}" style="height:200px;width:300px;margin-top:1000px"><a href="/produkter/test-product?variant=1">Fixture product</a></div></section></main>`;
}
async function fixture(t, initial = 'https://utekos.no/produkter/test-product?variant=1', { deferCommerce = false, deferObservers = false, preview = false, longJourney = false, gaDelay = 0, gaBlocked = false, safariMode = false, userAgent, metaBackupDelay = 0, metaBackupBlocked = false, metaBackupRejected = false, metaAndroidResponse, metaIpDelay = 0, metaFirstIpDelay = 0, storedClicks, storedDurableClicks, metaCookie, metaHostFbcCookie, metaFbpCookie, metaCookiesBlocked = false, metaContextFbc, metaContextFbp = 'fb.1.1700000000000.123456789', pixelConfigLockMs = 0, pixelReadinessSignal = true } = {}) {
  const context = await (safariMode ? safari : browser).newContext({ viewport: { width: 1000, height: 700 }, serviceWorkers: 'block', userAgent });
  t.after(() => context.close());
  if (storedClicks) await context.addInitScript(identifiers => {
    if (!sessionStorage.getItem('utekos_click_ids')) sessionStorage.setItem('utekos_click_ids', JSON.stringify(identifiers));
  }, storedClicks);
  if (storedDurableClicks) await context.addInitScript(identifiers => {
    if (!localStorage.getItem('utekos_click_ids_v1')) localStorage.setItem('utekos_click_ids_v1', JSON.stringify({ identifiers, updatedAt: new Date().toISOString() }));
  }, storedDurableClicks);
  if (metaAndroidResponse) await context.addInitScript(response => {
    const OriginalXHR = window.XMLHttpRequest;
    window.__androidBridgeCalls = 0;
    window.XMLHttpRequest = class extends OriginalXHR {
      open(...args) {
        this.nativeBridge = String(args[1]).startsWith('properties://browser/');
        if (!this.nativeBridge) return super.open(...args);
      }
      send(...args) {
        if (!this.nativeBridge) return super.send(...args);
        window.__androidBridgeCalls++;
        Object.defineProperties(this, {
          readyState: { value: 4 }, status: { value: response.status },
          responseText: { value: response.text },
        });
        queueMicrotask(() => this['on' + response.event]?.call(this, new ProgressEvent(response.event)));
      }
    };
  }, metaAndroidResponse);
  if (metaHostFbcCookie) await context.addCookies([{ name: '_fbc', value: metaHostFbcCookie, domain: 'utekos.no', path: '/' }]);
  if (metaCookie) await context.addCookies([{ name: '_fbc', value: metaCookie, domain: '.utekos.no', path: '/' }]);
  if (metaFbpCookie) await context.addCookies([{ name: '_fbp', value: metaFbpCookie, domain: '.utekos.no', path: '/' }]);
  if (metaCookiesBlocked) await context.addInitScript(() => Object.defineProperty(document, 'cookie', { get: () => '', set: () => {} }));
  const requests = [], forbidden = [], errors = [];
  let metaIpCalls = 0;
  t.after(() => { assert.deepEqual(forbidden, [], 'every external request must have an explicit offline fixture'); assert.deepEqual(errors, [], 'no uncaught browser errors'); });
  await context.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    const body = request.postData();
    if (url.origin === 'https://utekos.no' && request.isNavigationRequest()) return route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<!doctype html><html><head><meta charset="utf-8"><title>Tracking fixture</title><script>
      window.__pixelCalls=[];window.__canonicalBrowser=[];window.dataLayer=[];
      window.__metaBackupCalls=0;window.__pixelIdentity=[];
      if (${metaBackupDelay}>0 || ${metaBackupBlocked} || ${metaBackupRejected}) window.webkit={messageHandlers:{browserProperties:{postMessage(name){
        window.__metaBackupCalls++;
        if (${metaBackupRejected}) return Promise.reject(new Error('synthetic_native_rejection'));
        return new Promise(resolve=>{if(!${metaBackupBlocked})setTimeout(()=>resolve(name==='clickID'?'OfflineBackupClick':''),${metaBackupDelay})});
      }}}};
      window.__gaReadyAt=performance.now()+${gaDelay};window.__gaGetCount=0;
      dataLayer.push=function(...entries){for(const entry of entries){if(entry?.[0]==='get'&&typeof entry[3]==='function'){window.__gaGetCount++;if(!${gaBlocked})entry[3](performance.now()>=window.__gaReadyAt?(entry[2]==='client_id'?'123.456':'789'):undefined);}}return Array.prototype.push.apply(this,entries)};
      addEventListener('utekos:meta-canonical-browser-event',event=>window.__canonicalBrowser.push(event.detail));
      </script>${preview ? '' : '<script src="/analytics/meta-pixel-canonical-v1.js"></script>'}</head><body>${content(url, { longJourney })}<script src="/tracking-browser-fixture.js"></script><script>
      UtekosTrackingHarness.reportNavigation();${deferCommerce ? '' : 'UtekosTrackingHarness.attachCommerceTracking();'}
      ${deferObservers ? '' : 'window.__stopObservers=UtekosTrackingHarness.observeTrackedPage();'}
      addEventListener('popstate',()=>{window.__stopObservers();UtekosTrackingHarness.reportNavigation();window.__stopObservers=UtekosTrackingHarness.observeTrackedPage()});
      </script></body></html>` });
    if (url.origin === 'https://utekos.no' && url.pathname === '/tracking-browser-fixture.js') return route.fulfill({ contentType: 'application/javascript', body: preview ? previewBundle : bundle });
    if (url.origin === 'https://utekos.no' && url.pathname === '/analytics/meta-pixel-canonical-v1.js') return route.fulfill({ contentType: 'application/javascript', body: pixel });
    if (url.href === 'https://connect.facebook.net/en_US/fbevents.js') return route.fulfill({ contentType: 'application/javascript', body: `var f=window.fbq;var locked=${pixelConfigLockMs}>0;if(${pixelReadinessSignal})f.instance={locks:{isLocked:function(){return locked}}};f.callMethod=function(){if(locked){f.queue.push(arguments);return}window.__pixelCalls.push(Array.from(arguments));window.__pixelIdentity.push({name:arguments[2],id:arguments[4]?.eventID,cookie:document.cookie})};for(var a of f.queue.splice(0))f.callMethod.apply(null,a);if(locked)setTimeout(function(){locked=false;for(var a of f.queue.splice(0))f.callMethod.apply(null,a)},${pixelConfigLockMs});` });
    if (url.origin === 'https://utekos.no' && url.pathname.startsWith('/api/')) {
      let json; try { json = JSON.parse(body); } catch { json = body; }
      requests.push({ path: url.pathname, body: json });
      if (url.pathname === '/api/meta/client-ip') {
        const delay = ++metaIpCalls === 1 ? metaFirstIpDelay || metaIpDelay : metaIpDelay;
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        return route.fulfill({ json: { client_ip_address: '192.0.2.1' } });
      }
      if (url.pathname === '/api/meta/parameter-context') return route.fulfill({
        headers: metaContextFbc ? { 'Set-Cookie': `_fbc=${metaContextFbc}; Domain=.utekos.no; Path=/` } : {},
        json: { fbp: metaContextFbp, ...(metaContextFbc ? { fbc: metaContextFbc } : {}) },
      });
      return route.fulfill({ status: 202, json: { status: 'accepted' } });
    }
    if (url.origin === 'https://utekos.no' && url.pathname === '/favicon.ico') return route.fulfill({ status: 204 });
    forbidden.push(url.origin + url.pathname);
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(initial);
  await page.waitForFunction(() => typeof window.UtekosTrackingHarness === 'object').catch(async error => {
    throw new Error(`${error.message}\nFixture diagnostics: ${JSON.stringify(await page.evaluate(() => ({ title: document.title, scripts: Array.from(document.scripts, script => script.src), harness: typeof UtekosTrackingHarness, html: document.body.innerHTML.slice(0, 120) })))} errors=${JSON.stringify(errors)} forbidden=${JSON.stringify(forbidden)}`);
  });
  const events = name => requests.filter(request => request.path === `/api/events/${name.replaceAll('_', '-')}`).map(request => request.body);
  const journey = name => requests.filter(request => request.path === '/api/observability/journey' && request.body?.event_name === name).map(request => request.body);
  async function waitFor(name, count = 1) { await page.waitForFunction(({ name, count }) => window.dataLayer.filter(entry => entry?.event === name).length >= count, { name, count }); await new Promise(resolve => setTimeout(resolve, 50)); }
  async function waitForJourney(name, count = 1) {
    const deadline = Date.now() + 8000;
    while (journey(name).length < count && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
    assert.ok(journey(name).length >= count, `expected ${count} ${name} journey events`);
  }
  return { page, requests, events, journey, waitFor, waitForJourney };
}

for (const crawlerName of ['Googlebot', 'AdsBot-Google', 'Storebot-Google', 'Google-Agent', 'GoogleOther', 'GoogleMessages', 'meta-externalads', 'meta-externalagent', 'meta-webindexer', 'facebookexternalhit', 'meta-externalfetcher'])
test(`${crawlerName} can read products without Pixel, customer events, identity or collector requests`, async t => {
  const api = await fixture(t, undefined, { userAgent: `Mozilla/5.0 Chrome/131.0 Safari/537.36 ${crawlerName}/1.1` });
  assert.equal(await api.page.locator('h1').textContent(), 'Fixture product 1');
  await api.page.evaluate(() => {
    UtekosTrackingHarness.reportNavigation();
    UtekosTrackingHarness.emitStorefrontAction('utekos:select-item', { fixture: true });
    dispatchEvent(new PageTransitionEvent('pagehide'));
  });
  await api.page.waitForTimeout(600);
  const state = await api.page.evaluate(() => ({
    events: dataLayer, pixel: window.__pixelCalls, canonical: window.__canonicalBrowser,
    fbq: typeof window.fbq, cookies: document.cookie,
    local: localStorage.length, session: sessionStorage.length,
  }));
  assert.deepEqual(api.requests, []);
  assert.deepEqual(state, { events: [], pixel: [], canonical: [], fbq: 'undefined', cookies: '', local: 0, session: 0 });
});

for (const crawler of [false, true]) test(`tracking hydration is stable and only enables ordinary visitors (crawler=${crawler})`, async t => {
  const api = await fixture(t, undefined, { userAgent: crawler ? 'meta-externalads/1.1' : 'Fixture browser' });
  await api.page.evaluate(() => UtekosTrackingHarness.hydrateTrackingGate());
  await api.page.waitForFunction(() => window.__gateReady);
  if (!crawler) await api.page.waitForFunction(() => document.getElementById('hydrated-tracking-gate').textContent === 'enabled');
  assert.equal(await api.page.locator('#hydrated-tracking-gate').textContent(), crawler ? '' : 'enabled');
  assert.deepEqual(await api.page.evaluate(() => window.__gateHydrationErrors), []);
});

test('size guide dialog reports each opening without counting closing or other dialogs as accordion interactions', async t => {
  const api = await fixture(t);
  await api.waitFor('view_item');
  await api.page.evaluate(() => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-tracking-size-guide', '');
    wrapper.innerHTML = '<button id="size-guide" data-slot="dialog-trigger" aria-expanded="false">Størrelsesguide</button>';
    document.querySelector('[data-tracking-product]').append(wrapper);
    document.getElementById('size-guide').onclick = event => {
      const trigger = event.currentTarget;
      trigger.setAttribute('aria-expanded', String(trigger.getAttribute('aria-expanded') !== 'true'));
    };
  });
  await api.page.locator('#size-guide').click();
  await api.waitFor('size_guide_view');
  await api.page.locator('#size-guide').click();
  await api.page.locator('#size-guide').click();
  await api.waitFor('size_guide_view', 2);
  await api.page.evaluate(() => {
    const trigger = document.createElement('button');
    trigger.setAttribute('data-slot', 'dialog-trigger');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.append(trigger);
    trigger.setAttribute('aria-expanded', 'true');
  });
  await api.page.waitForTimeout(100);
  assert.equal(api.events('size_guide_view').length, 2);
  assert.deepEqual(api.events('size_guide_view').map(event => event.custom_data.open_sequence), [1, 2]);
  assert.equal(api.events('interact_with_accordion').length, 0);
});

for (const safariMode of [false, true]) test(`actual product Accordion reports each opening with commerce and identical Pixel identity (${safariMode ? 'WebKit' : 'Chromium'})`, async t => {
  const api = await fixture(t, undefined, { safariMode });
  await api.waitFor('view_item');
  await api.page.evaluate(() => UtekosTrackingHarness.mountProductAccordion());
  const trigger = api.page.getByRole('button', { name: 'Materialer', exact: true });
  await trigger.click();
  await api.waitFor('interact_with_accordion');
  await trigger.press('Enter');
  await trigger.press('Enter');
  await api.waitFor('interact_with_accordion', 2);
  const events = api.events('interact_with_accordion');
  assert.equal(events.length, 2, 'closing is not an opening');
  assert.deepEqual(events.map(event => event.custom_data.interaction_sequence), [1, 2]);
  for (const event of events) {
    assert.equal(event.custom_data.accordion_id, 'materialer');
    assert.equal(event.custom_data.accordion_title, 'Materialer');
    assert.equal(event.custom_data.interaction_type, 'open');
    assert.equal(event.custom_data.currency, 'NOK');
    assert.equal(event.custom_data.value, 800);
    assert.deepEqual(event.custom_data.items, commerce().items);
  }
  const calls = await api.page.evaluate(() => window.__pixelCalls.filter(call => call[2] === 'InteractWithAccordion'));
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(call => call[4].eventID), events.map(event => event.event_id));
  assert.equal(calls[0][3].accordion_id, 'materialer');
  assert.equal(calls[0][3].accordion_title, 'Materialer');
  assert.equal(calls[0][3].interaction_type, 'open');
  assert.equal(calls[0][3].currency, 'NOK');
  assert.equal(calls[0][3].value, 1000);
  assert.equal(calls[0][3].net_value, 800);
  assert.equal(calls[0][3].tax_value, 200);
  assert.deepEqual(calls[0][3].content_ids, ['1']);
});

test('Pixel browser signal and collector retain identical canonical identity without hydration duplicates', async t => {
  const api = await fixture(t);
  await api.waitFor('page_view'); await api.waitFor('view_item');
  await api.page.evaluate(() => { UtekosTrackingHarness.reportNavigation(); UtekosTrackingHarness.reportNavigation(); });
  await api.page.waitForTimeout(600);
  const pages = api.events('page_view');
  assert.equal(pages.length, 1);
  assert.equal(api.events('view_item').length, 1);
  const received = await api.page.evaluate(() => ({ canonical: window.__canonicalBrowser, pixel: window.__pixelCalls }));
  const browserEvent = received.canonical.find(entry => entry.event === 'page_view').canonical_event;
  const pixelEvents = received.pixel.filter(entry => entry[2] === 'PageView');
  assert.equal(pixelEvents.length, 1);
  assert.equal(pixelEvents[0][4].eventID, pages[0].event_id);
  assert.equal(browserEvent.event_id, pages[0].event_id);
  assert.equal(browserEvent.event_time, pages[0].event_time);
  assert.equal(pages[0].consent.source, 'operator_policy');
  assert.equal(pages[0].browser_id.ga_client_id, '123.456');
});

test('Pixel waits for SDK config before sending the original click', async t => {
  const first = Date.now() - 10000;
  const fbc = `fb.1.${first}.FirstClick`;
  const fbp = `fb.1.${first}.FirstBrowser`;
  const api = await fixture(t, undefined, { metaCookie: fbc, metaFbpCookie: fbp, pixelConfigLockMs: 1400 });
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  const before = await api.page.evaluate(id => ({
    locked: fbq.instance.locks.isLocked(),
    calls: __pixelIdentity.filter(call => call.id === id),
  }), event.event_id);
  assert.equal(before.locked, true);
  assert.deepEqual(before.calls, []);
  await api.page.waitForFunction(id => __pixelIdentity.some(call => call.id === id), event.event_id);
  const sent = await api.page.evaluate(id => __pixelIdentity.find(call => call.id === id), event.event_id);
  assert.ok(sent.cookie.includes(`_fbc=${fbc}`));
  assert.ok(sent.cookie.includes(`_fbp=${fbp}`));
});

test('a clicked PageView keeps the matching timestamp across host and domain _fbc cookies', async t => {
  const observedAt = Date.now() - 24 * 60 * 60 * 1000;
  const prior = `fb.1.${observedAt - 1000}.OtherClick`;
  const matching = `fb.1.${observedAt}.MatchingClick`;
  const fbp = `fb.1.${observedAt}.BrowserId.AQQCAQMC`;
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?fbclid=MatchingClick', {
    metaHostFbcCookie: prior,
    metaCookie: matching,
    metaFbpCookie: fbp,
  });
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.equal(event.click_id?.fbclid, 'MatchingClick');
  assert.ok(event.browser_id?.fbc?.startsWith(matching), JSON.stringify(event.browser_id));
  assert.equal(event.browser_id.fbc.split('.')[2], String(observedAt), 'existing click time must survive');
  await api.page.waitForFunction(id => __utekosMetaPixelState.dispatches[`PageView:${id}`], event.event_id);
  const delivered = await api.page.evaluate(id => ({
    pixel: __pixelIdentity.filter(call => call.id === id),
    cookie: document.cookie,
    dispatch: __utekosMetaPixelState.dispatches[`PageView:${id}`],
  }), event.event_id);
  assert.equal(delivered.pixel.length, 1, JSON.stringify({ ...delivered, browserId: event.browser_id }));
  assert.ok(delivered.cookie.split('; ').filter(part => part.startsWith('_fbc=')).every(part => part.includes('MatchingClick')));
});

test('same-click host and domain cookies retain the earliest original click time', async t => {
  const observedAt = Date.now() - 24 * 60 * 60 * 1000;
  const original = `fb.1.${observedAt}.MatchingClick`;
  const later = `fb.1.${observedAt + 1000}.MatchingClick`;
  for (const [hostCookie, domainCookie] of [[original, later], [later, original]]) {
    for (const initial of [
      'https://utekos.no/produkter/test-product?fbclid=MatchingClick',
      'https://utekos.no/produkter/test-product',
    ]) {
      const api = await fixture(t, initial, {
        metaHostFbcCookie: hostCookie,
        metaCookie: domainCookie,
        metaFbpCookie: `fb.1.${observedAt}.BrowserId.AQQCAQMC`,
      });
      await api.waitFor('page_view');
      const event = api.events('page_view')[0];
      assert.equal(event.browser_id?.fbc?.split('.')[2], String(observedAt));
      await api.page.waitForFunction(id => __utekosMetaPixelState.dispatches[`PageView:${id}`], event.event_id);
      const delivered = await api.page.evaluate(id => ({
        pixel: __pixelIdentity.filter(call => call.id === id),
        fbcCookies: document.cookie.split('; ').filter(part => part.startsWith('_fbc=')),
        dispatch: __utekosMetaPixelState.dispatches[`PageView:${id}`],
      }), event.event_id);
      assert.equal(delivered.pixel.length, 1, JSON.stringify({ delivered, browserId: event.browser_id }));
      assert.ok(delivered.fbcCookies.every(cookie => cookie.includes(String(observedAt))));
    }
  }
});

test('the first clicked PageView delivers the same identity to Pixel without preexisting _fbp', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?fbclid=FirstClick');
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  await api.page.waitForFunction(id => __utekosMetaPixelState.dispatches[`PageView:${id}`], event.event_id);
  const delivered = await api.page.evaluate(id => ({
    pixel: __pixelIdentity.filter(call => call.id === id),
    cookies: document.cookie,
    dispatch: __utekosMetaPixelState.dispatches[`PageView:${id}`],
  }), event.event_id);
  assert.equal(event.click_id?.fbclid, 'FirstClick');
  assert.equal(delivered.pixel.length, 1, JSON.stringify({ ...delivered, browserId: event.browser_id }));
  assert.ok(delivered.cookies.includes(`_fbc=${event.browser_id.fbc}`));
  assert.ok(delivered.cookies.includes(`_fbp=${event.browser_id.fbp}`));
});

test('a PageView without a click does not guess between distinct live _fbc cookies', async t => {
  const observedAt = Date.now() - 24 * 60 * 60 * 1000;
  const api = await fixture(t, 'https://utekos.no/produkter/test-product', {
    metaHostFbcCookie: `fb.1.${observedAt}.FirstClick`,
    metaCookie: `fb.1.${observedAt + 1}.SecondClick`,
  });
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.equal(event.browser_id?.fbc, undefined);
  assert.equal(event.click_id?.fbclid, undefined);
});

test('a live old _fbc cookie survives PageView and commerce without becoming a durable backup', async t => {
  const old = Date.now() - 174 * 24 * 60 * 60 * 1000;
  const fbc = `fb.1.${old}.LiveOldClick`;
  const api = await fixture(t, 'https://utekos.no/produkter/test-product', { metaCookie: fbc });
  await api.waitFor('page_view');
  await api.waitFor('view_item');
  await api.page.evaluate(value => {
    UtekosTrackingHarness.emitStorefrontAction('utekos:cart-mutation-confirmed', {
      id: 'old-cookie-mutation', event_time: new Date().toISOString(),
      cart_id: 'gid://shopify/Cart/fixture',
      changes: [{ event_name: 'add_to_cart', commerce: value }],
    });
  }, commerce());
  await api.waitFor('add_to_cart');
  const [pageView, viewItem, addToCart] = [
    api.events('page_view')[0], api.events('view_item')[0], api.events('add_to_cart')[0],
  ];
  for (const event of [pageView, viewItem, addToCart]) {
    assert.ok(event.browser_id?.fbc?.startsWith(fbc), event.event_name);
    assert.equal(event.click_id?.fbclid, 'LiveOldClick');
  }
  await api.page.waitForFunction(id => __pixelIdentity.some(call => call.id === id), addToCart.event_id);
  const pixel = await api.page.evaluate(id => __pixelIdentity.find(call => call.id === id), addToCart.event_id);
  assert.ok(pixel.cookie.includes(`_fbc=${fbc}`));
  const before = await api.page.evaluate(() => ({
    cookie: document.cookie,
    backup: JSON.parse(localStorage.getItem('utekos_meta_identifiers_v2') ?? '{}').fbc,
  }));
  assert.ok(before.cookie.includes(`_fbc=${fbc}`));
  assert.equal(before.backup, undefined, 'an old creation timestamp does not extend storage backup life');

  await api.page.context().clearCookies({ name: '_fbc' });
  await api.page.evaluate(() => {
    history.pushState({}, '', '/produkter/test-product?variant=1');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await api.waitFor('page_view', 2);
  const later = api.events('page_view')[1];
  assert.equal(later.browser_id?.fbc, undefined);
  assert.equal(later.click_id?.fbclid, undefined);
});

test('Pixel sends a held event when its exact missing click cookie returns', async t => {
  const timestamp = Date.now() - 5000;
  const fbc = `fb.1.${timestamp}.RestoredClick`;
  const fbp = `fb.1.${timestamp}.RestoredBrowser`;
  const api = await fixture(t, undefined, { metaCookie: fbc, metaFbpCookie: fbp });
  await api.waitFor('page_view');
  const eventId = 'held-cookie-restoration';
  const missing = await api.page.evaluate(id => {
    const original = dataLayer.find(entry => entry?.event === 'page_view');
    document.cookie = '_fbc=; Domain=.utekos.no; Path=/; Max-Age=0';
    dispatchEvent(new CustomEvent('utekos:meta-canonical-browser-event', {
      detail: {
        ...original,
        event_id: id,
        canonical_event: { ...original.canonical_event, event_id: id },
      },
    }));
    return document.cookie;
  }, eventId);
  assert.ok(!missing.includes('_fbc='));
  await api.page.waitForTimeout(350);
  const before = await api.page.evaluate(id => ({
    sent: __utekosMetaPixelState.sent[`PageView:${id}`],
    pixel: __pixelIdentity.some(entry => entry.id === id),
  }), eventId);
  assert.equal(before.sent, undefined);
  assert.equal(before.pixel, false);

  await api.page.evaluate(value => {
    document.cookie = `_fbc=${value}; Domain=.utekos.no; Path=/`;
  }, fbc);
  await api.page.waitForFunction(id => __pixelIdentity.some(entry => entry.id === id), eventId);
  const pixel = await api.page.evaluate(id => __pixelIdentity.find(entry => entry.id === id), eventId);
  assert.ok(pixel.cookie.includes(`_fbc=${fbc}`));
  assert.ok(pixel.cookie.includes(`_fbp=${fbp}`));
});

test('Pixel keeps an old click out of the SDK queue when a new click arrives', async t => {
  const first = Date.now() - 10000;
  const fbc = `fb.1.${first}.FirstClick`;
  const fbp = `fb.1.${first}.FirstBrowser`;
  const api = await fixture(t, undefined, { metaCookie: fbc, metaFbpCookie: fbp, pixelConfigLockMs: 1400 });
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.ok(event.browser_id.fbc.startsWith(fbc));
  assert.equal(await api.page.evaluate(() => fbq.instance.locks.isLocked()), true);
  await api.page.evaluate(() => {
    const second = Date.now();
    document.cookie = `_fbc=fb.1.${second}.SecondClick; Path=/`;
    document.cookie = `_fbp=fb.1.${second}.SecondBrowser; Path=/`;
  });
  await api.page.waitForTimeout(1700);
  const state = await api.page.evaluate(id => ({
    calls: __pixelIdentity.filter(call => call.id === id),
    queued: fbq.queue.some(call => call[4]?.eventID === id),
    dispatch: __utekosMetaPixelState.dispatches[`PageView:${id}`],
    cookie: document.cookie,
  }), event.event_id);
  assert.deepEqual(state.calls, [], JSON.stringify(state));
  assert.equal(state.dispatch?.skipped, 'different_live_meta_identity', JSON.stringify(state));
  assert.equal(state.queued, false);
  assert.ok(api.events('page_view')[0].browser_id.fbc.startsWith(fbc), 'CAPI event retains the first click');
  const skipLogs = api.requests.filter(request => request.path === '/api/log' &&
    request.body?.data?.message === 'meta.pixel.skipped: different_live_meta_identity');
  assert.equal(skipLogs.length, 1);
  assert.equal(JSON.stringify(skipLogs[0].body).includes(fbc), false);
});

test('Pixel does not attach a later click to a PageView without fbc', async t => {
  const api = await fixture(t, undefined, { pixelConfigLockMs: 1400 });
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.equal(event.browser_id.fbc, undefined);
  await api.page.evaluate(() => {
    document.cookie = `_fbc=fb.1.${Date.now()}.LaterClick; Path=/`;
  });
  await api.page.waitForFunction(id =>
    __utekosMetaPixelState.dispatches[`PageView:${id}`]?.skipped === 'different_live_meta_identity', event.event_id);
  const calls = await api.page.evaluate(id => __pixelIdentity.filter(call => call.id === id), event.event_id);
  assert.deepEqual(calls, []);
});

test('Pixel observes a second tab cookie change before releasing the first tab event', async t => {
  const first = Date.now() - 10000;
  const fbc = `fb.1.${first}.FirstTabClick`;
  const fbp = `fb.1.${first}.FirstTabBrowser`;
  const api = await fixture(t, undefined, { metaCookie: fbc, metaFbpCookie: fbp, pixelConfigLockMs: 3000 });
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.equal(await api.page.evaluate(() => fbq.instance.locks.isLocked()), true);
  const second = await api.page.context().newPage();
  await second.goto('https://utekos.no/produkter/test-product?variant=2');
  await second.evaluate(() => {
    const clickTime = Date.now();
    document.cookie = `_fbc=fb.1.${clickTime}.SecondTabClick; Path=/`;
    document.cookie = `_fbp=fb.1.${clickTime}.SecondTabBrowser; Path=/`;
  });
  await api.page.waitForFunction(id =>
    __utekosMetaPixelState.dispatches[`PageView:${id}`]?.skipped === 'different_live_meta_identity', event.event_id);
  const calls = await api.page.evaluate(id => __pixelIdentity.filter(call => call.id === id), event.event_id);
  assert.deepEqual(calls, []);
});

test('Pixel leaves delivery to CAPI when SDK readiness cannot be verified', async t => {
  const api = await fixture(t, undefined, { pixelReadinessSignal: false });
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  await api.page.waitForFunction(id =>
    __utekosMetaPixelState.dispatches[`PageView:${id}`]?.skipped === 'pixel_sdk_readiness_unverifiable', event.event_id);
  const calls = await api.page.evaluate(id => __pixelIdentity.filter(call => call.id === id), event.event_id);
  assert.deepEqual(calls, []);
  assert.equal(api.events('page_view').length, 1);
  const skipLogs = api.requests.filter(request => request.path === '/api/log' &&
    request.body?.data?.message === 'meta.pixel.skipped: pixel_sdk_readiness_unverifiable');
  assert.equal(skipLogs.length, 1);
});

test('Pixel does not release a queued event after marketing withdrawal', async t => {
  const timestamp = Date.now() - 10000;
  const api = await fixture(t, undefined, {
    metaCookie: `fb.1.${timestamp}.ConsentClick`,
    metaFbpCookie: `fb.1.${timestamp}.ConsentBrowser`,
    pixelConfigLockMs: 1400,
  });
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.equal(await api.page.evaluate(() => fbq.instance.locks.isLocked()), true);
  await api.page.evaluate(async () => {
    const current = dataLayer.find(entry => entry?.event === 'page_view').canonical_event;
    await UtekosTrackingHarness.enrichCanonicalEventWithMetaAttribution({
      ...current, consent: { ...current.consent, marketing: 'denied' },
    });
    window.__utekosConsentReloading = true;
  });
  await api.page.waitForTimeout(1700);
  const state = await api.page.evaluate(id => ({
    calls: __pixelIdentity.filter(call => call.id === id),
    queued: fbq.queue.some(call => call[4]?.eventID === id),
  }), event.event_id);
  assert.deepEqual(state.calls, []);
  assert.equal(state.queued, false);
});

test('Pixel cancels a queued event when a canonical event withdraws marketing consent', async t => {
  const timestamp = Date.now() - 10000;
  const api = await fixture(t, undefined, {
    metaCookie: `fb.1.${timestamp}.ConsentClick`,
    metaFbpCookie: `fb.1.${timestamp}.ConsentBrowser`,
    pixelConfigLockMs: 1400,
  });
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.equal(await api.page.evaluate(() => fbq.instance.locks.isLocked()), true);
  await api.page.evaluate(() => {
    const entry = dataLayer.find(item => item?.event === 'page_view');
    const deniedId = crypto.randomUUID();
    window.dispatchEvent(new CustomEvent('utekos:meta-canonical-browser-event', {
      detail: {
        ...entry,
        event_id: deniedId,
        canonical_event: {
          ...entry.canonical_event,
          event_id: deniedId,
          consent: { ...entry.canonical_event.consent, marketing: 'denied' },
        },
      },
    }));
  });
  await api.page.waitForTimeout(1700);
  const state = await api.page.evaluate(id => ({
    calls: __pixelIdentity.filter(call => call.id === id),
    dispatch: __utekosMetaPixelState.dispatches[`PageView:${id}`],
  }), event.event_id);
  assert.deepEqual(state.calls, []);
  assert.equal(state.dispatch?.skipped, 'marketing_consent_withdrawn');
});

test('Pixel cancels a missing-cookie wait when marketing consent is withdrawn', async t => {
  const timestamp = Date.now() - 5000;
  const fbc = `fb.1.${timestamp}.ConsentCookieClick`;
  const fbp = `fb.1.${timestamp}.ConsentCookieBrowser`;
  const api = await fixture(t, undefined, { metaCookie: fbc, metaFbpCookie: fbp });
  await api.waitFor('page_view');
  const eventId = 'held-consent-cookie';
  await api.page.evaluate(id => {
    const original = dataLayer.find(entry => entry?.event === 'page_view');
    document.cookie = '_fbc=; Domain=.utekos.no; Path=/; Max-Age=0';
    const held = {
      ...original,
      event_id: id,
      canonical_event: { ...original.canonical_event, event_id: id },
    };
    window.dispatchEvent(new CustomEvent('utekos:meta-canonical-browser-event', { detail: held }));
    window.dispatchEvent(new CustomEvent('utekos:meta-canonical-browser-event', {
      detail: {
        ...held,
        canonical_event: {
          ...held.canonical_event,
          consent: { ...held.canonical_event.consent, marketing: 'denied' },
        },
      },
    }));
  }, eventId);
  await api.page.evaluate(value => {
    document.cookie = `_fbc=${value}; Domain=.utekos.no; Path=/`;
  }, fbc);
  await api.page.waitForTimeout(450);
  const state = await api.page.evaluate(id => ({
    calls: __pixelIdentity.filter(call => call.id === id),
    dispatch: __utekosMetaPixelState.dispatches[`PageView:${id}`],
  }), eventId);
  assert.deepEqual(state.calls, []);
  assert.equal(state.dispatch?.skipped, 'marketing_consent_withdrawn');
});

for (const safariMode of [false, true]) {
  const engine = safariMode ? 'WebKit' : 'Chromium';
  test(`${engine}: cold Google initialization after 500 ms enriches first events without delaying Pixel`, async t => {
    const api = await fixture(t, undefined, { gaDelay: 1250, safariMode });
    await api.page.waitForFunction(() => window.__canonicalBrowser.some(entry => entry.event === 'page_view'));
    assert.equal(api.events('page_view').length, 0, 'collector waits while Google is not ready');
    const early = await api.page.evaluate(() => ({
      event: window.__canonicalBrowser.find(entry => entry.event === 'page_view').canonical_event,
      time: performance.now(), readyAt: window.__gaReadyAt,
    }));
    assert.ok(early.time < early.readyAt, 'Pixel dispatch precedes Google readiness');
    await api.waitFor('page_view'); await api.waitFor('view_item');
    for (const name of ['page_view', 'view_item']) {
      const events = api.events(name);
      assert.equal(events.length, 1);
      assert.equal(events[0].browser_id.ga_client_id, '123.456');
      assert.equal(events[0].browser_id.ga_session_id, '789');
      const dataLayer = await api.page.evaluate(name => window.dataLayer.find(entry => entry.event === name).canonical_event, name);
      assert.equal(dataLayer.browser_id.ga_client_id, events[0].browser_id.ga_client_id);
      assert.equal(dataLayer.browser_id.ga_session_id, events[0].browser_id.ga_session_id);
      assert.equal(dataLayer.event_id, events[0].event_id);
    }
    assert.equal(api.events('page_view')[0].event_id, early.event.event_id);
    assert.equal(api.events('page_view')[0].event_time, early.event.event_time);
    assert.ok(early.event.browser_id.fbp);
    assert.equal(api.events('page_view')[0].browser_id.fbp, early.event.browser_id.fbp, 'Google enrichment preserves Meta IDs');
    const gets = await api.page.evaluate(() => window.__gaGetCount);
    assert.ok(gets <= 14, `first page/product share one readiness attempt (${gets} get commands)`);
    await api.page.waitForTimeout(300);
    assert.equal(await api.page.evaluate(() => window.__gaGetCount), gets, 'retry timers stop after success');
  });

  test(`${engine}: pagehide flushes a blocked Google wait once with original identity`, async t => {
    const api = await fixture(t, undefined, { gaBlocked: true, safariMode });
    await api.page.waitForFunction(() => window.__canonicalBrowser.some(entry => entry.event === 'page_view'));
    const early = await api.page.evaluate(() => {
      const event = window.__canonicalBrowser.find(entry => entry.event === 'page_view').canonical_event;
      dispatchEvent(new PageTransitionEvent('pagehide'));
      return event;
    });
    await api.waitFor('page_view');
    const event = api.events('page_view')[0];
    assert.equal(event.event_id, early.event_id);
    assert.equal(event.event_time, early.event_time);
    assert.equal(event.browser_id.ga_client_id, undefined);
    assert.equal(event.browser_id.ga_session_id, undefined);
    await api.page.waitForTimeout(300);
    assert.equal(api.events('page_view').length, 1);
  });
}

test('blocked Google readiness times out without inventing IDs or stopping delivery', async t => {
  const api = await fixture(t, undefined, { gaBlocked: true });
  await api.waitFor('page_view'); await api.waitFor('view_item');
  assert.equal(api.events('page_view').length, 1);
  assert.equal(api.events('page_view')[0].browser_id.ga_client_id, undefined);
  assert.equal(api.events('page_view')[0].browser_id.ga_session_id, undefined);
  const gets = await api.page.evaluate(() => window.__gaGetCount);
  await api.page.waitForTimeout(300);
  assert.equal(await api.page.evaluate(() => window.__gaGetCount), gets);
});

for (const gaBlocked of [false, true]) {
test(`checkout preparation uses the identity budget and remains bounded (blocked=${gaBlocked})`, async t => {
  const api = await fixture(t, undefined, { gaBlocked, gaDelay: 1250 });
  const result = await api.page.evaluate(async commerce => {
    const start = performance.now();
    const event = await UtekosTrackingHarness.prepareCanonicalCheckout({
      id: 'gid://shopify/Cart/fixture', commerce,
      checkout: { checkout_id: 'fixture-checkout', creation_revision: 'fixture-revision' },
    }, 'shopify');
    const preparedMs = performance.now() - start;
    await UtekosTrackingHarness.confirmCheckoutTracking(event);
    return { event, preparedMs, totalMs: performance.now() - start };
  }, commerce());
  assert.ok(result.preparedMs < 2600, `preparation: ${result.preparedMs} ms`);
  assert.ok(result.totalMs < 3100, `confirmation: ${result.totalMs} ms`);
  await api.waitFor('begin_checkout');
  assert.equal(api.events('begin_checkout').length, 1);
  assert.equal(api.events('begin_checkout')[0].event_id, result.event.event_id);
  assert.equal(api.events('begin_checkout')[0].event_time, result.event.event_time);
  assert.equal(api.events('begin_checkout')[0].browser_id.ga_client_id, gaBlocked ? undefined : '123.456');
});
}

for (const safariMode of [false, true]) {
test(`Meta first dispatch and immediate checkout retain a delayed in-app click (webkit=${safariMode})`, async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product', { metaBackupDelay: 1900, safariMode });
  // Start checkout while the first PageView's native SDK collection is pending.
  const checkout = await api.page.evaluate(async commerce => {
    const event = await UtekosTrackingHarness.prepareCanonicalCheckout({
      id: 'gid://shopify/Cart/fixture', commerce,
      checkout: { checkout_id: 'fixture-checkout', creation_revision: 'fixture-revision' },
    }, 'shopify');
    await UtekosTrackingHarness.confirmCheckoutTracking(event);
    return event;
  }, commerce());
  await api.waitFor('page_view'); await api.waitFor('view_item'); await api.waitFor('begin_checkout');
  const state = await api.page.evaluate(() => ({
    calls: __pixelIdentity, canonical: __canonicalBrowser, backupCalls: __metaBackupCalls,
  }));
  const first = api.events('page_view')[0];
  assert.match(first.browser_id.fbc, /^fb\.\d+\.\d+\.OfflineBackupClick\./);
  assert.equal(checkout.browser_id.fbc, first.browser_id.fbc, 'checkout preserves complete fbc including timestamp');
  for (const [eventName, pixelName] of [['page_view', 'PageView'], ['view_item', 'ViewContent'], ['begin_checkout', 'InitiateCheckout']]) {
    const sent = api.events(eventName);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].browser_id.fbc, first.browser_id.fbc);
    const browserEvent = state.canonical.find(entry => entry.event === eventName).canonical_event;
    assert.equal(browserEvent.browser_id.fbc, first.browser_id.fbc);
    assert.equal(browserEvent.event_id, sent[0].event_id);
    const pixels = state.calls.filter(call => call.name === pixelName);
    assert.equal(pixels.length, 1);
    assert.equal(pixels[0].id, sent[0].event_id);
    assert.ok(pixels[0].cookie.includes(first.browser_id.fbc));
  }
  assert.equal(state.backupCalls, 1, 'concurrent events share one SDK collection');
  assert.equal(api.requests.filter(r => r.path === '/api/meta/client-ip').length, 1);
});
}

test('Meta first dispatch keeps URL click and collected IP when IP takes longer than 1.5 seconds', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?fbclid=OfflineUrlClick', { metaIpDelay: 1900 });
  await api.waitFor('page_view'); await api.waitFor('view_item');
  const first = api.events('page_view')[0];
  assert.match(first.browser_id.fbc, /\.OfflineUrlClick\./);
  const state = await api.page.evaluate(() => ({ cookie: document.cookie, calls: __pixelIdentity, backupCalls: __metaBackupCalls }));
  assert.match(state.cookie, /_fbi=192\.0\.2\.1/);
  assert.equal(state.backupCalls, 0);
  assert.ok(state.calls.find(call => call.name === 'PageView').cookie.includes('_fbi='));
  assert.equal(api.requests.filter(r => r.path === '/api/meta/client-ip').length, 1);
});

for (const safariMode of [false, true]) {
test(`Meta recovered click replaces stale raw click through checkout (webkit=${safariMode})`, async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product', {
    metaBackupDelay: 150, safariMode, storedClicks: { fbclid: 'OfflinePreviousClick', ttclid: 'OfflineTikTokClick' },
  });
  await api.waitFor('page_view'); await api.waitFor('view_item');
  const checkout = await api.page.evaluate(async commerce => UtekosTrackingHarness.prepareCanonicalCheckout({
    id: 'gid://shopify/Cart/fixture', commerce,
    checkout: { checkout_id: 'fixture-checkout', creation_revision: 'fixture-revision' },
  }, 'shopify'), commerce());
  const first = api.events('page_view')[0];
  for (const event of [first, api.events('view_item')[0], checkout]) {
    assert.equal(event.click_id.fbclid, 'OfflineBackupClick');
    assert.equal(event.click_id.ttclid, 'OfflineTikTokClick');
    assert.equal(event.browser_id.fbc, first.browser_id.fbc);
  }
  const stored = await api.page.evaluate(() => ({
    session: JSON.parse(sessionStorage.getItem('utekos_click_ids')),
    local: JSON.parse(localStorage.getItem('utekos_click_ids_v1')).identifiers,
  }));
  assert.equal(stored.session.fbclid, 'OfflineBackupClick');
  assert.equal(stored.local.fbclid, 'OfflineBackupClick');
  const browserEvent = await api.page.evaluate(() => __canonicalBrowser.find(e => e.event === 'page_view').canonical_event);
  assert.equal(browserEvent.click_id.fbclid, first.click_id.fbclid);
  assert.equal(browserEvent.browser_id.fbc, first.browser_id.fbc);
});
}

test('Meta restored cookie takes precedence over stale raw storage, while a new URL click wins both', async t => {
  const timestamp = Date.now();
  const cookie = `fb.1.${timestamp}.OfflineRestoredClick`;
  const api = await fixture(t, 'https://utekos.no/produkter/test-product', {
    metaCookie: cookie, storedClicks: { fbclid: 'OfflinePreviousClick' },
  });
  await api.waitFor('page_view');
  assert.equal(api.events('page_view')[0].click_id.fbclid, 'OfflineRestoredClick');
  assert.equal(api.events('page_view')[0].browser_id.fbc.split('.')[2], String(timestamp));
  await api.page.evaluate(() => { history.pushState({}, '', '/produkter/test-product?fbclid=OfflineNewUrlClick'); dispatchEvent(new PopStateEvent('popstate')); });
  await api.waitFor('page_view', 2);
  const current = api.events('page_view')[1];
  assert.equal(current.click_id.fbclid, 'OfflineNewUrlClick');
  assert.match(current.browser_id.fbc, /\.OfflineNewUrlClick\./);
  assert.equal(await api.page.evaluate(() => JSON.parse(sessionStorage.getItem('utekos_click_ids')).fbclid), 'OfflineNewUrlClick');
});

for (const invalidFbclid of ['X'.repeat(501), '%ZZ']) {
test(`Meta rejects invalid URL fbclid without losing a valid click (${invalidFbclid.length > 500 ? 'oversized' : 'malformed'})`, async t => {
  const cookie = `fb.1.${Date.now()}.OfflineValidClick`;
  const api = await fixture(t, `https://utekos.no/produkter/test-product?fbclid=${invalidFbclid}`, { metaCookie: cookie });
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.equal(event.browser_id.fbc, cookie);
  assert.equal(event.click_id.fbclid, 'OfflineValidClick');
  const persisted = await api.page.evaluate(() => ({
    session: JSON.parse(sessionStorage.getItem('utekos_click_ids'))?.fbclid,
    cookie: document.cookie,
  }));
  assert.equal(persisted.session, 'OfflineValidClick');
  assert.ok(persisted.cookie.includes(`_fbc=${cookie}`));
  assert.ok(event.page_url.includes('fbclid='), 'canonical page URL remains the observed URL');
  assert.ok(api.requests.some(r => r.path === '/api/meta/parameter-context' && !new URL(r.body.page_url).searchParams.has('fbclid')),
    'server fallback receives a URL without the invalid click');
});
test(`Meta invalid URL fbclid is not stored or sent without a prior cookie (${invalidFbclid.length > 500 ? 'oversized' : 'malformed'})`, async t => {
  const api = await fixture(t, `https://utekos.no/produkter/test-product?fbclid=${invalidFbclid}`, {
    storedClicks: { fbclid: 'Y'.repeat(501), ttclid: 'OfflineTikTokClick' },
    storedDurableClicks: { fbclid: 'Y'.repeat(501), epik: 'OfflinePinterestClick' },
    metaContextFbp: `fb.1.${Date.now()}.123456789`,
  });
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.equal(event.browser_id?.fbc, undefined);
  assert.equal(event.click_id?.fbclid, undefined);
  assert.equal(event.click_id?.ttclid, 'OfflineTikTokClick');
  assert.equal(event.click_id?.epik, 'OfflinePinterestClick');
  assert.ok(event.browser_id?.fbp, 'Meta browser ID still arrives through the server fallback');
  const persisted = await api.page.evaluate(() => ({
    session: JSON.parse(sessionStorage.getItem('utekos_click_ids')),
    durable: JSON.parse(localStorage.getItem('utekos_click_ids_v1')),
  }));
  assert.equal(persisted.session.fbclid, undefined);
  assert.equal(persisted.durable.identifiers.fbclid, undefined);
  assert.equal(persisted.durable.identifiers.epik, 'OfflinePinterestClick');
  assert.ok(api.requests.some(r => r.path === '/api/meta/parameter-context' && !new URL(r.body.page_url).searchParams.has('fbclid')),
    'server fallback receives a URL without the invalid click');
});
}

test('Meta accepts a 500-character URL click at the SDK boundary', async t => {
  const click = 'Z'.repeat(500);
  const api = await fixture(t, `https://utekos.no/produkter/test-product?fbclid=${click}`);
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.equal(event.click_id.fbclid, click);
  assert.equal(event.browser_id.fbc.split('.')[3], click);
});

test('Meta chooses the first literal fbclid query key over an earlier encoded key', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?%66bclid=EncodedKeyClick&fbclid=LiteralClick');
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.equal(event.click_id.fbclid, 'LiteralClick');
  assert.equal(event.browser_id.fbc.split('.')[3], 'LiteralClick');
  assert.equal(await api.page.evaluate(() => JSON.parse(sessionStorage.getItem('utekos_click_ids')).fbclid), 'LiteralClick');
});

for (const invalidFirst of ['%ZZ', '%20%20']) {
test(`Meta rejects an invalid first literal fbclid even when a later duplicate is valid (${invalidFirst})`, async t => {
  const api = await fixture(t, `https://utekos.no/produkter/test-product?fbclid=${invalidFirst}&fbclid=LaterClick`, {
    metaContextFbp: `fb.1.${Date.now()}.123456789`,
  });
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.equal(event.click_id?.fbclid, undefined);
  assert.equal(event.browser_id?.fbc, undefined);
  assert.ok(event.browser_id?.fbp);
  assert.equal(await api.page.evaluate(() => JSON.parse(sessionStorage.getItem('utekos_click_ids'))?.fbclid), undefined);
});
}

test('Meta accepts an encoded percent sign as an opaque click byte', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?fbclid=%25ZZ');
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.equal(event.click_id.fbclid, '%ZZ');
  assert.equal(event.browser_id.fbc.split('.')[3], '%ZZ');
});

for (const safariMode of [false, true]) {
for (const cookieMutation of ['deleted', 'reminted']) {
test(`Meta preserves first PageView identifiers when browser cookies are ${cookieMutation} before product view (webkit=${safariMode})`, async t => {
  const fbc = `fb.1.${Date.now()}.OfflineLandingClick.AQQCAQMC`;
  const fbp = `fb.1.${Date.now()}.123456789.AQQCAQMC`;
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?fbclid=OfflineLandingClick', {
    deferCommerce: true, deferObservers: true, metaCookie: fbc, metaFbpCookie: fbp, safariMode,
  });
  await api.waitFor('page_view');
  const pageView = api.events('page_view')[0];
  assert.equal(pageView.browser_id.fbc, fbc);
  assert.equal(pageView.browser_id.fbp, fbp);
  assert.equal(api.events('view_item').length, 0);

  const afterMutation = await api.page.evaluate(mutation => {
    if (mutation === 'deleted') {
      document.cookie = '_fbc=; Domain=.utekos.no; Path=/; Max-Age=0';
      document.cookie = '_fbp=; Domain=.utekos.no; Path=/; Max-Age=0';
    } else {
      const remintedAt = Date.now() + 1000;
      document.cookie = `_fbc=fb.1.${remintedAt}.OfflineLandingClick.AQYCAQMC; Domain=.utekos.no; Path=/`;
      document.cookie = `_fbp=fb.1.${remintedAt}.987654321.AQYCAQMC; Domain=.utekos.no; Path=/`;
    }
    return document.cookie;
  }, cookieMutation);
  assert.ok(!afterMutation.includes(`_fbc=${fbc}`), 'the original click cookie is absent before product view');
  assert.ok(!afterMutation.includes(`_fbp=${fbp}`), 'the original browser cookie is absent before product view');
  await api.page.evaluate(() => { window.__stopObservers = UtekosTrackingHarness.observeTrackedPage(); });
  await api.waitFor('view_item');
  const productView = api.events('view_item')[0];
  assert.equal(productView.browser_id.fbc, fbc, 'the original click timestamp survives');
  assert.equal(productView.browser_id.fbp, fbp, 'the original browser ID survives');
  const pixel = await api.page.evaluate(() => __pixelIdentity.find(p => p.name === 'ViewContent'));
  assert.ok(pixel?.cookie.includes(`_fbc=${fbc}`), 'Pixel can read the restored click cookie');
  assert.ok(pixel?.cookie.includes(`_fbp=${fbp}`), 'Pixel can read the restored browser cookie');
});
}
}

for (const safariMode of [false, true]) {
test(`Meta preserves the first click timestamp across a document navigation after cookie loss (webkit=${safariMode})`, async t => {
  const fbc = `fb.1.${Date.now()}.OfflineLandingClick.AQQCAQMC`;
  const fbp = `fb.1.${Date.now()}.123456789.AQQCAQMC`;
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?fbclid=OfflineLandingClick', {
    deferObservers: true, metaCookie: fbc, metaFbpCookie: fbp, safariMode,
  });
  await api.waitFor('page_view');
  assert.equal(api.events('page_view')[0].browser_id.fbc, fbc);
  await api.page.evaluate(() => {
    document.cookie = '_fbc=; Domain=.utekos.no; Path=/; Max-Age=0';
    document.cookie = '_fbp=; Domain=.utekos.no; Path=/; Max-Age=0';
  });
  await api.page.reload();
  await api.waitFor('page_view');
  await api.page.waitForFunction(() => window.__canonicalBrowser.some(e => e.event === 'page_view'));
  assert.equal(api.events('page_view').length, 2);
  assert.equal(api.events('page_view')[1].browser_id.fbc, fbc);
  assert.equal(api.events('page_view')[1].browser_id.fbp, fbp);
  const pixel = await api.page.evaluate(() => __pixelIdentity.find(p => p.name === 'PageView'));
  assert.ok(pixel?.cookie.includes(`_fbc=${fbc}`));
  assert.ok(pixel?.cookie.includes(`_fbp=${fbp}`));
});
}

for (const safariMode of [false, true]) {
test(`Meta restores the original full identifiers in a new tab after cookie loss (webkit=${safariMode})`, async t => {
  const timestamp = Date.now();
  const fbc = `fb.1.${timestamp}.OfflineLandingClick.AQQCAQMC`;
  const fbp = `fb.1.${timestamp}.123456789.AQQCAQMC`;
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?fbclid=OfflineLandingClick', {
    metaCookie: fbc, metaFbpCookie: fbp, safariMode,
  });
  await api.waitFor('page_view');
  assert.equal(api.events('page_view')[0].browser_id.fbc, fbc);
  assert.equal(await api.page.evaluate(() => JSON.parse(localStorage.getItem('utekos_meta_identifiers_v2')).fbc), fbc);
  await api.page.evaluate(() => {
    document.cookie = '_fbc=; Domain=.utekos.no; Path=/; Max-Age=0';
    document.cookie = '_fbp=; Domain=.utekos.no; Path=/; Max-Age=0';
  });
  const context = api.page.context();
  await api.page.close();
  const second = await context.newPage();
  await second.goto('https://utekos.no/produkter/test-product');
  await second.waitForFunction(() => window.dataLayer.some(entry => entry?.event === 'page_view'));
  await second.waitForFunction(() => window.__pixelIdentity.some(entry => entry.name === 'PageView'));
  const latest = api.events('page_view').at(-1);
  assert.equal(latest.browser_id.fbc, fbc);
  assert.equal(latest.browser_id.fbp, fbp);
  const pixelCookie = await second.evaluate(() => window.__pixelIdentity.find(entry => entry.name === 'PageView')?.cookie);
  assert.ok(pixelCookie.includes(`_fbc=${fbc}`));
  assert.ok(pixelCookie.includes(`_fbp=${fbp}`));
});
}

test('Meta session backup yields to a new URL click on the next document', async t => {
  const timestamp = Date.now();
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?fbclid=OfflineOldClick', {
    deferObservers: true,
    metaCookie: `fb.1.${timestamp}.OfflineOldClick.AQQCAQMC`,
    metaFbpCookie: `fb.1.${timestamp}.123456789.AQQCAQMC`,
  });
  await api.waitFor('page_view');
  await api.page.evaluate(() => {
    document.cookie = '_fbc=; Domain=.utekos.no; Path=/; Max-Age=0';
  });
  await api.page.goto('https://utekos.no/produkter/test-product?fbclid=OfflineNewClick');
  await api.waitFor('page_view');
  assert.equal(api.events('page_view').length, 2);
  const current = api.events('page_view')[1];
  assert.equal(current.click_id.fbclid, 'OfflineNewClick');
  assert.match(current.browser_id.fbc, /\.OfflineNewClick\./);
  assert.ok(!current.browser_id.fbc.includes('OfflineOldClick'));
  assert.equal(await api.page.evaluate(() => JSON.parse(localStorage.getItem('utekos_meta_identifiers_v2')).fbc), current.browser_id.fbc);
});

test('marketing withdrawal clears Meta backups, click storage and first-party cookies', async t => {
  const timestamp = Date.now();
  const fbc = `fb.1.${timestamp}.OfflineLandingClick.AQQCAQMC`;
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?fbclid=OfflineLandingClick', {
    metaCookie: fbc, metaFbpCookie: `fb.1.${timestamp}.123456789.AQQCAQMC`,
  });
  await api.waitFor('page_view');
  const state = await api.page.evaluate(async () => {
    const event = dataLayer.find(entry => entry?.event === 'page_view').canonical_event;
    await UtekosTrackingHarness.enrichCanonicalEventWithMetaAttribution({
      ...event, consent: { ...event.consent, marketing: 'denied' },
    });
    return {
      cookie: document.cookie,
      local: localStorage.getItem('utekos_meta_identifiers_v2'),
      session: sessionStorage.getItem('utekos_meta_identifiers_v1'),
      rawLocal: localStorage.getItem('utekos_click_ids_v1'),
      rawSession: sessionStorage.getItem('utekos_click_ids'),
    };
  });
  assert.equal(state.local, null);
  assert.equal(state.session, null);
  assert.equal(state.rawLocal, null);
  assert.equal(state.rawSession, null);
  assert.ok(!state.cookie.includes('_fbc='));
  assert.ok(!state.cookie.includes('_fbp='));
  await api.page.evaluate(() => { history.replaceState({}, '', '/produkter/test-product'); UtekosTrackingHarness.reportNavigation(); });
  await api.waitFor('page_view', 2);
  assert.equal(api.events('page_view')[1].browser_id?.fbc, undefined, 'regrant without a new click cannot revive withdrawn identity');
});

test('marketing withdrawal during native Meta collection leaves no late cookie or Meta ID', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product', {
    metaBackupDelay: 450, storedClicks: { fbclid: 'OfflinePreviousClick' },
  });
  await api.page.waitForFunction(() => window.__metaBackupCalls === 1);
  const denied = await api.page.evaluate(async () => {
    const current = UtekosTrackingHarness.createBrowserEvent('page_view', {});
    return UtekosTrackingHarness.enrichCanonicalEventWithMetaAttribution({
      ...current, consent: { ...current.consent, marketing: 'denied' },
    });
  });
  assert.equal(denied.consent.marketing, 'denied');
  assert.equal(denied.browser_id, undefined);
  assert.equal(denied.click_id, undefined);
  await api.page.waitForTimeout(650);
  const state = await api.page.evaluate(() => ({
    cookies: document.cookie,
    durable: localStorage.getItem('utekos_meta_identifiers_v2'),
    session: sessionStorage.getItem('utekos_meta_identifiers_v1'),
  }));
  assert.ok(!state.cookies.includes('_fbc='));
  assert.ok(!state.cookies.includes('_fbp='));
  assert.equal(state.durable, null);
  assert.equal(state.session, null);
  for (const event of api.events('page_view')) {
    assert.equal(event.browser_id?.fbc, undefined);
    assert.equal(event.browser_id?.fbp, undefined);
  }
});

for (const record of ['{invalid', JSON.stringify({ fbc: 'fb.1.1700000000000.ExpiredClick.AQQCAQMC' })]) {
test(`Meta ignores ${record === '{invalid' ? 'malformed' : 'expired'} durable backup and captures a fresh URL click`, async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product');
  await api.waitFor('page_view');
  await api.page.evaluate(value => {
    localStorage.setItem('utekos_meta_identifiers_v2', value);
    sessionStorage.removeItem('utekos_meta_identifiers_v1');
    document.cookie = '_fbc=; Domain=.utekos.no; Path=/; Max-Age=0';
  }, record);
  await api.page.reload();
  await api.waitFor('page_view');
  assert.equal(api.events('page_view').length, 2);
  assert.equal(api.events('page_view')[1].browser_id?.fbc, undefined);
  await api.page.goto('https://utekos.no/produkter/test-product?fbclid=OfflineFreshClick');
  await api.waitFor('page_view');
  assert.equal(api.events('page_view').length, 3);
  assert.match(api.events('page_view')[2].browser_id.fbc, /\.OfflineFreshClick\./);
});
}

test('restoring a durable Meta identifier does not extend its original 90-day expiry', async t => {
  const originalTime = Date.now() - 89 * 24 * 60 * 60 * 1000;
  const fbc = `fb.1.${originalTime}.OfflineAgedClick.AQQCAQMC`;
  const api = await fixture(t, 'https://utekos.no/produkter/test-product');
  await api.waitFor('page_view');
  await api.page.evaluate(value => {
    localStorage.setItem('utekos_meta_identifiers_v2', JSON.stringify({ fbc: value }));
    sessionStorage.removeItem('utekos_meta_identifiers_v1');
    document.cookie = '_fbc=; Domain=.utekos.no; Path=/; Max-Age=0';
  }, fbc);
  await api.page.reload();
  await api.waitFor('page_view');
  assert.equal(api.events('page_view').at(-1).browser_id.fbc, fbc);
  const firstExpiry = (await api.page.context().cookies()).find(cookie => cookie.name === '_fbc').expires;
  assert.ok(firstExpiry <= (originalTime + 90 * 24 * 60 * 60 * 1000) / 1000 + 1);
  await api.page.evaluate(() => UtekosTrackingHarness.dispatchEvent(UtekosTrackingHarness.createBrowserEvent('page_view', {})));
  await api.waitFor('page_view', 2);
  const nextExpiry = (await api.page.context().cookies()).find(cookie => cookie.name === '_fbc').expires;
  assert.ok(nextExpiry <= firstExpiry + 1, 'later events cannot refresh the original click lifetime');
});

test('an older event dispatched after a new URL click cannot roll back the current cookie', async t => {
  const timestamp = Date.now();
  const fbc = `fb.1.${timestamp}.OfflineOldClick.AQQCAQMC`;
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?fbclid=OfflineOldClick', { metaCookie: fbc });
  await api.waitFor('page_view');
  const oldEvent = await api.page.evaluate(() => UtekosTrackingHarness.createBrowserEvent('page_view', {}));
  await api.page.evaluate(() => {
    history.pushState({}, '', '/produkter/test-product?fbclid=OfflineNewClick');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await api.waitFor('page_view', 2);
  const newFbc = api.events('page_view')[1].browser_id.fbc;
  assert.match(newFbc, /\.OfflineNewClick\./);
  await api.page.evaluate(event => UtekosTrackingHarness.dispatchEvent(event), oldEvent);
  await api.waitFor('page_view', 3);
  assert.equal(api.events('page_view')[2].browser_id.fbc, fbc);
  assert.ok((await api.page.evaluate(() => document.cookie)).includes(`_fbc=${newFbc}`));
});

test('an old tab URL cannot overwrite a newer tab click, while a fresh navigation wins', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?fbclid=OfflineTabAClick');
  await api.waitFor('page_view');
  const tabA = api.page;
  const tabB = await tabA.context().newPage();
  await tabB.goto('https://utekos.no/produkter/test-product?fbclid=OfflineTabBClick');
  await tabB.waitForFunction(() => window.dataLayer.some(entry => entry?.event === 'page_view'));
  await tabB.waitForFunction(() => localStorage.getItem('utekos_meta_identifiers_v2')?.includes('OfflineTabBClick'));
  const tabBFbc = JSON.parse(await tabB.evaluate(() => localStorage.getItem('utekos_meta_identifiers_v2'))).fbc;
  assert.match(tabBFbc, /\.OfflineTabBClick\./);

  await tabA.evaluate(() => UtekosTrackingHarness.dispatchEvent(UtekosTrackingHarness.createBrowserEvent('page_view', {})));
  await api.waitFor('page_view', 2);
  const oldTabEvent = api.events('page_view').at(-1);
  assert.equal(oldTabEvent.browser_id.fbc, tabBFbc);
  assert.equal(oldTabEvent.click_id.fbclid, 'OfflineTabBClick');
  assert.equal(new URL(oldTabEvent.page_url).searchParams.has('fbclid'), false);
  assert.ok((await tabA.evaluate(() => document.cookie)).includes(`_fbc=${tabBFbc}`));
  assert.equal(JSON.parse(await tabA.evaluate(() => localStorage.getItem('utekos_meta_identifiers_v2'))).fbc, tabBFbc);

  await tabA.evaluate(() => {
    history.pushState({}, '', '/produkter/test-product?fbclid=OfflineTabCClick');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await api.waitFor('page_view', 3);
  const freshEvent = api.events('page_view').at(-1);
  assert.equal(freshEvent.click_id.fbclid, 'OfflineTabCClick');
  assert.equal(new URL(freshEvent.page_url).searchParams.get('fbclid'), 'OfflineTabCClick');
  assert.match(freshEvent.browser_id.fbc, /\.OfflineTabCClick\./);
  assert.equal(JSON.parse(await tabB.evaluate(() => localStorage.getItem('utekos_meta_identifiers_v2'))).fbc, freshEvent.browser_id.fbc);
});

test('an A landing created before B keeps its genuine URL click without inheriting B fbc', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?fbclid=OfflineTabALanding', {
    metaFirstIpDelay: 2200,
  });
  await api.page.waitForFunction(() => document.cookie.includes('OfflineTabALanding'));
  assert.equal(api.events('page_view').length, 0, 'A remains in flight before B arrives');
  const tabB = await api.page.context().newPage();
  await tabB.goto('https://utekos.no/produkter/test-product?fbclid=OfflineTabBClick');
  await tabB.waitForFunction(() => localStorage.getItem('utekos_meta_identifiers_v2')?.includes('OfflineTabBClick'));
  const tabBFbc = JSON.parse(await tabB.evaluate(() => localStorage.getItem('utekos_meta_identifiers_v2'))).fbc;
  await api.waitFor('page_view');
  const landing = api.events('page_view').find(event => new URL(event.page_url).searchParams.get('fbclid') === 'OfflineTabALanding');
  assert.ok(landing, 'the earlier A landing retains its real URL observation');
  assert.equal(landing.click_id.fbclid, 'OfflineTabALanding');
  assert.equal(landing.browser_id?.fbc, undefined, 'A cannot inherit later B fbc');
  assert.ok(Date.parse(landing.event_time) < Number(tabBFbc.split('.')[2]));
  assert.ok((await api.page.evaluate(() => document.cookie)).includes(`_fbc=${tabBFbc}`));
});

test('late native recovery in an old tab cannot undo a newer click in another tab', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product', {
    metaBackupDelay: 6500, storedClicks: { fbclid: 'OfflinePreviousClick' },
  });
  await api.page.waitForFunction(() => window.__metaBackupCalls === 1);
  const tabB = await api.page.context().newPage();
  await tabB.goto('https://utekos.no/produkter/test-product?fbclid=OfflineTabBClick');
  await tabB.waitForFunction(() => localStorage.getItem('utekos_meta_identifiers_v2')?.includes('OfflineTabBClick'));
  const tabBFbc = JSON.parse(await tabB.evaluate(() => localStorage.getItem('utekos_meta_identifiers_v2'))).fbc;
  await api.page.waitForTimeout(6700);
  assert.ok((await api.page.evaluate(() => document.cookie)).includes(`_fbc=${tabBFbc}`));
  assert.equal(JSON.parse(await api.page.evaluate(() => localStorage.getItem('utekos_meta_identifiers_v2'))).fbc, tabBFbc);
  const tabAEvents = () => api.events('page_view').filter(event => !event.page_url.includes('OfflineTabBClick'));
  assert.equal(tabAEvents().length, 1);
  assert.equal(tabAEvents()[0].browser_id?.fbc, undefined, 'A event created before B must not inherit B fbc');
  assert.equal(tabAEvents()[0].click_id?.fbclid, undefined, 'old raw storage cannot stand in for A fbc');
  assert.ok(Date.parse(tabAEvents()[0].event_time) < Number(tabBFbc.split('.')[2]));

  await api.page.evaluate(() => UtekosTrackingHarness.dispatchEvent(UtekosTrackingHarness.createBrowserEvent('page_view', {})));
  await api.waitFor('page_view', 2);
  assert.equal(tabAEvents().length, 2);
  assert.equal(tabAEvents()[1].browser_id.fbc, tabBFbc, 'a new A event after B may carry B');
  assert.equal(tabAEvents()[1].click_id.fbclid, 'OfflineTabBClick');
  assert.ok((await api.page.evaluate(() => document.cookie)).includes(`_fbc=${tabBFbc}`));
});

test('Meta late native collection preserves a newer navigation click', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product', {
    metaBackupDelay: 350, storedClicks: { fbclid: 'OfflinePreviousClick' },
  });
  await api.page.waitForFunction(() => __metaBackupCalls === 1);
  await api.page.evaluate(() => { history.pushState({}, '', '/produkter/test-product?fbclid=OfflineNewUrlClick'); dispatchEvent(new PopStateEvent('popstate')); });
  await api.waitFor('page_view', 2);
  const [first, next] = api.events('page_view');
  assert.equal(first.click_id.fbclid, 'OfflineBackupClick');
  assert.match(first.browser_id.fbc, /\.OfflineBackupClick\./);
  assert.equal(next.click_id.fbclid, 'OfflineNewUrlClick');
  assert.match(next.browser_id.fbc, /\.OfflineNewUrlClick\./);
  const stored = await api.page.evaluate(() => ({ session: JSON.parse(sessionStorage.getItem('utekos_click_ids')), cookie: document.cookie }));
  assert.equal(stored.session.fbclid, 'OfflineNewUrlClick');
  assert.match(stored.cookie, /\.OfflineNewUrlClick\./);
  const pixels = await api.page.evaluate(() => __pixelIdentity.filter(p => p.name === 'PageView'));
  assert.equal(pixels.length, 2);
  for (const event of [first, next]) {
    assert.ok(pixels.find(p => p.id === event.event_id)?.cookie.includes(event.browser_id.fbc), 'Pixel reads the fbc belonging to this canonical navigation');
  }
});

test('Meta cannot remint an expired stored click with a new observation timestamp', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product', {
    metaCookiesBlocked: true, storedClicks: { fbclid: 'OfflinePreviousClick' },
  });
  await api.waitFor('page_view');
  assert.equal(api.events('page_view')[0].browser_id.fbc, undefined);
  assert.ok(api.requests.some(r => r.path === '/api/meta/parameter-context'), 'exercise the server fallback with unavailable cookies');
  assert.equal(api.requests.some(r => r.path === '/api/meta/parameter-context' && r.body.fbclid === 'OfflinePreviousClick'), false);
});

test('Meta rejects a stale server fallback cookie when the event has a newer URL click', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?fbclid=OfflineNewUrlClick', {
    metaCookiesBlocked: true, metaContextFbc: 'fb.1.1700000000000.OfflinePreviousClick',
  });
  await api.waitFor('page_view');
  const event = api.events('page_view')[0];
  assert.equal(event.click_id.fbclid, 'OfflineNewUrlClick');
  assert.equal(event.browser_id.fbc, undefined, 'an old click is not substituted for the new URL click');
  assert.equal(api.requests.find(r => r.path === '/api/meta/parameter-context').body.fbclid, 'OfflineNewUrlClick');
});

for (const safariMode of [false, true]) {
test(`Meta late native response preserves the newer server cookie and timestamp (webkit=${safariMode})`, async t => {
  const fresh = 'fb.1.1791974000000.OfflineNewUrlClick';
  const api = await fixture(t, 'https://utekos.no/produkter/test-product', {
    metaBackupDelay: 6500, metaContextFbc: fresh, safariMode,
  });
  await api.page.waitForFunction(() => __metaBackupCalls === 1);
  await api.page.evaluate(() => { history.pushState({}, '', '/produkter/test-product?fbclid=OfflineNewUrlClick'); dispatchEvent(new PopStateEvent('popstate')); });
  await api.waitFor('page_view', 2);
  assert.equal(api.events('page_view')[1].browser_id.fbc, fresh);
  await api.page.waitForTimeout(1800);
  const current = await api.page.evaluate(() => ({ cookie: document.cookie, click: JSON.parse(sessionStorage.getItem('utekos_click_ids')).fbclid }));
  assert.ok(current.cookie.includes(fresh), 'late native completion preserves newer click and original timestamp');
  assert.equal(current.click, 'OfflineNewUrlClick');
  assert.equal(api.events('page_view').length, 2, 'late result does not replay either navigation');
});
}

test('Meta unavailable native bridge releases checkout once and does not queue repeated collection timeouts', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product', { metaBackupBlocked: true });
  const result = await api.page.evaluate(async commerce => {
    const start = performance.now();
    const event = await UtekosTrackingHarness.prepareCanonicalCheckout({
      id: 'gid://shopify/Cart/fixture', commerce,
      checkout: { checkout_id: 'fixture-checkout', creation_revision: 'fixture-revision' },
    }, 'shopify');
    await UtekosTrackingHarness.confirmCheckoutTracking(event);
    return { event, elapsed: performance.now() - start };
  }, commerce());
  assert.ok(result.elapsed < 6000, `checkout must settle: ${result.elapsed} ms`);
  assert.equal(result.event.browser_id.fbc, undefined);
  assert.ok(result.event.browser_id.fbp);
  await api.waitFor('page_view'); await api.waitFor('begin_checkout');
  await api.page.evaluate(() => { history.pushState({}, '', '/produkter/test-product?variant=2'); dispatchEvent(new PopStateEvent('popstate')); });
  await api.waitFor('page_view', 2);
  assert.equal(await api.page.evaluate(() => __metaBackupCalls), 1);
  assert.equal(api.events('begin_checkout').length, 1);
  const logs = api.requests.filter(request => request.path === '/api/log');
  assert.equal(logs.length, 1, 'one bounded collection produces one diagnostic');
  assert.equal(logs[0].body.data.message, 'MetaParameterCollectionTimeout');
  assert.equal(logs[0].body.level, 'error', 'a timeout remains visible even when fallback succeeds');
});

test('Meta collects native click and client IP concurrently without a false combined timeout', async t => {
  const started = Date.now();
  const api = await fixture(t, 'https://utekos.no/produkter/test-product', {
    metaBackupDelay: 3500, metaIpDelay: 2300,
  });
  await api.waitFor('page_view');
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 4800, `identity must be released before the unrelated IP request completes: ${elapsed} ms`);
  assert.match(api.events('page_view')[0].browser_id.fbc, /\.OfflineBackupClick\./);
  assert.match(await api.page.evaluate(() => document.cookie), /_fbi=192\.0\.2\.1/);
  assert.equal(await api.page.evaluate(() => __metaBackupCalls), 1);
  await api.page.waitForTimeout(2500);
  assert.equal(api.events('page_view').length, 1);
  assert.deepEqual(api.requests.filter(request => request.path === '/api/log'), [], 'successful identity recovery must not be reported as a collection timeout');
});

for (const safariMode of [false, true]) {
test(`Meta pagehide releases pending identity once and a late result cannot replay PageView (webkit=${safariMode})`, async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product', { metaBackupDelay: 1900, safariMode });
  await api.page.waitForFunction(() => __metaBackupCalls === 1);
  await api.page.evaluate(() => { dispatchEvent(new PageTransitionEvent('pagehide')); dispatchEvent(new PageTransitionEvent('pagehide')); });
  await api.waitFor('page_view');
  const first = api.events('page_view')[0];
  assert.equal(first.browser_id.fbc, undefined, 'an unavailable click is never invented');
  assert.ok(first.browser_id.fbp, 'read cookies at exit, not the original empty event');
  await api.page.waitForFunction(() => document.cookie.includes('OfflineBackupClick'));
  assert.equal(api.events('page_view').length, 1);
  assert.equal(await api.page.evaluate(() => __pixelCalls.filter(call => call[2] === 'PageView').length), 1);
  // A subsequent route can use the late result without replaying the old ID.
  await api.page.evaluate(() => { history.pushState({}, '', '/produkter/test-product?variant=2'); dispatchEvent(new PopStateEvent('popstate')); });
  await api.waitFor('page_view', 2);
  assert.match(api.events('page_view')[1].browser_id.fbc, /\.OfflineBackupClick\./);
  assert.notEqual(api.events('page_view')[1].event_id, first.event_id);
});
}

test('list visibility requires 50 percent and a continuous second, then deduplicates repeated observation', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter');
  await api.waitFor('page_view');
  await api.page.evaluate(() => { document.getElementById('card').style.marginTop = '580px'; });
  await api.page.waitForTimeout(1150);
  assert.equal(api.events('view_item_list').length, 0);
  await api.page.evaluate(() => { document.getElementById('card').style.marginTop = '200px'; });
  await api.page.waitForTimeout(450);
  assert.equal(api.events('view_item_list').length, 0);
  await api.page.evaluate(() => { document.getElementById('card').style.marginTop = '1000px'; });
  await api.page.waitForTimeout(100);
  await api.page.evaluate(() => { document.getElementById('card').style.marginTop = '200px'; });
  await api.waitFor('view_item_list');
  const listed = api.events('view_item_list');
  assert.equal(listed.length, 1);
  assert.equal(listed[0].custom_data.items[0].variant_id, commerce().items[0].variant_id);
  await api.page.evaluate(() => { window.__stopObservers(); window.__stopObservers=UtekosTrackingHarness.observeStorefront(); });
  await api.page.waitForTimeout(1400);
  assert.equal(api.events('view_item_list').length, 1);
});

for (const safariMode of [false, true]) {
test(`Meta pending first PageView survives actual document navigation once (webkit=${safariMode})`, async t => {
  const api = await fixture(t, 'https://utekos.no/produkter/test-product?variant=1', { metaBackupBlocked: true, safariMode });
  await api.page.waitForFunction(() => __metaBackupCalls === 1);
  await api.page.goto('https://utekos.no/produkter/test-product?variant=2');
  const deadline = Date.now() + 3000;
  while (!api.events('page_view').some(event => event.page_url.endsWith('variant=1')) && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  const original = api.events('page_view').filter(event => event.page_url.endsWith('variant=1'));
  // Navigation can lose the first HTTP response. The existing delivery layer
  // may retry once, but must preserve the complete event for server idempotency.
  assert.ok(original.length >= 1 && original.length <= 2);
  for (const attempt of original) assert.deepEqual(attempt, original[0]);
  assert.equal(new Set(original.map(event => event.event_id)).size, 1, 'one logical event, including transport retries');
  assert.ok(original[0].browser_id.fbp);
  assert.equal(original[0].browser_id.fbc, undefined);
});
}

test('delayed RSC variant commits only the selected merchandise after navigation', async t => {
  const api = await fixture(t);
  await api.waitFor('view_item');
  await api.page.evaluate(() => {
    UtekosTrackingHarness.recordVariantIntent('/produkter/test-product?variant=2', 'gid://shopify/ProductVariant/1');
    history.pushState({}, '', '/produkter/test-product?variant=2');
    UtekosTrackingHarness.reportNavigation();
    window.__stopObservers(); window.__stopObservers=UtekosTrackingHarness.observeStorefront();
  });
  await api.page.waitForTimeout(600);
  assert.equal(api.events('variant_select').length, 0);
  assert.equal(api.events('view_item').length, 1);
  await api.page.evaluate(value => {
    const product = document.querySelector('[data-tracking-product]');
    product.setAttribute('data-tracking-commerce', JSON.stringify(value));
    product.setAttribute('data-tracking-selection', 'variant=2');
  }, commerce('2'));
  await api.waitFor('variant_select'); await api.waitFor('view_item', 2);
  assert.equal(api.events('variant_select').length, 1);
  assert.equal(api.events('variant_select')[0].custom_data.variant_id, 'gid://shopify/ProductVariant/2');
  assert.equal(api.events('view_item')[1].custom_data.items[0].variant_id, 'gid://shopify/ProductVariant/2');
});

test('replayed confirmed cart action emits once, while genuine navigation back and reload get new page IDs', async t => {
  const api = await fixture(t);
  await api.waitFor('page_view');
  const mutation = { id: 'fixture-mutation', event_time: '2026-10-07T12:00:00.000Z', cart_id: 'gid://shopify/Cart/fixture', changes: [{ event_name: 'add_to_cart', commerce: commerce() }] };
  await api.page.evaluate(mutation => {
    UtekosTrackingHarness.emitStorefrontAction('utekos:cart-mutation-confirmed', mutation);
    UtekosTrackingHarness.emitStorefrontAction('utekos:cart-mutation-confirmed', mutation);
  }, mutation);
  await api.waitFor('add_to_cart');
  assert.equal(api.events('add_to_cart').length, 1);
  assert.equal(api.events('add_to_cart')[0].event_time, mutation.event_time);
  await api.page.evaluate(() => { history.pushState({}, '', '/other'); UtekosTrackingHarness.reportNavigation(); });
  await api.waitFor('page_view', 2);
  await api.page.goBack();
  await api.waitFor('page_view', 3);
  await api.page.reload();
  await api.waitFor('page_view');
  const ids = api.events('page_view').map(event => event.page_view_id);
  assert.equal(ids.length, 4);
  assert.equal(new Set(ids).size, 4);
});

test('one actual product-link click remains one selection after observer teardown and remount', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter');
  await api.waitFor('page_view');
  await api.page.evaluate(() => {
    window.__stopObservers(); window.__stopObservers=UtekosTrackingHarness.observeStorefront();
    document.getElementById('card').style.marginTop = '100px';
  });
  await api.page.locator('#card a').click();
  await api.page.waitForURL('**/produkter/test-product?variant=1');
  await api.waitFor('page_view');
  const selections = api.events('select_item');
  assert.equal(new Set(selections.map(event => event.event_id)).size, 1, 'one click must produce one logical selection, including keepalive retries');
  assert.ok(selections.every(event => JSON.stringify(event) === JSON.stringify(selections[0])), 'any retry keeps the exact original payload');
  assert.equal(api.events('select_item')[0].custom_data.items[0].variant_id, 'gid://shopify/ProductVariant/1');
});

test('confirmed action queued before runtime mount preserves its original page and time after navigation', async t => {
  const api = await fixture(t, undefined, { deferCommerce: true });
  await api.waitFor('page_view');
  const initialPage = api.events('page_view')[0];
  const mutation = { id: 'early-mutation', event_time: '2026-10-07T12:00:00.000Z', cart_id: 'gid://shopify/Cart/fixture', changes: [{ event_name: 'add_to_cart', commerce: commerce() }] };
  await api.page.evaluate(mutation => {
    UtekosTrackingHarness.emitStorefrontAction('utekos:cart-mutation-confirmed', mutation);
    history.pushState({}, '', '/other'); UtekosTrackingHarness.reportNavigation();
    UtekosTrackingHarness.attachCommerceTracking();
  }, mutation);
  await api.waitFor('add_to_cart');
  const event = api.events('add_to_cart')[0];
  assert.equal(event.page_url, initialPage.page_url);
  assert.equal(event.page_view_id, initialPage.page_view_id);
  assert.equal(event.event_time, mutation.event_time);
});

test('inline variant actions queued before runtime hydration keep their committed identity and page and deduplicate replays', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter', { deferCommerce: true });
  await api.waitFor('page_view');
  const initialPage = api.events('page_view')[0];
  const selection = { interaction_id: 'inline-selection-1', product_id: 'gid://shopify/Product/1',
    variant_id: 'gid://shopify/ProductVariant/2', item_id: 'gid://shopify/ProductVariant/2',
    item_variant: 'Large / Blå', availability: 'available' };
  await api.page.evaluate(selection => {
    UtekosTrackingHarness.emitStorefrontAction('utekos:variant-selection-confirmed', selection);
    UtekosTrackingHarness.emitStorefrontAction('utekos:variant-selection-confirmed', selection);
    history.pushState({}, '', '/other'); UtekosTrackingHarness.reportNavigation();
    UtekosTrackingHarness.attachCommerceTracking();
  }, selection);
  await api.waitFor('variant_select');
  const events = api.events('variant_select');
  assert.equal(events.length, 1);
  assert.equal(events[0].page_url, initialPage.page_url);
  assert.equal(events[0].page_view_id, initialPage.page_view_id);
  assert.deepEqual(events[0].custom_data, selection);
  const next = { ...selection, interaction_id: 'inline-selection-2', variant_id: 'gid://shopify/ProductVariant/3',
    item_id: 'gid://shopify/ProductVariant/3', item_variant: 'Small / Blå', availability: 'unavailable' };
  await api.page.evaluate(next => {
    UtekosTrackingHarness.emitStorefrontAction('utekos:variant-selection-confirmed', next);
    UtekosTrackingHarness.emitStorefrontAction('utekos:variant-selection-confirmed', next);
  }, next);
  await api.waitFor('variant_select', 2);
  assert.equal(api.events('variant_select').length, 2);
  assert.deepEqual(api.events('variant_select')[1].custom_data, next);
});

test('preview runtime remains isolated even when actions execute on the production hostname fixture', async t => {
  const api = await fixture(t, undefined, { preview: true });
  await api.page.evaluate(value => {
    UtekosTrackingHarness.reportNavigation();
    UtekosTrackingHarness.emitStorefrontAction('utekos:cart-mutation-confirmed', { id: 'preview-mutation', event_time: new Date().toISOString(), cart_id: 'gid://shopify/Cart/fixture', changes: [{ event_name: 'add_to_cart', commerce: value }] });
  }, commerce());
  await api.page.waitForTimeout(1200);
  assert.equal(api.requests.length, 0);
  assert.deepEqual(await api.page.evaluate(() => window.__pixelCalls), []);
  assert.deepEqual(await api.page.evaluate(() => window.dataLayer), []);
});

// Synthetic persisted transitions exercise our lifecycle hook. They do not
// establish that Safari or Chromium actually admitted this page into BFCache.
test('persisted pageshow lifecycle creates one restored page scope and re-observes visible merchandise', async t => {
  const api = await fixture(t);
  await api.waitFor('page_view'); await api.waitFor('view_item');
  const initialPage = api.events('page_view')[0];
  await api.page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false })));
  await api.page.waitForTimeout(100);
  assert.equal(api.events('page_view').length, 1, 'ordinary pageshow does not create another navigation');
  await api.page.evaluate(() => {
    dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await api.waitFor('page_view', 2); await api.waitFor('view_item', 2);
  await api.waitForJourney('page_arrival', 2); await api.waitForJourney('journey_progress');
  const restoredPage = api.events('page_view')[1];
  assert.notEqual(restoredPage.page_view_id, initialPage.page_view_id);
  assert.equal(restoredPage.previous_page_view_id, initialPage.page_view_id);
  assert.equal(api.events('view_item')[1].page_view_id, restoredPage.page_view_id);
  assert.equal(api.journey('page_arrival')[1].data.navigation_type, 'back_forward');
  assert.equal(api.journey('page_arrival')[1].page_view_id, restoredPage.page_view_id);
  assert.equal(api.journey('journey_progress')[0].page_view_id, initialPage.page_view_id);
  await api.page.evaluate(() => {
    UtekosTrackingHarness.reportNavigation();
    dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }));
  });
  await api.page.waitForTimeout(150);
  assert.equal(api.events('page_view').length, 2);
  assert.equal(api.events('view_item').length, 2);
});

test('journey progress preserves maximum scroll and old page context after scrolling back before navigation', async t => {
  const api = await fixture(t, undefined, { longJourney: true });
  await api.waitFor('page_view');
  const initialPage = api.events('page_view')[0];
  await api.page.evaluate(() => scrollTo(0, 1900));
  await api.page.waitForFunction(() => scrollY >= 1900);
  await api.waitForJourney('section_view');
  const highPoint = await api.page.evaluate(() => ({
    y: Math.round(scrollY),
    percent: Math.min(100, Math.round((scrollY + innerHeight) / Math.max(1, document.documentElement.scrollHeight, document.body.scrollHeight) * 100)),
  }));
  await api.page.evaluate(() => scrollTo(0, 0));
  await api.page.waitForFunction(() => scrollY === 0);
  await api.page.evaluate(() => {
    history.pushState({}, '', '/other');
    UtekosTrackingHarness.reportNavigation();
    window.__stopObservers();
    window.__stopObservers = UtekosTrackingHarness.observeTrackedPage();
  });
  await api.waitForJourney('journey_progress');
  const progress = api.journey('journey_progress')[0];
  assert.equal(progress.page_view_id, initialPage.page_view_id, 'cleanup retains the page that was observed');
  assert.equal(progress.page_path, '/produkter/:dynamic', 'the original product route remains redacted by the journey contract');
  assert.equal(progress.data.max_scroll_y, highPoint.y);
  assert.equal(progress.data.max_scroll_percent, highPoint.percent);
  assert.equal(progress.data.last_visible_section, 'reviews');
  assert.equal(progress.data.reason, 'navigation');
  assert.equal(api.journey('section_view')[0].page_view_id, initialPage.page_view_id);
  assert.equal(api.journey('section_view')[0].data.section_id, 'reviews');
});

test('same-path pagination waits for matching RSC page metadata before list impressions', async t => {
  const api = await fixture(t, 'https://utekos.no/produkter?page=1');
  await api.page.evaluate(() => { document.getElementById('card').style.marginTop = '100px'; });
  await api.waitFor('view_item_list');
  const initialList = api.events('view_item_list')[0];
  await api.page.evaluate(() => {
    history.pushState({}, '', '/produkter?page=2');
    window.__stopObservers();
    UtekosTrackingHarness.reportNavigation();
    window.__stopObservers = UtekosTrackingHarness.observeTrackedPage();
  });
  await api.waitFor('page_view', 2);
  await api.page.waitForTimeout(1200);
  assert.equal(api.events('view_item_list').length, 1, 'page-one merchandise is stale while the page-two RSC is pending');
  await api.page.evaluate(value => {
    document.getElementById('card').setAttribute('data-tracking-commerce', JSON.stringify(value));
    document.querySelector('main').setAttribute('data-tracking-page', '2');
  }, commerce('2'));
  await api.waitFor('view_item_list', 2);
  const nextList = api.events('view_item_list')[1];
  assert.notEqual(nextList.page_view_id, initialList.page_view_id);
  assert.equal(nextList.page_view_id, api.events('page_view')[1].page_view_id);
  assert.equal(nextList.custom_data.items.length, 1);
  assert.equal(nextList.custom_data.items[0].variant_id, 'gid://shopify/ProductVariant/2');
});

for (const pathname of ['/bli-forhandler', '/bli-forhandler/pdf']) {
  test(`${pathname}: dealer clicks retain exact CTA and destination without counting disabled buttons or claiming acceptance`, async t => {
    const api = await fixture(t, `https://utekos.no${pathname}`);
    await api.waitFor('page_view');
    const expected = [];
    if (pathname === '/bli-forhandler') {
      await api.page.locator('#dealer-open span').click();
      expected.push(['dealer_pdf_open', '/bli-forhandler/pdf']);
    }
    await api.page.locator('#dealer-download').click();
    expected.push(['dealer_pdf_download', '/images/kunnskap/forhandler-utfyllbar.pdf']);
    await api.page.locator('#dealer-submit span').click();
    expected.push([pathname.endsWith('/pdf') ? 'dealer_pdf_submit' : 'dealer_web_submit', pathname]);
    await api.waitFor('hero_interact', expected.length);
    await api.page.evaluate(() => {
      // Dispatch bypasses the browser's disabled-button guard to exercise the
      // delegated observer's own guard, including clicks on nested content.
      const button = document.getElementById('dealer-disabled');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await api.page.waitForTimeout(100);
    const clicks = api.events('hero_interact');
    assert.deepEqual(clicks.map(event => [event.custom_data.cta_id, event.custom_data.destination_path]), expected);
    assert.deepEqual(clicks.map(event => event.custom_data.click_sequence), expected.map((_, index) => index + 1));
    assert.ok(clicks.every(event => event.page_url === `https://utekos.no${pathname}`));
    assert.equal(api.events('form_submit').length, 0, 'clicks are not server-accepted submissions');
    assert.equal(api.events('generate_lead').length, 0);
    assert.equal(await api.page.evaluate(() => dataLayer.filter(event => event?.event === 'generate_lead').length), 0);
  });

  test(`${pathname}: form start captures only field category once and preserves the source page in server context`, async t => {
    const api = await fixture(t, `https://utekos.no${pathname}`);
    await api.waitFor('page_view');
    await api.page.locator('#dealer-website').fill('must-not-leave-the-form');
    await api.page.evaluate(() => {
      const privacy = document.getElementById('dealer-privacy');
      privacy.checked = false;
      privacy.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await api.page.waitForTimeout(100);
    assert.equal(api.events('form_start').length, 0, 'honeypot and unchecked privacy are not meaningful form starts');
    await api.page.locator('#dealer-name').fill('Testkontakt aldri i analyse');
    await api.waitFor('form_start');
    await api.page.locator('#dealer-message').fill('Privat meldingsinnhold aldri i analyse');
    await api.page.locator('#dealer-privacy').check();
    await api.page.evaluate(() => {
      window.__stopObservers();
      window.__stopObservers = UtekosTrackingHarness.observeTrackedPage();
    });
    await api.page.locator('#dealer-name').fill('Endret kontaktperson');
    await api.page.waitForTimeout(100);
    const starts = api.events('form_start');
    assert.equal(starts.length, 1, 'observer reattachment does not start the form twice within the same page view');
    assert.deepEqual(starts[0].custom_data, {
      form_id: 'dealer_inquiry', form_name: pathname.endsWith('/pdf') ? 'Forhandlersamarbeid PDF' : 'Forhandlersamarbeid', field_category: 'contact',
    });
    assert.equal(starts[0].page_url, `https://utekos.no${pathname}`);
    const context = await api.page.locator('input[name="leadTrackingContext"]').inputValue();
    assert.equal(JSON.parse(context).page_url, starts[0].page_url);
    assert.equal(JSON.parse(context).page_view_id, starts[0].page_view_id);
    const payloads = JSON.stringify(api.requests);
    for (const privateValue of ['must-not-leave-the-form', 'Testkontakt', 'Privat meldingsinnhold', 'Endret kontaktperson']) {
      assert.ok(!payloads.includes(privateValue), `${privateValue} must not appear in observed requests`);
    }
  });

  test(`${pathname}: errors create no lead; accepted server readback preserves identity and deduplicates browser replay`, async t => {
    const api = await fixture(t, `https://utekos.no${pathname}`);
    await api.waitFor('page_view');
    await api.page.evaluate(() => UtekosTrackingHarness.emitStorefrontAction('utekos:form-error', {
      formId: 'dealer_inquiry', attemptId: 'dealer-fixture-rejected', category: 'delivery',
    }));
    await api.waitFor('form_error');
    assert.deepEqual(api.events('form_error')[0].custom_data, { form_id: 'dealer_inquiry', attempt_id: 'dealer-fixture-rejected', error_category: 'delivery' });
    assert.equal(await api.page.evaluate(() => dataLayer.filter(event => event?.event === 'generate_lead').length), 0);
    const entry = await api.page.evaluate(pageEvent => {
      const event = UtekosTrackingHarness.createCanonicalGenerateLead({
        eventId: crypto.randomUUID(), eventTime: '2026-10-08T10:00:00.000Z', environment: 'production',
        consent: pageEvent.consent, pageUrl: location.href, pageViewId: pageEvent.page_view_id,
        browserId: pageEvent.browser_id,
        customData: { submission_id: 'dealer-provider-receipt', form_id: 'dealer_inquiry', lead_type: 'dealer_inquiry' },
      });
      const entry = UtekosTrackingHarness.buildGenerateLeadDataLayerEvent(event);
      UtekosTrackingHarness.emitStorefrontAction('utekos:accepted-lead', entry);
      UtekosTrackingHarness.emitStorefrontAction('utekos:accepted-lead', entry);
      return entry;
    }, api.events('page_view')[0]);
    await api.waitFor('generate_lead');
    await api.page.waitForTimeout(100);
    const result = await api.page.evaluate(() => ({
      leads: dataLayer.filter(event => event?.event === 'generate_lead'),
      pixel: window.__pixelCalls.filter(call => call[2] === 'Lead'),
    }));
    assert.equal(result.leads.length, 1);
    assert.equal(result.leads[0].event_id, entry.event_id);
    assert.equal(result.leads[0].event_time, entry.event_time);
    assert.equal(result.leads[0].canonical_event.page_url, `https://utekos.no${pathname}`);
    assert.equal(result.leads[0].custom_data.form_id, 'dealer_inquiry');
    assert.equal(result.leads[0].custom_data.value, undefined);
    assert.equal(result.leads[0].custom_data.currency, undefined);
    assert.equal(result.pixel.length, 1);
    assert.equal(result.pixel[0][4].eventID, entry.event_id);
    assert.equal(result.pixel[0][3].value, undefined);
    assert.equal(result.pixel[0][3].currency, undefined);
    assert.equal(api.events('generate_lead').length, 0, 'server-accepted lead projection is not collected a second time');
    assert.equal(api.events('form_submit').length, 0, 'accepted form submission remains server-owned');
  });
}

for (const safariMode of [false, true]) {
  test(`Meta rejected native bridge does not leak an unhandled rejection (webkit=${safariMode})`, async t => {
    const api = await fixture(t, 'https://utekos.no/produkter/test-product', { metaBackupRejected: true, safariMode });
    await api.waitFor('page_view');
    assert.equal(await api.page.evaluate(() => __metaBackupCalls), 1);
    assert.equal(api.events('page_view').length, 1);
    assert.ok(api.events('page_view')[0].browser_id.fbp);
    assert.equal(api.events('page_view')[0].browser_id.fbc, undefined);
  });
}

for (const response of [
  { status: 200, text: '', event: 'load' },
  { status: 204, text: '', event: 'load' },
  { status: 404, text: 'not-a-click-id', event: 'load' },
  { status: 0, text: '', event: 'abort' },
  { status: 0, text: '', event: 'timeout' },
  { status: 0, text: '', event: 'error' },
  { status: 200, text: 'OfflineAndroidClick', event: 'load' },
]) {
  test(`Meta Android terminal response ${response.event}/${response.status}/${response.text || 'empty'} settles without application timeout`, async t => {
    const api = await fixture(t, 'https://utekos.no/produkter/test-product', {
      userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/500.0.0.0]',
      metaAndroidResponse: response,
    });
    await api.page.waitForFunction(() => dataLayer.some(entry => entry?.event === 'page_view'), null, { timeout: 2500 });
    await api.waitFor('page_view');
    assert.equal(await api.page.evaluate(() => __androidBridgeCalls), 1);
    assert.equal(api.events('page_view').length, 1);
    const ids = api.events('page_view')[0].browser_id;
    assert.ok(ids.fbp);
    if (response.status === 200 && response.text) assert.match(ids.fbc, /OfflineAndroidClick/);
    else assert.equal(ids.fbc, undefined);
  });
}

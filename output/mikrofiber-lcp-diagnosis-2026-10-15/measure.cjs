const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = __dirname;
const origin = 'http://localhost:3001';
const route = '/produkter/utekos-mikrofiber?farge=fjellbla&storrelse=large';
const prefix = '/images/kunnskap/UtekosMikrofiber_Fjellbla_1440x1800_Camping_';
const candidates = {
  light: { src: prefix + 'TEST_2.webp' },
  png1: { src: prefix + '1.png' },
  png2: { src: prefix + '2.png' },
  jpegHeavy: { src: prefix + 'TEST.jpg' },
  jpegSmall: { src: prefix + '1.jpg' },
  webpLarge: { src: prefix + 'TEST.webp' },
  rawPng: { src: prefix + '2.png', raw: true },
  original: {},
};
if (fs.existsSync(path.join(root, 'extra-candidates.json'))) Object.assign(candidates, JSON.parse(fs.readFileSync(path.join(root, 'extra-candidates.json'))));
const ids = (process.argv[2] || 'light,png1,png2,jpegHeavy').split(',');
const repeats = Number(process.argv[3] || 3);
const profile = process.argv[4] || 'desktop';
const viewport = profile === 'ipad' ? { width: 820, height: 1180 } : profile === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 1000 };
const output = path.join(root, `runs-${profile}-${Date.now()}.json`);
(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    // Rotate order after the first light-first pass to reduce ordering bias.
    for (let repeat = 0; repeat < repeats; repeat++) for (const id of ids.slice(repeat % ids.length).concat(ids.slice(0, repeat % ids.length))) {
      const candidate = candidates[id];
      const context = await browser.newContext({ viewport, deviceScaleFactor: 2, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      if (!candidate.noNetworkThrottle) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8, connectionType: 'cellular4g' });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: candidate.cpuRate ?? 4 });
      const heroResponses = [];
      let releaseSecondary;
      const heroFinished = new Promise(resolve => { releaseSecondary = resolve; });
      page.on('response', response => {
        if (/Mikrofiber_44|UtekosMikrofiber|mikrofiber-perf/.test(response.url())) {
          heroResponses.push({ url: response.url(), status: response.status(), headers: response.headers() });
          response.finished().then(() => releaseSecondary());
        }
      });
      let replacements = 0;
      await page.route('**/*', async intercepted => {
        const request = intercepted.request();
        const url = new URL(request.url());
        // Keep every run free of synthetic advertising/analytics events.
        if (url.origin !== origin || /^\/(?:__sgtm|api\/(?:events|meta|log|observability))/.test(url.pathname)) return intercepted.abort();
        if (candidate.src && url.pathname === '/_next/image' && (url.searchParams.get('url') || '').includes('Mikrofiber_44.webp')) {
          replacements++;
          if (candidate.raw) return intercepted.continue({ url: origin + candidate.src });
          url.searchParams.set('url', candidate.src);
          if (candidate.width) url.searchParams.set('w', String(candidate.width));
          return intercepted.continue({ url: url.href });
        }
        if (candidate.deferScripts && request.resourceType() === 'script') await heroFinished;
        if (candidate.deferFonts && request.resourceType() === 'font') await heroFinished;
        if (candidate.deferSecondary && (url.searchParams.has('_rsc') || (request.resourceType() === 'image' && (url.pathname === '/_next/image' || /logo-judgme|PANTONE/.test(url.pathname))))) await heroFinished;
        return intercepted.continue();
      });
      await page.addInitScript(() => {
        window.__metrics = { lcp: [], shifts: [], longtasks: [], events: [] };
        new PerformanceObserver(list => list.getEntries().forEach(e => window.__metrics.lcp.push({ startTime: e.startTime, size: e.size, url: e.url, tag: e.element?.tagName, selector: e.element?.getAttribute('data-gallery-desktop-alt') || e.element?.textContent?.slice(0, 100) }))).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => list.getEntries().forEach(e => { if (!e.hadRecentInput) window.__metrics.shifts.push({ time: e.startTime, value: e.value, sources: e.sources.map(s => ({tag: s.node?.tagName, id: s.node?.id, className: String(s.node?.className ?? ''), previousRect: s.previousRect.toJSON(), currentRect: s.currentRect.toJSON()})) }); })).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(list => list.getEntries().forEach(e => window.__metrics.longtasks.push({ time: e.startTime, duration: e.duration }))).observe({ type: 'longtask', buffered: true });
        new PerformanceObserver(list => list.getEntries().forEach(e => { if (e.interactionId) window.__metrics.events.push({ name: e.name, duration: e.duration, interactionId: e.interactionId }); })).observe({ type: 'event', buffered: true, durationThreshold: 16 });
      });
      try {
        const response = await page.goto(origin + route, { waitUntil: 'load', timeout: 90000 });
        await page.locator('[data-gallery-product] figure img').first().evaluate(img => img.decode());
        await page.waitForTimeout(1500);
        const metrics = await page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0];
          const paints = performance.getEntriesByType('paint');
          const resources = performance.getEntriesByType('resource');
          const hero = document.querySelector('[data-gallery-product] figure img');
          const heroResource = resources.find(r => r.name === hero.currentSrc);
          let cls = 0, value = 0, first = 0, last = 0;
          for (const shift of window.__metrics.shifts) { if (shift.time - last > 1000 || shift.time - first > 5000) { first = shift.time; value = 0; } value += shift.value; last = shift.time; cls = Math.max(cls, value); }
          const fcp = paints.find(p => p.name === 'first-contentful-paint')?.startTime;
          return { ttfb: nav.responseStart, fcp, lcp: window.__metrics.lcp.at(-1), cls, load: nav.loadEventEnd, domContentLoaded: nav.domContentLoadedEventEnd, observationEnd: performance.now(), longTaskBlockingAfterFCP: window.__metrics.longtasks.filter(t => t.time >= fcp).reduce((sum, t) => sum + Math.max(0, t.duration - 50), 0), hero: { currentSrc: hero.currentSrc, naturalWidth: hero.naturalWidth, naturalHeight: hero.naturalHeight, renderedWidth: hero.getBoundingClientRect().width, renderedHeight: hero.getBoundingClientRect().height, sizes: hero.sizes, timing: heroResource?.toJSON() }, totalTransfer: resources.reduce((s, r) => s + r.transferSize, nav.transferSize), resources: resources.map(r => r.toJSON()), raw: window.__metrics };
        });
        if (profile !== 'mobile' && candidate.src && replacements !== 1) throw new Error(`Expected one hero replacement, received ${replacements}`);
        const result = { id, repeat, profile, status: response.status(), candidate, replacements, heroResponses, ...metrics };
        if (process.env.MEASURE_INTERACTION === '1') {
          await page.getByRole('button', { name: 'Størrelsesguide', exact: true }).click();
          await page.getByRole('dialog').waitFor();
          await page.waitForTimeout(300);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
          result.interaction = await page.evaluate(() => ({ events: window.__metrics.events, maxEventDuration: Math.max(0, ...window.__metrics.events.map(e => e.duration)), note: 'Synthetic size-guide open and Escape close; not field INP' }));
        }
        results.push(result);
        fs.writeFileSync(output, JSON.stringify({ method: { viewport, dpr: 2, networkMbps: 1.6, latencyMs: 150, cpuSlowdown: 4, browserCache: 'disabled', optimizerCache: 'first request cold, later warm', thirdParty: 'blocked identically', substitution: 'first gallery image request redirected to candidate; unchanged page DOM/CSS/JS' }, results }, null, 2));
        console.log(JSON.stringify({ id, repeat, profile, ttfb: Math.round(metrics.ttfb), fcp: Math.round(metrics.fcp), lcp: Math.round(metrics.lcp?.startTime), cls: metrics.cls, load: Math.round(metrics.load), heroBytes: metrics.hero.timing?.encodedBodySize, heroMs: Math.round(metrics.hero.timing?.duration), renderedWidth: metrics.hero.renderedWidth, naturalWidth: metrics.hero.naturalWidth, cache: heroResponses.map(r => r.headers['x-nextjs-cache']) }));
        if (repeat === 0) await page.screenshot({ path: path.join(root, `${profile}-${id}.png`) });
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
  console.log('SAVED ' + output);
})().catch(error => { console.error(error); process.exit(1); });

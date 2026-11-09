import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import vm from 'node:vm';
import { chromium } from 'playwright';

const origin = process.argv[2] ?? 'http://localhost:3100';
const output = 'outputs/design-studio-qa';
await mkdir(output, { recursive: true });

const context = {};
vm.createContext(context);
vm.runInContext(await readFile('.next/server/app/(studio)/design/page_client-reference-manifest.js', 'utf8'), context);
const manifest = context.__RSC_MANIFEST['/(studio)/design/page'];
const clientModules = Object.keys(manifest.clientModules).filter(path => path.includes('/src/'));
const excludedModules = clientModules.filter(path => /\/(commerce|cart|tracking|analytics|klarna|header)\/|GoogleMerchantWidget|\/Footer\./.test(path));
// Next also lists global 404 clients here. Check their actual chunks against
// network requests rather than treating an available reference as a download.
const shopChunks = new Set(excludedModules.flatMap(path => manifest.clientModules[path].chunks));

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  const external = [];
  const downloads = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    const type = response.request().resourceType();
    if (['script', 'stylesheet', 'font'].includes(type) && response.ok()) {
      downloads.push(response.body().then(body => ({
        url: new URL(response.url()).pathname,
        type,
        bytes: body.length,
        gzipBytes: gzipSync(body).length,
      })));
    }
  });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin || ['blob:', 'data:'].includes(url.protocol)) return route.continue();
    external.push(url.origin + url.pathname);
    return route.abort();
  });

  const response = await page.goto(`${origin}/design`, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('#site-jsonld, body > header, body > footer').count(), 0);
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
  const initial = await Promise.all(downloads);
  const loadedShopChunks = initial.filter(file => shopChunks.has(file.url));
  assert.deepEqual(loadedShopChunks, [], 'Studio must not download shop client chunks');
  const card = page.getByRole('article', { name: 'Forhåndsvisning av kort' });
  const heading = page.getByLabel('Rediger hovedoverskrift');
  const moving = page.getByRole('group', { name: 'Flyttbar tekstboks. Dra med musen eller bruk piltaster.' });
  await heading.fill('God jul, Kari!');
  await page.getByRole('button', { name: 'Cloud Dancer (Lys)' }).click();
  assert.equal(await heading.innerText(), 'God jul, Kari!');
  await moving.focus();
  const before = await moving.boundingBox();
  await moving.press('ArrowRight');
  const after = await moving.boundingBox();
  assert.equal(Math.round(after.x - before.x), 4);
  await page.screenshot({ path: `${output}/desktop.png`, fullPage: true });

  const countBeforeExport = downloads.length;
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksporter kort' }).click();
  const download = await downloadPromise;
  await download.saveAs(`${output}/utekos-kort.png`);
  assert.equal(download.suggestedFilename(), 'utekos-kort.png');
  await page.waitForLoadState('networkidle');
  const deferred = await Promise.all(downloads.slice(countBeforeExport));
  assert.ok(deferred.some(file => file.type === 'script'), 'PNG exporter must load on demand');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const toolbar = await page.locator('header').boundingBox();
  const mobileCard = await card.boundingBox();
  assert.ok(toolbar.y + toolbar.height < mobileCard.y);
  await page.screenshot({ path: `${output}/mobile.png`, fullPage: true });
  assert.deepEqual(external, [], 'Studio must not request third-party services');
  assert.deepEqual(errors, []);

  await page.getByRole('link', { name: '← Tilbake' }).click();
  await page.waitForURL(`${origin}/`);
  await page.locator('#site-jsonld').waitFor({ state: 'attached' });
  assert.equal(await page.locator('[data-freeform-studio]').count(), 0);
  const storeHeader = await page.locator('body > header').count();
  assert.ok(storeHeader > 0, 'Shop navigation retains its header');

  // A real document navigation from the shop must discard its JavaScript state.
  await page.evaluate(() => {
    window.__studioMigrationSentinel = true;
    const link = document.createElement('a');
    link.href = '/design';
    link.textContent = 'Studio navigation test';
    document.body.append(link);
    link.click();
  });
  await page.waitForURL(`${origin}/design`);
  await page.getByRole('heading', { name: 'Kort- og designstudio' }).waitFor();
  assert.equal(await page.evaluate(() => window.__studioMigrationSentinel), undefined);
  assert.equal(await page.locator('#site-jsonld, body > header, body > footer').count(), 0);

  const totals = type => initial.filter(file => file.type === type).reduce((sum, file) => ({
    files: sum.files + 1, bytes: sum.bytes + file.bytes, gzipBytes: sum.gzipBytes + file.gzipBytes,
  }), { files: 0, bytes: 0, gzipBytes: 0 });
  const report = {
    origin, viewportChecks: [1440, 390], clientModules,
    globalNotFoundReferencesNotDownloaded: excludedModules, loadedShopChunks,
    initialJavaScript: totals('script'), initialCss: totals('stylesheet'), initialFonts: totals('font'), initial,
    deferredExporter: deferred, studioExternalRequests: external,
    checks: ['text editing', 'theme preserves text', 'keyboard movement', 'PNG download',
      'mobile no horizontal overflow', 'toolbar clear of card', 'shop header preserved',
      'fresh document across root layouts'],
    note: 'gzipBytes is a gzip estimate of decoded responses. Initial sizes include Next/React runtime.',
  };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}

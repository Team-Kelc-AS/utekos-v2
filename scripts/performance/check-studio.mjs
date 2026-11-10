import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import vm from 'node:vm';
import { chromium } from 'playwright';

const origin = new URL(process.argv[2] ?? 'http://localhost:3100').origin;
const output = 'outputs/design-studio-konva-qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
const page = await context.newPage();
const errors = [], external = [], downloads = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  const type = response.request().resourceType();
  if (['script', 'stylesheet', 'font'].includes(type) && response.ok()) {
    downloads.push(response.body().then(body => ({ url: new URL(response.url()).pathname,
      type, bytes: body.length, gzipBytes: gzipSync(body).length })));
  }
});
const routeRequest = route => {
  const url = new URL(route.request().url());
  if (url.origin === origin) return route.continue({ headers: { ...route.request().headers(),
    ...(process.env.VERCEL_OIDC_TOKEN ? { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } : {}) } });
  if (['data:', 'blob:'].includes(url.protocol)) return route.continue();
  if (url.hostname === 'vercel.live') return route.abort();
  external.push(url.origin + url.pathname);
  return route.abort();
};
await context.route('**/*', routeRequest);
const saved = () => page.getByRole('status').filter({ hasText: 'Utkast lagret på denne enheten.' }).waitFor();
const canvas = page.locator('[data-studio-card]');
async function exportBytes(button) {
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: button, exact: true }).click();
  const file = await event;
  await page.getByRole('button', { name: 'Eksporter kort', exact: true }).waitFor();
  return readFile(await file.path());
}
async function documentFile() { return JSON.parse((await exportBytes('Last ned designfil')).toString()); }
try {
  const response = await page.goto(`${origin}/design`, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  await canvas.waitFor(); await saved();
  assert.equal(await page.locator('#site-jsonld, body > header, body > footer').count(), 0);
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
  await page.getByLabel('Tekst', { exact: true }).fill('God jul, Æ Ø Å!');
  await page.getByLabel('X-posisjon', { exact: true }).fill('120');
  await page.getByRole('group', { name: 'Forhåndsvisning av kort', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(Number(await page.getByLabel('X-posisjon').inputValue()), 124);
  await page.getByRole('button', { name: 'Angre', exact: true }).click();
  assert.equal(Number(await page.getByLabel('X-posisjon').inputValue()), 120);
  await page.getByRole('button', { name: 'Gjør om', exact: true }).click();
  assert.equal(Number(await page.getByLabel('X-posisjon').inputValue()), 124);
  await page.getByRole('button', { name: 'Bakgrunn #f0eee9', exact: true }).click();
  await page.getByLabel('Farge', { exact: true }).fill('#010b0a');
  await saved();
  const selectedPng = await exportBytes('Eksporter kort');
  assert.equal(selectedPng.readUInt32BE(16), 2400);
  assert.equal(selectedPng.readUInt32BE(20), 1800);
  await page.screenshot({ path: `${output}/desktop.png`, fullPage: true });
  const bounds = await canvas.boundingBox();
  await page.mouse.click(bounds.x + bounds.width - 10, bounds.y + bounds.height - 10);
  const unselectedPng = await exportBytes('Eksporter kort');
  assert.equal(createHash('sha256').update(selectedPng).digest('hex'), createHash('sha256').update(unselectedPng).digest('hex'), 'Selection handles must never appear in PNG');
  await writeFile(`${output}/clean-export.png`, unselectedPng);

  await page.getByRole('group', { name: 'Legg til element' }).getByRole('button', { name: 'Figur', exact: true }).click();
  await page.getByLabel('Rotasjon').fill('30');
  await page.getByLabel('Hjørneavrunding').fill('36');
  await saved();
  const image = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 240; canvas.height = 120;
    const context = canvas.getContext('2d'); context.fillStyle = '#b44701'; context.fillRect(0, 0, 120, 120);
    context.fillStyle = '#012622'; context.fillRect(120, 0, 120, 120);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64') });
  await page.getByLabel('Lysstyrke').waitFor();
  await page.getByLabel('Bredde', { exact: true }).fill('480');
  await page.getByLabel('Rotasjon').fill('25');
  await page.getByLabel('Lysstyrke').fill('0.2');
  await saved();
  const portable = await documentFile();
  const photo = portable.elements.find(element => element.kind === 'image');
  assert.equal(photo.width / photo.height, 2, 'Uploaded image must retain original proportions');
  assert.equal(portable.assets[photo.assetId].base64, image, 'Original image bytes must be retained');
  await writeFile(`${output}/roundtrip-design.json`, JSON.stringify(portable, null, 2));
  const portablePng = await exportBytes('Eksporter kort');
  await writeFile(`${output}/image-export.png`, portablePng);
  await page.reload({ waitUntil: 'networkidle' }); await canvas.waitFor(); await saved();
  assert.deepEqual(await documentFile(), portable, 'Draft restores the complete document, including images');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' }); await canvas.waitFor(); await saved();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole('group', { name: 'Legg til element' }).getByRole('button', { name: 'Figur', exact: true }).click();
  await page.getByLabel('Rotasjon').fill('0');
  await page.getByLabel('X-posisjon').fill('100'); await page.getByLabel('Y-posisjon').fill('100');
  await canvas.scrollIntoViewIfNeeded();
  const mobileBounds = await canvas.boundingBox();
  const cdp = await context.newCDPSession(page);
  const x = mobileBounds.x + 300 * mobileBounds.width / 1200;
  const y = mobileBounds.y + 180 * mobileBounds.width / 1200;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let step = 1; step <= 5; step++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + step * 6, y: y + step * 3 }] }); await page.evaluate(() => new Promise(requestAnimationFrame)); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.ok(Number(await page.getByLabel('X-posisjon').inputValue()) > 100, 'Touch drag must update document coordinates');
  const beforeResize = await documentFile();
  // Test actual canvas transform handles, not only inspector inputs.
  await canvas.scrollIntoViewIfNeeded();
  const stageBox = await canvas.boundingBox();
  const element = beforeResize.elements.at(-1), scale = stageBox.width / beforeResize.width;
  const corner = { x: stageBox.x + (element.x + element.width) * scale, y: stageBox.y + (element.y + element.height) * scale };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [corner] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: corner.x + 25, y: corner.y + 15 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.ok(Number(await page.getByLabel('Bredde').inputValue()) > element.width, 'Touch resize must update design dimensions');
  await saved();
  await page.screenshot({ path: `${output}/mobile.png`, fullPage: true });

  await page.locator('input[type="file"]').nth(1).setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":999}') });
  await page.getByRole('alert').filter({ hasText: 'Designfilen kunne ikke åpnes' }).waitFor();
  assert.equal((await documentFile()).elements.length, beforeResize.elements.length);
  await page.locator('input[type="file"]').nth(1).setInputFiles({ name: 'design.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(portable)) });
  await saved();
  assert.deepEqual(await documentFile(), portable, 'Design file imports without losing data');
  await canvas.waitFor();
  const mobilePng = await exportBytes('Eksporter kort');
  assert.equal(createHash('sha256').update(portablePng).digest('hex'), createHash('sha256').update(mobilePng).digest('hex'), 'PNG must be identical across viewport sizes');
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  const initial = await Promise.all(downloads);
  let loadedShopChunks = null;
  // A local manifest cannot identify chunks from a different remote build.
  if (['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) try {
    const context = {}; vm.createContext(context);
    vm.runInContext(await readFile('.next/server/app/(studio)/design/page_client-reference-manifest.js', 'utf8'), context);
    const manifest = context.__RSC_MANIFEST['/(studio)/design/page'];
    const shopChunks = new Set(Object.entries(manifest.clientModules).filter(([name]) => /\/(commerce|cart|tracking|analytics|klarna|header)\/|GoogleMerchantWidget|\/Footer\./.test(name)).flatMap(([, value]) => value.chunks));
    loadedShopChunks = initial.filter(file => shopChunks.has(file.url));
    assert.deepEqual(loadedShopChunks, []);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  // A separate browser context proves a downloaded file is independent of local storage.
  const fresh = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await fresh.route('**/*', routeRequest);
  const freshPage = await fresh.newPage();
  await freshPage.goto(`${origin}/design`, { waitUntil: 'networkidle' });
  await freshPage.locator('.konvajs-content').waitFor();
  await freshPage.locator('input[type="file"]').nth(1).setInputFiles({ name: 'design.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(portable)) });
  await freshPage.getByRole('status').filter({ hasText: 'Utkast lagret på denne enheten.' }).waitFor();
  await freshPage.getByRole('button', { name: 'Hovedoverskrift', exact: true }).click();
  assert.equal(await freshPage.getByLabel('Tekst', { exact: true }).inputValue(), 'God jul, Æ Ø Å!');
  await freshPage.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('utekos-design-studio', 1);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('designs','readwrite');
      tx.objectStore('designs').put('{"version":999}', 'draft');
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error);
    }; request.onerror = () => reject(request.error);
  }));
  await freshPage.reload({waitUntil:'networkidle'});
  await freshPage.getByRole('alert').filter({hasText:'Det lagrede utkastet kunne ikke åpnes'}).waitFor();
  const retained = await freshPage.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('utekos-design-studio',1);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('designs','readonly'), read = tx.objectStore('designs').get('draft');
      tx.oncomplete = () => { db.close(); resolve(read.result); }; tx.onerror = () => reject(tx.error);
    }; request.onerror = () => reject(request.error);
  }));
  assert.equal(retained, '{"version":999}', 'Unreadable draft must never be overwritten');
  await fresh.close();
  const studioExternalRequests = [...external];
  await page.getByRole('link', {name:'← Tilbake',exact:true}).click();
  await page.waitForURL(`${origin}/`);
  await page.locator('#site-jsonld').waitFor({state:'attached'});
  assert.ok(await page.locator('body > header').count());
  assert.equal(await page.locator('[data-freeform-studio]').count(),0);
  await page.evaluate(() => {
    window.__studioMigrationSentinel = true;
    const link = document.createElement('a'); link.href='/design'; document.body.append(link); link.click();
  });
  await page.waitForURL(`${origin}/design`); await canvas.waitFor();
  assert.equal(await page.evaluate(() => window.__studioMigrationSentinel),undefined);
  assert.equal(await page.locator('#site-jsonld, body > header, body > footer').count(),0);
  await writeFile(`${output}/report.json`, JSON.stringify({ origin, viewports: [1440, 390],
    png: { width: 2400, height: 1800, excludesSelection: true }, loadedShopChunks, studioExternalRequests,
    checks: ['text editing', 'keyboard movement', 'undo/redo', 'shape rotation/corners', 'original image bytes/aspect',
      'brightness', 'draft reload', 'mobile touch drag/resize', 'invalid import preserves design', 'portable file in fresh browser', 'unreadable draft preserved', 'identical PNG across viewports', 'shop header and fresh cross-root navigation'],
    resources: initial, note: 'Resource list includes reloads; gzip values are estimates of decoded bodies. Shop chunk comparison requires the matching local build manifest and is skipped for remote origins.' }, null, 2));
  console.log('Studio checks passed: desktop, mobile touch, portable round trip, draft persistence, clean2400x1800 PNG.');
} finally { await browser.close(); }

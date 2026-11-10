import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const origin = new URL(process.argv[2] ?? 'http://localhost:3102').origin;
const output = process.argv[3] ?? 'outputs/studio-workspace-qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, hasTouch: true });
const route = request => {
  const url = new URL(request.request().url());
  if (url.origin === origin) return request.continue({ headers: { ...request.request().headers(),
    ...(process.env.VERCEL_OIDC_TOKEN ? { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } : {}) } });
  return ['data:', 'blob:'].includes(url.protocol) ? request.continue() : request.abort();
};
await context.route('**/*', route);
const page = await context.newPage(), errors = [], evidence = [];
page.on('pageerror', error => errors.push(error.message));
const field = label => page.getByLabel(label, { exact: true });
const saved = () => page.getByRole('status').filter({ hasText: 'Utkast lagret på denne enheten.' }).waitFor();
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
async function file(button) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: button, exact: true }).click();
  return readFile(await (await pending).path());
}
const documentFile = async () => JSON.parse((await file('Last ned designfil')).toString());
async function open(document) {
  await page.locator('input[type="file"]').nth(1).setInputFiles({ name: 'test.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(document)) });
  await saved(); await settle();
}
async function node(id) {
  return page.evaluate(id => {
    const stage = window.Konva.stages.find(stage => stage.container().isConnected);
    const item = stage.findOne('#' + id);
    return { x: item.x(), y: item.y(), width: item.width(), height: item.height(), rotation: item.rotation(),
      scaleX: item.scaleX(), scaleY: item.scaleY(), fontSize: item.fontSize?.(), align: item.align?.(), verticalAlign: item.verticalAlign?.() };
  }, id);
}
async function anchor(name) {
  await page.locator('.konvajs-content').scrollIntoViewIfNeeded();
  const box = await page.locator('.konvajs-content').boundingBox();
  return page.evaluate(({ name, box }) => {
    const stage = window.Konva.stages.find(stage => stage.container().isConnected);
    const a = stage.find('Transformer')[0].findOne('.' + name);
    const point = a.getAbsoluteTransform().point({ x: a.width() / 2, y: a.height() / 2 });
    return { x: box.x + point.x, y: box.y + point.y };
  }, { name, box });
}
async function resizeText(name, dx, dy, touch = false) {
  const start = await anchor(name), before = await node('text');
  const cdp = touch ? await context.newCDPSession(page) : null;
  if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  else { await page.mouse.move(start.x, start.y); await page.mouse.down(); }
  let during;
  for (let step = 1; step <= 6; step++) {
    const point = { x: start.x + dx * step / 6, y: start.y + dy * step / 6 };
    if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
    else await page.mouse.move(point.x, point.y);
    await settle(); during = await node('text');
    assert.equal(during.scaleX, 1, 'Glyphs must not scale horizontally while dragging');
    assert.equal(during.scaleY, 1, 'Glyphs must not scale vertically while dragging');
    assert.equal(during.fontSize, before.fontSize, 'Font size remains stable during gesture');
  }
  if (cdp) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach(); }
  else await page.mouse.up();
  await saved(); await settle();
  const after = await node('text');
  for (const property of ['width', 'height', 'x', 'y']) assert.ok(Math.abs(after[property] - during[property]) < 0.01, property + ' must not snap on release');
  if (dx) assert.ok(Math.abs(after.width - before.width) > 10, 'Frame width changes during gesture');
  if (dy) assert.ok(Math.abs(after.height - before.height) > 10, 'Frame height changes during gesture');
  evidence.push({ viewport: await page.viewportSize(), handle: name, touch, before, during, after });
}
async function inkBounds(png) {
  return page.evaluate(async base64 => {
    const image = new Image(); image.src = 'data:image/png;base64,' + base64; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, image.width, image.height);
    let left = Infinity, top = Infinity, right = -1, bottom = -1;
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
      const i = (y * image.width + x) * 4;
      if (data[i] < 80 && data[i + 1] < 80 && data[i + 2] < 80 && data[i + 3] > 100) {
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    return { left, top, right, bottom };
  }, png.toString('base64'));
}
try {
  assert.equal((await page.goto(origin + '/design')).status(), 200);
  await page.locator('[data-studio-card]').waitFor(); await saved();
  const base = await documentFile();
  const text = { id: 'text', kind: 'text', name: 'Testtekst', text: 'Tekst uten strekk', font: 'utekos-sans', weight: 500,
    fontSize: 36, fill: '#010b0a', x: 180, y: 200, width: 700, height: 220, rotation: 0, align: 'left', verticalAlign: 'top' };
  const textDocument = { ...base, background: '#f0eee9', elements: [text], assets: {} };
  await open(textDocument);
  await resizeText('bottom-center', 0, 45);
  await resizeText('top-center', 0, -25);
  await resizeText('middle-right', -60, 0);
  await field('Rotasjon').fill('25'); await settle();
  await resizeText('bottom-right', 20, 30);
  await open(textDocument);
  const horizontal = [];
  for (const align of ['left', 'center', 'right']) {
    await field('Tekstjustering').selectOption(align); await saved();
    horizontal.push(await inkBounds(await file('Eksporter kort')));
  }
  assert.ok(horizontal[0].left < horizontal[1].left && horizontal[1].left < horizontal[2].left, 'Actual exported ink follows horizontal alignment');
  const vertical = [];
  for (const align of ['top', 'middle', 'bottom']) {
    await field('Vertikal tekstjustering').selectOption(align); await saved();
    vertical.push(await inkBounds(await file('Eksporter kort')));
  }
  assert.ok(vertical[0].top < vertical[1].top && vertical[1].top < vertical[2].top, 'Actual exported ink follows vertical alignment');
  await page.screenshot({ path: output + '/desktop-alignment.png', fullPage: true });
  const aligned = await documentFile();
  await page.getByRole('button', { name: 'Tilpass boksen til teksten', exact: true }).click(); await saved();
  assert.ok(Number(await field('Bredde').inputValue()) < 700);
  assert.ok(Math.abs(Number(await field('Høyde').inputValue()) - Math.ceil(36 * 1.35)) < 0.01);
  const fitted = await node('text');
  assert.equal(fitted.fontSize, 36);
  await page.screenshot({ path: output + '/desktop-fitted.png', fullPage: true });
  const rect = { id: 'rect', kind: 'rect', name: 'Testfigur', x: 20, y: 300, width: 80, height: 80, rotation: 0, fill: '#b44701', cornerRadius: 12 };
  const blank = { ...base, background: '#f0eee9', elements: [], assets: {} };
  await open(blank); const blankPng = await file('Eksporter kort');
  for (const side of ['left', 'right', 'top', 'bottom']) {
    await open({ ...blank, elements: [rect] });
    await page.locator('.konvajs-content').scrollIntoViewIfNeeded();
    const card = await page.locator('[data-studio-card]').boundingBox();
    const stage = await page.locator('.konvajs-content').boundingBox();
    assert.ok(Math.abs(stage.width - await page.getByRole('group', { name: 'Forhåndsvisning av kort' }).evaluate(e => e.clientWidth)) < 2);
    const scale = card.width / base.width;
    const from = { x: card.x + (rect.x + rect.width / 2) * scale, y: card.y + (rect.y + rect.height / 2) * scale };
    const to = { x: from.x, y: from.y };
    if (side === 'left') to.x = (stage.x + card.x) / 2;
    if (side === 'right') to.x = (card.x + card.width + stage.x + stage.width) / 2;
    if (side === 'top') to.y = (stage.y + card.y) / 2;
    if (side === 'bottom') to.y = (card.y + card.height + stage.y + stage.height) / 2;
    await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(to.x, to.y, { steps: 10 }); await page.mouse.up();
    await saved(); await settle();
    const doc = await documentFile(), moved = doc.elements[0];
    if (side === 'left') assert.ok(moved.x < 0);
    if (side === 'right') assert.ok(moved.x > base.width);
    if (side === 'top') assert.ok(moved.y < 0);
    if (side === 'bottom') assert.ok(moved.y > base.height);
    const hit = await page.evaluate(({ x, y }) => {
      const stage = window.Konva.stages.find(stage => stage.container().isConnected);
      return stage.getIntersection({ x, y })?.id();
    }, { x: to.x - stage.x, y: to.y - stage.y });
    assert.equal(hit, 'rect', 'Off-card object remains rendered and selectable on ' + side);
    assert.equal(hash(await file('Eksporter kort')), hash(blankPng), 'Off-card object excluded from PNG on ' + side);
    await page.screenshot({ path: output + '/outside-' + side + '.png', fullPage: true });
    await page.reload(); await saved(); await page.locator('.konvajs-content').waitFor();
    assert.deepEqual(await documentFile(), doc, 'Off-card placement survives reload');
    await page.locator('.konvajs-content').scrollIntoViewIfNeeded();
    const reloadedStage = await page.locator('.konvajs-content').boundingBox();
    const center = await page.evaluate(() => {
      const stage = window.Konva.stages.find(stage => stage.container().isConnected);
      const item = stage.findOne('#rect');
      return item.getAbsoluteTransform().point({ x: item.width() / 2, y: item.height() / 2 });
    });
    await page.mouse.click(reloadedStage.x + center.x, reloadedStage.y + center.y);
    assert.ok(Math.abs(Number(await field('X-posisjon').inputValue()) - moved.x) < 0.01, 'Off-card object can be selected again after reload');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await open(textDocument); await resizeText('bottom-center', 0, 25, true); await resizeText('middle-right', -20, 0, true);
  await open(aligned); await settle();
  assert.equal(hash(await file('Eksporter kort')), hash(await (async () => {
    await page.setViewportSize({ width: 1440, height: 1100 }); await settle(); return file('Eksporter kort');
  })()), 'Alignment export is independent of viewport');
  await page.setViewportSize({ width: 390, height: 844 }); await settle();
  await page.screenshot({ path: output + '/mobile-alignment.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const legacy = { ...textDocument, version: 1, elements: textDocument.elements.map(element => {
    const copy = { ...element }; delete copy.align; delete copy.verticalAlign; return copy;
  }) };
  await open(legacy); const migrated = await documentFile();
  assert.equal(migrated.version, 2); assert.equal(migrated.elements[0].align, 'left');
  assert.equal(migrated.elements[0].width, 700); assert.equal(migrated.elements[0].height, 220);
  await page.evaluate(serialized => new Promise((resolve, reject) => {
    const request = indexedDB.open('utekos-design-studio', 1);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('designs', 'readwrite');
      tx.objectStore('designs').put(serialized, 'draft');
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error);
    }; request.onerror = () => reject(request.error);
  }), JSON.stringify(legacy));
  await page.reload(); await saved();
  assert.deepEqual(await documentFile(), migrated, 'Existing version 1 draft migrates without data loss');
  assert.deepEqual(errors, []);
  await writeFile(output + '/report.json', JSON.stringify({ origin, liveTextResize: evidence, horizontal, vertical,
    outsideCard: ['left', 'right', 'top', 'bottom'], outsideReload: true, clippedPng: true, fitted, legacyMigration: true, pageErrors: errors }, null, 2));
  console.log(JSON.stringify({ origin, checks: 'live mouse/touch text resize, alignment ink, fit, four workspace edges, reload, export and v1 migration passed', output }));
} finally { await browser.close(); }

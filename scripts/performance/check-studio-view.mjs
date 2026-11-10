import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const origin = new URL(process.argv[2] ?? 'http://localhost:3102').origin;
const output = process.argv[3] ?? 'outputs/studio-view-qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, hasTouch: true });
await context.route('**/*', route => {
  const url = new URL(route.request().url());
  if (url.origin === origin) return route.continue({ headers: { ...route.request().headers(),
    ...(process.env.VERCEL_OIDC_TOKEN ? { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } : {}) } });
  return ['data:', 'blob:'].includes(url.protocol) ? route.continue() : route.abort();
});
const page = await context.newPage(), errors = [], evidence = [];
page.on('pageerror', error => errors.push(error.message));
const field = label => page.getByLabel(label, { exact: true });
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const saved = () => page.getByRole('status').filter({ hasText: 'Utkast lagret på denne enheten.' }).waitFor();
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
async function file(button) {
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: button, exact: true }).click();
  return readFile(await (await pending).path());
}
const designFile = async () => JSON.parse((await file('Last ned designfil')).toString());
async function stageBox() { await page.locator('.konvajs-content').scrollIntoViewIfNeeded(); return page.locator('.konvajs-content').boundingBox(); }
async function camera() {
  return page.evaluate(() => {
    const stage = window.Konva.stages.find(stage => stage.container().isConnected);
    const point = stage.getLayers()[0].getAbsoluteTransform().point({ x: 0, y: 0 });
    return { ...point, scale: stage.scaleX() };
  });
}
async function geometry() {
  return page.evaluate(() => {
    const stage = window.Konva.stages.find(stage => stage.container().isConnected), node = stage.findOne('#element');
    return { width: node.width() * node.scaleX(), height: node.height() * node.scaleY(), rotation: node.rotation() };
  });
}
async function anchor(name) {
  const box = await stageBox();
  return page.evaluate(({ name, box }) => {
    const stage = window.Konva.stages.find(stage => stage.container().isConnected), node = stage.findOne('#element');
    const a = stage.find('Transformer')[0].findOne('.' + name);
    const point = a.getAbsoluteTransform().point({ x: a.width() / 2, y: a.height() / 2 });
    const center = node.getAbsoluteTransform().point({ x: node.width() / 2, y: node.height() / 2 });
    return { x: box.x + point.x, y: box.y + point.y, center: { x: box.x + center.x, y: box.y + center.y } };
  }, { name, box });
}
async function zoom(percent) { await field('Zoom i prosent').fill(String(percent)); await field('Zoom i prosent').press('Enter'); await settle(); }
async function checkHud(kind, pointer) {
  const hud = page.locator(`[data-studio-measurement="${kind}"]`);
  await hud.waitFor(); const label = await hud.textContent(), rect = await hud.boundingBox(), box = await stageBox();
  assert.ok(rect.x >= box.x && rect.y >= box.y && rect.x + rect.width <= box.x + box.width && rect.y + rect.height <= box.y + box.height, 'HUD remains within canvas');
  assert.ok(Math.hypot(rect.x + rect.width / 2 - pointer.x, rect.y + rect.height / 2 - pointer.y) < 200, 'HUD stays next to pointer');
  const value = await geometry();
  if (kind === 'rotation') {
    const degrees = ((value.rotation + 180) % 360 + 360) % 360 - 180;
    assert.equal(label, `${Math.round(degrees * 10) / 10}°`);
  } else assert.equal(label, `${Math.round(value.width)} × ${Math.round(value.height)} px`);
  evidence.push({ kind, label, pointer, rect, geometry: value, scale: (await camera()).scale });
}
try {
  assert.equal((await page.goto(origin + '/design')).status(), 200); await saved(); await page.locator('.konvajs-content').waitFor();
  const base = await designFile();
  const element = { id: 'element', kind: 'rect', name: 'Testfigur', x: 450, y: 350, width: 300, height: 200, rotation: 0, fill: '#b44701', cornerRadius: 12 };
  await page.locator('input[type="file"]').nth(1).setInputFiles({ name: 'test.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...base, elements: [element], assets: {} })) });
  await saved(); await settle();
  await zoom(100); assert.ok(Math.abs((await camera()).scale - 1) < 1e-8);
  let a = await anchor('rotater'); const angle = 35 * Math.PI / 180;
  const vector = { x: a.x - a.center.x, y: a.y - a.center.y };
  const target = { x: a.center.x + vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
    y: a.center.y + vector.x * Math.sin(angle) + vector.y * Math.cos(angle) };
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await checkHud('rotation', a);
  for (let step = 1; step <= 5; step++) {
    const point = { x: a.x + (target.x - a.x) * step / 5, y: a.y + (target.y - a.y) * step / 5 };
    await page.mouse.move(point.x, point.y); await settle(); await checkHud('rotation', point);
  }
  await page.screenshot({ path: output + '/desktop-live-rotation.png', fullPage: true });
  await page.mouse.up(); await page.locator('[data-studio-measurement]').waitFor({ state: 'detached' });
  assert.ok(Math.abs(Number(await field('Rotasjon').inputValue()) - 35) < 0.1);
  await field('Rotasjon').fill('0'); await settle();
  a = await anchor('bottom-right'); await page.mouse.move(a.x, a.y); await page.mouse.down();
  const resized = { x: a.x + 35, y: a.y + 25 };
  await page.mouse.move(resized.x, resized.y, { steps: 6 }); await settle(); await checkHud('size', resized);
  await page.screenshot({ path: output + '/desktop-live-size.png', fullPage: true });
  await page.mouse.up(); await page.locator('[data-studio-measurement]').waitFor({ state: 'detached' }); await saved();
  const document = await designFile(), png = await file('Eksporter kort');
  await zoom(150); assert.ok(Math.abs((await camera()).scale - 1.5) < 1e-8);
  assert.equal(hash(await file('Eksporter kort')), hash(png), 'Zoom never changes exported pixels');
  await page.getByRole('button', { name: 'Zoom ut', exact: true }).click(); await settle();
  assert.ok(Math.abs((await camera()).scale - 1.4) < 1e-8);
  await page.getByRole('button', { name: 'Zoom inn', exact: true }).click(); await settle();
  assert.ok(Math.abs((await camera()).scale - 1.5) < 1e-8);
  const slider = page.getByRole('slider', { name: 'Zoom', exact: true });
  await slider.focus(); await slider.press('Home'); await settle(); assert.equal((await camera()).scale, 0.05);
  await slider.press('ArrowRight'); await settle(); assert.equal((await camera()).scale, 0.06);
  await slider.press('End'); await settle(); assert.equal((await camera()).scale, 4);
  await zoom(100);
  let box = await stageBox(), view = await camera();
  const pointer = { x: Math.round(box.x + box.width * 0.65), y: Math.round(box.y + box.height * 0.55) };
  const beforePoint = { x: (pointer.x - box.x - view.x) / view.scale, y: (pointer.y - box.y - view.y) / view.scale };
  await page.mouse.move(pointer.x, pointer.y); await page.keyboard.down('Control'); await page.mouse.wheel(0, -30); await page.keyboard.up('Control'); await settle();
  view = await camera(); assert.ok(view.scale > 1);
  assert.ok(Math.abs((pointer.x - box.x - view.x) / view.scale - beforePoint.x) < 0.01, JSON.stringify({ pointer, box, view, beforePoint }));
  assert.ok(Math.abs((pointer.y - box.y - view.y) / view.scale - beforePoint.y) < 0.01);
  const beforePan = await camera(); await page.mouse.wheel(20, 30); await settle();
  view = await camera(); assert.ok(Math.abs(view.x - beforePan.x + 20) < 0.01 && Math.abs(view.y - beforePan.y + 30) < 0.01);
  await page.getByRole('button', { name: 'Flytt visning', exact: true }).click(); box = await stageBox();
  const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  view = await camera(); await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(from.x + 45, from.y + 20, { steps: 6 }); await page.mouse.up(); await settle();
  assert.ok(Math.abs((await camera()).x - view.x - 45) < 0.01, 'Hand tool pans the view');
  await page.getByRole('button', { name: 'Flytt visning', exact: true }).click();
  await page.getByRole('group', { name: 'Forhåndsvisning av kort', exact: true }).focus();
  view = await camera(); await page.mouse.move(from.x, from.y); await page.keyboard.down('Space'); await page.mouse.down();
  await page.mouse.move(from.x - 30, from.y + 10, { steps: 6 }); await page.mouse.up(); await page.keyboard.up('Space'); await settle();
  assert.ok(Math.abs((await camera()).x - view.x + 30) < 0.01, 'Space-drag pans over objects');
  assert.deepEqual(await designFile(), document, 'View changes never alter document or history');
  await page.getByRole('button', { name: 'Tilpass', exact: true }).click(); await settle();
  box = await stageBox(); view = await camera();
  assert.ok(view.x >= 40 && view.y >= 40 && view.x + base.width * view.scale <= box.width - 40);
  assert.equal(hash(await file('Eksporter kort')), hash(png));
  await page.screenshot({ path: output + '/desktop-footer.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 }); await settle();
  await page.getByRole('button', { name: 'Tilpass', exact: true }).click(); await settle(); box = await stageBox();
  const cdp = await context.newCDPSession(page);
  await page.getByRole('button', { name: 'Flytt visning', exact: true }).click(); box = await stageBox();
  const panStart = { x: box.x + box.width / 2, y: box.y + box.height / 2 }, touchPanView = await camera();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [panStart] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: panStart.x + 20, y: panStart.y + 10 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await settle();
  assert.ok(Math.abs((await camera()).x - touchPanView.x - 20) < 0.01, 'Hand tool pans with one finger');
  await page.getByRole('button', { name: 'Flytt visning', exact: true }).click();
  await page.getByRole('button', { name: 'Tilpass', exact: true }).click(); await settle(); box = await stageBox();
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const points = distance => [{ id: 1, x: center.x - distance, y: center.y }, { id: 2, x: center.x + distance, y: center.y }];
  const beforePinch = await camera();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(35) });
  for (let distance = 40; distance <= 60; distance += 5) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(distance) }); await settle(); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await settle();
  assert.ok((await camera()).scale > beforePinch.scale * 1.5, 'Two-finger pinch zooms on mobile');
  assert.deepEqual(await designFile(), document, 'Pinch never moves document elements');
  assert.equal(await page.getByRole('button', { name: 'Testfigur', exact: true }).getAttribute('aria-pressed'), 'true', 'Pinch retains selection');
  await page.getByRole('button', { name: 'Tilpass', exact: true }).click(); await settle();
  a = await anchor('bottom-right'); const touchEnd = { x: a.x + 15, y: a.y + 10 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touchEnd] }); await settle(); await checkHud('size', touchEnd);
  await page.screenshot({ path: output + '/mobile-live-size.png', fullPage: true });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await settle();
  await page.locator('[data-studio-measurement]').waitFor({ state: 'detached', timeout: 2000 }).catch(async error => {
    console.log(await page.evaluate(() => {
      const stage = window.Konva.stages.find(stage => stage.container().isConnected), tr = stage.find('Transformer')[0];
      return { transforming: tr.isTransforming(), anchor: tr.getActiveAnchor(), hud: document.querySelector('[data-studio-measurement]')?.textContent,
        cursor: stage.container().parentElement.style.cursor, pointers: stage.getPointersPositions() };
    })); throw error;
  });
  a = await anchor('rotater');
  const radians = 25 * Math.PI / 180, dx = a.x - a.center.x, dy = a.y - a.center.y;
  const rotationEnd = { x: a.center.x + dx * Math.cos(radians) - dy * Math.sin(radians), y: a.center.y + dx * Math.sin(radians) + dy * Math.cos(radians) };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] });
  for (let step = 1; step <= 5; step++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x + (rotationEnd.x - a.x) * step / 5, y: a.y + (rotationEnd.y - a.y) * step / 5 }] });
    await settle();
  }
  await checkHud('rotation', rotationEnd);
  await page.screenshot({ path: output + '/mobile-live-rotation.png', fullPage: true });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await settle();
  assert.equal(await page.locator('[data-studio-measurement]').count(), 0);
  await cdp.detach();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: output + '/mobile-footer.png', fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(output + '/report.json', JSON.stringify({ origin, measurements: evidence,
    zoom: ['percentage', 'slider keyboard', 'buttons', 'pointer anchored wheel', 'fit', 'pinch'],
    pan: ['wheel', 'hand tool mouse and touch', 'space drag'], unchangedDocument: true, unchangedExport: true, pageErrors: errors }, null, 2));
  console.log(JSON.stringify({ origin, output, checks: 'live pointer measurements, zoom, pan, pinch, unchanged document and PNG passed' }));
} finally { await browser.close(); }

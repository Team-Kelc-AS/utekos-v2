import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const origin = new URL(process.argv[2] ?? 'http://localhost:3102').origin;
const output = process.argv[3] ?? 'outputs/studio-selection-qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, hasTouch: true });
await context.route('**/*', route => {
  const url = new URL(route.request().url());
  if (url.origin === origin) return route.continue({ headers: { ...route.request().headers(),
    ...(process.env.VERCEL_OIDC_TOKEN ? { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } : {}) } });
  return ['data:', 'blob:'].includes(url.protocol) ? route.continue() : route.abort();
});
const page = await context.newPage(), errors = [], positions = [];
page.on('pageerror', error => errors.push(error.message));
const toolbar = page.getByRole('group', { name: 'Verktøy for valgt element', exact: true });
const more = () => toolbar.getByRole('button', { name: 'Flere valg', exact: true });
const menu = page.getByRole('menu', { name: 'Flere valg', exact: true });
const field = label => page.getByLabel(label, { exact: true });
const saved = () => page.getByRole('status').filter({ hasText: 'Utkast lagret på denne enheten.' }).waitFor();
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function file(button) {
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: button, exact: true }).click();
  return readFile(await (await pending).path());
}
const designFile = async () => JSON.parse((await file('Last ned designfil')).toString());
async function open(document) {
  await page.locator('input[type="file"]').nth(1).setInputFiles({ name: 'test.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(document)) });
  await saved(); await toolbar.waitFor(); await settle();
}
async function action(name, touch = false) {
  if (touch) await more().tap(); else await more().click();
  await menu.waitFor();
  if (touch) await menu.getByRole('menuitem', { name, exact: true }).tap();
  else await menu.getByRole('menuitem', { name, exact: true }).click();
  await menu.waitFor({ state: 'hidden' }); await saved(); await settle();
}
async function checkPosition(clear = true) {
  await toolbar.scrollIntoViewIfNeeded(); await settle();
  const rect = await toolbar.boundingBox(), stage = await page.locator('.konvajs-content').boundingBox();
  assert.ok(rect.x >= stage.x && rect.y >= stage.y && rect.x + rect.width <= stage.x + stage.width && rect.y + rect.height <= stage.y + stage.height, 'Toolbar remains in workspace');
  assert.ok(Math.abs(rect.width - 150) < 1 && Math.abs(rect.height - 54) < 1);
  for (const button of await toolbar.getByRole('button').all()) {
    const box = await button.boundingBox(); assert.ok(box.width >= 44 && box.height >= 44);
  }
  const selection = await page.evaluate(() => {
    const stage = window.Konva.stages.find(stage => stage.container().isConnected), transformer = stage.find('Transformer')[0];
    const object = transformer.nodes()[0].getClientRect();
    let left = object.x, top = object.y, right = object.x + object.width, bottom = object.y + object.height;
    // A rotated container's client rect overestimates the empty space between anchors.
    // Check the real circles and object separately instead.
    for (const anchor of transformer.find('._anchor').filter(anchor => anchor.visible())) {
      const center = anchor.getAbsoluteTransform().point({ x: anchor.width() / 2, y: anchor.height() / 2 });
      const radius = anchor.width() * anchor.getAbsoluteScale().x / 2;
      left = Math.min(left, center.x - radius); right = Math.max(right, center.x + radius);
      top = Math.min(top, center.y - radius); bottom = Math.max(bottom, center.y + radius);
    }
    return { x: left, y: top, width: right - left, height: bottom - top };
  });
  if (clear) assert.ok(rect.y + rect.height <= stage.y + selection.y - 8 || rect.y >= stage.y + selection.y + selection.height + 8 ||
    rect.x + rect.width <= stage.x + selection.x - 8 || rect.x >= stage.x + selection.x + selection.width + 8, 'Toolbar clears handles and object');
  positions.push({ viewport: await page.viewportSize(), toolbar: rect, stage, selection });
}
try {
  assert.equal((await page.goto(origin + '/design')).status(), 200); await saved(); await toolbar.waitFor();
  const base = await designFile();
  const a = { id: 'a', kind: 'rect', name: 'Figur A', x: 300, y: 260, width: 350, height: 220, rotation: 0, fill: '#b44701', cornerRadius: 18 };
  const b = { ...a, id: 'b', name: 'Figur B', x: 750, y: 500, width: 200, height: 140, fill: '#f0eee9' };
  const rectDocument = { ...base, elements: [a, b], assets: {} };
  await open(rectDocument); await checkPosition();
  await toolbar.getByRole('button', { name: 'Dupliser', exact: true }).click(); await saved(); await settle();
  let document = await designFile(); const copy = document.elements.find(element => element.name === 'Figur A (kopi)');
  assert.ok(copy && copy.id !== a.id); assert.equal(copy.x, a.x + 24); assert.equal(copy.y, a.y + 24);
  assert.equal(document.elements[1].id, copy.id);
  await page.getByRole('group', { name: 'Forhåndsvisning av kort', exact: true }).press('Control+z'); await saved();
  assert.equal((await designFile()).elements.length, 2);
  await page.getByRole('group', { name: 'Forhåndsvisning av kort', exact: true }).press('Control+Shift+z'); await saved();
  assert.equal((await designFile()).elements.length, 3);
  await toolbar.getByRole('button', { name: 'Slett', exact: true }).click(); await saved();
  assert.equal((await designFile()).elements.length, 2); assert.equal(await toolbar.count(), 0);
  await page.getByRole('button', { name: 'Angre', exact: true }).click(); await saved();
  await page.getByRole('button', { name: 'Figur A (kopi)', exact: true }).click(); await toolbar.waitFor();
  await action('Legg bakerst'); assert.equal((await designFile()).elements[0].id, copy.id);
  await action('Legg fremst'); assert.equal((await designFile()).elements.at(-1).id, copy.id);
  await field('Rotasjon').fill('35'); await saved(); await checkPosition();
  await action('Midtstill vannrett'); await action('Midtstill loddrett');
  const visual = await page.evaluate(id => {
    const stage = window.Konva.stages.find(stage => stage.container().isConnected); return stage.findOne('#' + id).getClientRect();
  }, copy.id);
  const stage = await page.locator('.konvajs-content').boundingBox(), card = await page.locator('[data-studio-card]').boundingBox();
  // DOM layout quantizes the card marker to 1/64 px; the canvas keeps float coordinates.
  assert.ok(Math.abs(stage.x + visual.x + visual.width / 2 - card.x - card.width / 2) < 0.1);
  assert.ok(Math.abs(stage.y + visual.y + visual.height / 2 - card.y - card.height / 2) < 0.1);
  document = await designFile(); await more().focus(); await more().press('ArrowDown'); await menu.waitFor();
  await page.keyboard.press('End'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Escape'); await menu.waitFor({ state: 'hidden' });
  assert.ok(await more().evaluate(element => element === window.document.activeElement), 'Escape returns focus to trigger');
  assert.deepEqual(await designFile(), document, 'Menu keyboard navigation never moves document objects');
  await more().click(); await menu.waitFor(); await page.screenshot({ path: output + '/desktop-menu.png', fullPage: true });
  await page.getByRole('heading', { name: 'Kort- og designstudio', exact: true }).click(); await menu.waitFor({ state: 'hidden' });
  const png = await file('Eksporter kort');
  const box = await page.locator('.konvajs-content').boundingBox(); await page.mouse.click(box.x + 20, box.y + 20);
  assert.equal(await toolbar.count(), 0);
  assert.equal(createHash('sha256').update(await file('Eksporter kort')).digest('hex'), createHash('sha256').update(png).digest('hex'), 'Floating controls never enter PNG export');

  const text = { ...base.elements.find(element => element.kind === 'text'), id: 'text', name: 'Testtekst', text: 'En kort hilsen',
    x: 250, y: 280, width: 600, height: 220, fontSize: 36, weight: 500, rotation: 0 };
  await open({ ...base, elements: [text], assets: {} }); await action('Rediger tekst');
  assert.ok(await field('Tekst').evaluate(element => element === window.document.activeElement));
  await action('Tilpass boksen til teksten'); assert.ok(Number(await field('Bredde').inputValue()) < 600); assert.equal(Number(await field('Høyde').inputValue()), 49);
  const asset = await page.evaluate(() => {
    const canvas = window.document.createElement('canvas'); canvas.width = 80; canvas.height = 40;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#b44701'; ctx.fillRect(0, 0, 80, 40);
    return { mime: 'image/png', base64: canvas.toDataURL().split(',')[1], width: 80, height: 40 };
  });
  const image = { id: 'photo', kind: 'image', name: 'Bilde', assetId: 'photo', x: 400, y: 350, width: 240, height: 120, rotation: 25, brightness: 0.1 };
  await open({ ...base, elements: [image], assets: { photo: asset } });
  await toolbar.getByRole('button', { name: 'Dupliser', exact: true }).click(); await saved();
  document = await designFile(); assert.deepEqual(document.assets, { photo: asset }); assert.equal(document.elements[1].assetId, 'photo');
  await page.getByRole('complementary', { name: 'Designverktøy', exact: true }).getByRole('button', { name: 'Bilde', exact: true }).click();
  await toolbar.getByRole('button', { name: 'Slett', exact: true }).click(); await saved();
  assert.deepEqual((await designFile()).assets, { photo: asset });
  await page.reload(); await saved(); await page.getByRole('button', { name: 'Bilde (kopi)', exact: true }).click();
  await toolbar.getByRole('button', { name: 'Slett', exact: true }).click(); await saved(); assert.deepEqual((await designFile()).assets, {});

  await page.setViewportSize({ width: 390, height: 844 }); await open(rectDocument); await checkPosition();
  await toolbar.getByRole('button', { name: 'Dupliser', exact: true }).tap(); await saved(); await toolbar.waitFor(); await checkPosition();
  await more().tap(); await menu.waitFor();
  const popup = await menu.boundingBox(); assert.ok(popup.x >= 0 && popup.y >= 0 && popup.x + popup.width <= 390 && popup.y + popup.height <= 844);
  await page.screenshot({ path: output + '/mobile-menu.png', fullPage: true });
  await menu.getByRole('menuitem', { name: 'Midtstill vannrett', exact: true }).tap(); await saved();
  await field('Rotasjon').fill('90'); await saved(); await checkPosition();
  await field('Zoom i prosent').fill('100'); await field('Zoom i prosent').press('Enter'); await settle(); await checkPosition(false);
  await page.getByRole('button', { name: 'Tilpass', exact: true }).click(); await settle();
  await page.screenshot({ path: output + '/mobile-toolbar.png', fullPage: true });
  await toolbar.getByRole('button', { name: 'Slett', exact: true }).tap(); await saved();
  assert.equal(await toolbar.count(), 0); assert.equal(await menu.count(), 0);
  assert.ok(await page.evaluate(() => window.document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  await writeFile(output + '/report.json', JSON.stringify({ origin, positions, checks: ['duplicate/delete mouse and touch', 'undo/redo', 'original image bytes and shared assets',
    'all layer extremes', 'rotated centering', 'keyboard navigation and Escape focus', 'outside dismissal', 'text edit/fit', 'mobile popup boundaries', 'zoom and rotation positioning', 'clean PNG'], pageErrors: errors }, null, 2));
  console.log(JSON.stringify({ origin, output, checks: 'floating toolbar, menu actions, keyboard, touch, image integrity and export passed' }));
} finally { await browser.close(); }

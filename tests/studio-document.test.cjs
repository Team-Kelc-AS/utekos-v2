/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');
const core = loadTypeScript('lib/studio/document.ts');

test('portable design round trip retains text, transforms and original embedded image bytes', () => {
  const doc = core.createDocument();
  const asset = { mime: 'image/png', base64: 'YWJjZA==', width: 300, height: 200 };
  doc.assets.photo = asset;
  doc.elements.push({ id: 'photo', kind: 'image', name: 'Bilde', assetId: 'photo', x: 500, y: 100,
    width: 300, height: 200, rotation: 25, brightness: 0.2 });
  doc.elements[1].text = 'God jul, Æ Ø Å! 🎄';
  const serialized = core.serializeDocument(doc);
  const restored = core.parseDocument(serialized);
  assert.deepEqual(JSON.parse(JSON.stringify(restored)), JSON.parse(serialized));
  assert.equal(restored.assets.photo.base64, asset.base64);
  assert.equal(restored.elements[1].font, 'utekos-sans');
  for (const forbidden of ['data:image', 'Konva', 'blob:', 'HTMLImageElement', 'localhost']) assert.ok(!serialized.includes(forbidden));
});

test('invalid or future files cannot silently lose fields or change image proportions', () => {
  const base = core.createDocument();
  for (const patch of [{ version: 2 }, { unknown: true }, { width: 0 }, { background: 'url(https://example.com)' }]) {
    assert.throws(() => core.parseDocument(JSON.stringify({ ...base, ...patch })));
  }
  assert.throws(() => core.parseDocument(JSON.stringify({ ...base, elements: [base.elements[0], base.elements[0]] })));
  const photo = { id: 'photo', kind: 'image', name: 'Bilde', assetId: 'photo', x: 0, y: 0, width: 300, height: 300, rotation: 0, brightness: 0 };
  assert.throws(() => core.parseDocument(JSON.stringify({ ...base, elements: [photo] })));
  assert.throws(() => core.parseDocument(JSON.stringify({ ...base, elements: [photo], assets: { photo: { mime: 'image/png', base64: 'YWJjZA==', width: 300, height: 200 } } })));
});

test('rotated elements remain fully within the design with aspect ratio unchanged', () => {
  const doc = core.createDocument();
  for (const rotation of [-180, -135, -90, -45, 0, 45, 90, 135, 180]) {
    for (const position of [-400, 800, 1500]) {
      const input = { ...doc.elements[0], width: 1500, height: 1100, x: position, y: position, rotation };
      const output = core.constrainElement(doc, input);
      assert.ok(Math.abs(output.width / output.height - input.width / input.height) < 1e-9);
      const bounds = core.rotatedBounds(output);
      assert.ok(output.x + bounds.left >= -1e-8);
      assert.ok(output.y + bounds.top >= -1e-8);
      assert.ok(output.x + bounds.right <= doc.width + 1e-8);
      assert.ok(output.y + bounds.bottom <= doc.height + 1e-8);
      core.parseDocument(JSON.stringify({ ...doc, elements: [output] }));
    }
  }
});

test('undo and redo retain immutable documents; a new edit clears the redo branch', () => {
  let history = core.createHistory();
  const original = core.serializeDocument(history.present);
  const changed = { ...history.present, background: '#f0eee9' };
  history = core.studioReducer(history, { type: 'commit', document: changed });
  history = core.studioReducer(history, { type: 'undo' });
  assert.equal(core.serializeDocument(history.present), original);
  history = core.studioReducer(history, { type: 'redo' });
  assert.equal(history.present.background, '#f0eee9');
  history = core.studioReducer(history, { type: 'undo' });
  history = core.studioReducer(history, { type: 'edit', update: document => ({ ...document, background: '#b44701' }) });
  assert.equal(history.future.length, 0);
  assert.equal(history.present.background, '#b44701');
});

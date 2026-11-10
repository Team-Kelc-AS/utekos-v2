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
  for (const patch of [{ version: 3 }, { unknown: true }, { width: 0 }, { background: 'url(https://example.com)' }]) {
    assert.throws(() => core.parseDocument(JSON.stringify({ ...base, ...patch })));
  }
  assert.throws(() => core.parseDocument(JSON.stringify({ ...base, elements: [base.elements[0], base.elements[0]] })));
  const photo = { id: 'photo', kind: 'image', name: 'Bilde', assetId: 'photo', x: 0, y: 0, width: 300, height: 300, rotation: 0, brightness: 0 };
  assert.throws(() => core.parseDocument(JSON.stringify({ ...base, elements: [photo] })));
  assert.throws(() => core.parseDocument(JSON.stringify({ ...base, elements: [photo], assets: { photo: { mime: 'image/png', base64: 'YWJjZA==', width: 300, height: 200 } } })));
});

test('objects keep their position and proportions outside the card at every rotation', () => {
  const doc = core.createDocument();
  for (const rotation of [-180, -135, -90, -45, 0, 45, 90, 135, 180]) {
    for (const position of [-400, 800, 1500]) {
      const input = { ...doc.elements[0], width: 1500, height: 1100, x: position, y: position, rotation };
      const output = core.normalizeElement(input);
      assert.ok(Math.abs(output.width / output.height - input.width / input.height) < 1e-9);
      assert.equal(output.x, position);
      assert.equal(output.y, position);
      assert.equal(output.width, input.width);
      assert.equal(output.height, input.height);
      core.parseDocument(JSON.stringify({ ...doc, elements: [output] }));
    }
  }
});

test('version 1 migrates explicitly without moving, resizing or losing existing content', () => {
  const legacy = { ...core.createDocument(), version: 1 };
  legacy.elements = legacy.elements.map(element => {
    const copy = { ...element }; delete copy.align; delete copy.verticalAlign; return copy;
  });
  const migrated = core.parseDocument(JSON.stringify(legacy));
  assert.equal(migrated.version, 2);
  migrated.elements.forEach((element, index) => {
    const { align, verticalAlign, ...rest } = element;
    assert.equal(align, 'left'); assert.equal(verticalAlign, 'top');
    assert.deepEqual(JSON.parse(JSON.stringify(rest)), legacy.elements[index]);
  });
  assert.throws(() => core.parseDocument(JSON.stringify({ ...legacy, elements: [{ ...legacy.elements[0], unknown: true }] })));
});

test('text alignment and off-card objects survive files, history and validation', () => {
  const doc = core.createDocument();
  const text = { ...doc.elements[1], x: -600, y: 1100, align: 'right', verticalAlign: 'bottom' };
  const edited = core.replaceElement(doc, text);
  assert.deepEqual(JSON.parse(JSON.stringify(core.parseDocument(core.serializeDocument(edited)))), JSON.parse(JSON.stringify(edited)));
  let history = core.studioReducer(core.createHistory(doc), { type: 'commit', document: edited });
  history = core.studioReducer(history, { type: 'undo' });
  assert.equal(history.present.elements[1].align, 'left');
  history = core.studioReducer(history, { type: 'redo' });
  assert.equal(history.present.elements[1].x, -600);
  assert.equal(history.present.elements[1].verticalAlign, 'bottom');
  for (const patch of [{ align: 'invalid' }, { verticalAlign: 'invalid' }, { x: 9000 }]) {
    assert.throws(() => core.parseDocument(JSON.stringify({ ...edited, elements: [{ ...text, ...patch }] })));
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

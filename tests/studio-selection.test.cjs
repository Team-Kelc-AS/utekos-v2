/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');
const core = loadTypeScript('lib/studio/document.ts');
const actions = loadTypeScript('lib/studio/selection.ts');
const view = loadTypeScript('lib/studio/viewport.ts');
const plain = value => JSON.parse(JSON.stringify(value));

test('duplicate preserves content, rotation, formatting and the original asset reference', () => {
  const doc = core.createDocument();
  doc.assets.photo = { mime: 'image/png', base64: 'YWJjZA==', width: 300, height: 200 };
  doc.elements.push({ id: 'image', kind: 'image', name: 'Bilde', assetId: 'photo', brightness: 0.2,
    x: -80, y: 150, width: 300, height: 200, rotation: 35 });
  for (const element of doc.elements) {
    const output = actions.duplicateElement(doc, element.id, 'copy');
    const copy = output.elements.find(item => item.id === 'copy');
    assert.deepEqual(plain(copy), { ...plain(element), id: 'copy', name: element.name + ' (kopi)', x: element.x + 24, y: element.y + 24 });
    assert.equal(output.assets, doc.assets);
    assert.equal(output.elements[output.elements.indexOf(element) + 1].id, 'copy');
    core.parseDocument(core.serializeDocument(output));
  }
  const duplicated = actions.duplicateElement(doc, 'image', 'copy');
  assert.ok(actions.removeElement(duplicated, 'image').assets.photo, 'Original bytes retained while copy exists');
  assert.equal(Object.keys(actions.removeElement(actions.removeElement(duplicated, 'image'), 'copy').assets).length, 0);
});

test('duplicates respect document limits and remain valid at coordinate limits', () => {
  const doc = core.createDocument(); doc.elements[0].name = 'X'.repeat(100); doc.elements[0].x = 8192; doc.elements[0].y = 8192;
  const output = actions.duplicateElement(doc, doc.elements[0].id, 'copy');
  assert.equal(output.elements[1].name.length, 100); assert.equal(output.elements[1].x, 8168); assert.equal(output.elements[1].y, 8168);
  core.serializeDocument(output);
  const full = { ...doc, elements: Array.from({ length: core.MAX_ELEMENTS }, (_, i) => ({ ...doc.elements[0], id: String(i) })) };
  assert.equal(actions.duplicateElement(full, '0', 'copy'), full);
  assert.equal(actions.duplicateElement(doc, 'missing', 'copy'), doc);
  assert.equal(actions.duplicateElement(doc, doc.elements[0].id, doc.elements[1].id), doc);
});

test('all four ordering actions move only the selected element', () => {
  const doc = core.createDocument(), ids = doc.elements.map(item => item.id);
  const order = action => plain(actions.orderElement(doc, ids[1], action).elements.map(item => item.id));
  assert.deepEqual(order('front'), [ids[0], ids[2], ids[1]]);
  assert.deepEqual(order('back'), [ids[1], ids[0], ids[2]]);
  assert.deepEqual(order('forward'), order('front'));
  assert.deepEqual(order('backward'), order('back'));
  assert.equal(actions.orderElement(doc, ids[0], 'backward'), doc);
  assert.equal(actions.orderElement(doc, ids[2], 'forward'), doc);
});

test('centering uses the visible rotated bounds and preserves the other axis and dimensions', () => {
  const doc = core.createDocument();
  for (const rotation of [-180, -135, -90, -35, 0, 35, 90, 135, 180]) {
    const element = { ...doc.elements[0], rotation, x: -300, y: 1100 };
    const edited = { ...doc, elements: [element] }, bounds = core.rotatedBounds(element);
    const horizontal = actions.centerElement(edited, element.id, 'horizontal').elements[0];
    const vertical = actions.centerElement(edited, element.id, 'vertical').elements[0];
    assert.ok(Math.abs(horizontal.x + (bounds.left + bounds.right) / 2 - doc.width / 2) < 1e-8);
    assert.ok(Math.abs(vertical.y + (bounds.top + bounds.bottom) / 2 - doc.height / 2) < 1e-8);
    assert.equal(horizontal.y, element.y); assert.equal(vertical.x, element.x);
    assert.equal(horizontal.width, element.width); assert.equal(vertical.height, element.height);
  }
});

test('duplicate, delete and positioning are reversible through the existing history', () => {
  const doc = core.createDocument(); let state = core.createHistory(doc);
  for (const document of [actions.duplicateElement(doc, 'heading', 'copy'), actions.removeElement(doc, 'heading'), actions.centerElement(doc, 'heading', 'horizontal')]) {
    state = core.studioReducer(core.createHistory(doc), { type: 'commit', document });
    state = core.studioReducer(state, { type: 'undo' }); assert.deepEqual(plain(state.present), plain(doc));
    state = core.studioReducer(state, { type: 'redo' }); assert.deepEqual(plain(state.present), plain(document));
  }
});

test('floating toolbar clears the rotation handle and stays within mobile and desktop workspaces', () => {
  const element = { ...core.createDocument().elements[1], x: 100, y: 150, width: 300, height: 200 };
  const position = view.selectionToolbarPosition(element, { x: 0, y: 0, scale: 1 }, 1100, 720);
  assert.equal(position.y + view.SELECTION_TOOLBAR_HEIGHT, 150 - 36 - 10 - 12);
  for (const [width, height] of [[366, 480], [1100, 720]]) for (const rotation of [-135, -35, 0, 35, 90]) {
    for (const x of [-2000, 0, 100, 2000]) {
      const position = view.selectionToolbarPosition({ ...element, x, y: x, rotation }, { x: 40, y: 60, scale: 0.3 }, width, height);
      assert.ok(position.x >= 8 && position.y >= 8);
      assert.ok(position.x + view.SELECTION_TOOLBAR_WIDTH <= width - 8);
      assert.ok(position.y + view.SELECTION_TOOLBAR_HEIGHT <= height - 8);
    }
  }
});

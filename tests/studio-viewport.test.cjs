/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');
const { fitView, zoomView, measurementPosition, MIN_ZOOM, MAX_ZOOM } = loadTypeScript('lib/studio/viewport.ts');

test('zoom preserves the document point under the pointer, including nonzero pan', () => {
  const view = { x: -238, y: 91, scale: 0.7 }, point = { x: 314, y: 270 };
  for (const scale of [0.05, 0.25, 1, 2, 4]) {
    const next = zoomView(view, scale, point);
    assert.ok(Math.abs((point.x - next.x) / next.scale - (point.x - view.x) / view.scale) < 1e-8);
    assert.ok(Math.abs((point.y - next.y) / next.scale - (point.y - view.y) / view.scale) < 1e-8);
  }
});

test('pinch zoom keeps the original center point under the moving gesture center', () => {
  const view = { x: 40, y: 70, scale: 0.3 }, start = { x: 150, y: 230 }, end = { x: 190, y: 210 };
  const next = zoomView(view, 0.6, start, end);
  assert.ok(Math.abs((start.x - view.x) / view.scale - (end.x - next.x) / next.scale) < 1e-8);
  assert.ok(Math.abs((start.y - view.y) / view.scale - (end.y - next.y) / next.scale) < 1e-8);
});

test('zoom limits and fit work for mobile and desktop without changing document dimensions', () => {
  assert.equal(zoomView({ x: 0, y: 0, scale: 1 }, 100, { x: 0, y: 0 }).scale, MAX_ZOOM);
  assert.equal(zoomView({ x: 0, y: 0, scale: 1 }, 0.001, { x: 0, y: 0 }).scale, MIN_ZOOM);
  for (const [width, height] of [[366, 480], [1100, 720]]) {
    const view = fitView(width, height, 1200, 900);
    assert.ok(view.x >= 40 && view.y >= 40);
    assert.ok(view.x + 1200 * view.scale <= width - 40);
    assert.ok(view.y + 900 * view.scale <= height - 40);
  }
});

test('live measurements stay inside the canvas and clear the touch point', () => {
  for (const rotating of [true, false]) for (const point of [{ x: 0, y: 0 }, { x: 366, y: 480 }, { x: 180, y: 200 }]) {
    const pos = measurementPosition(point, 366, 480, rotating, true);
    assert.ok(pos.x >= 8 && pos.y >= 8);
    assert.ok(pos.x + (rotating ? 72 : 156) <= 358);
    assert.ok(pos.y + 32 <= 472);
    if (point.y === 200) assert.ok(pos.y + 32 < point.y);
  }
});

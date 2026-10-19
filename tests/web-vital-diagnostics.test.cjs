/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');
class Element {
  tagName = 'INPUT';
  textContent = 'private text';
  value = 'private value';
  closest(selector) { return selector === '[data-journey-section="purchase"]' ? this : null; }
}
const { summarizeVitalEntries, vitalDocumentPath } = loadTypeScript('lib/tracking/web-vital-diagnostics.ts', { globals: { Element } });
test('diagnostics bound payload size and exclude DOM content and URLs', () => {
  const result = summarizeVitalEntries(Array.from({ length: 20 }, (_, startTime) => ({
    entryType: 'layout-shift', startTime, duration: 0, value: .2, hadRecentInput: false,
    name: 'https://example.test/?secret=private',
    sources: Array.from({ length: 8 }, () => ({ node: new Element(), previousRect: { x: 1, y: 2, width: 3, height: 4 }, currentRect: { x: 1, y: 20, width: 3, height: 4 } })),
  })));
  assert.equal(result.length, 10);
  assert.equal(result[0].start_time, 10);
  assert.equal(result[0].sources.length, 5);
  assert.equal(result[0].sources[0].region, '[data-journey-section="purchase"]');
  assert.equal(result[0].sources[0].current_rect.y, 20);
  assert.doesNotMatch(JSON.stringify(result), /private|secret|https:/);
});
test('document metric retains original pathname after client navigation without query data', () => {
  assert.equal(vitalDocumentPath('https://utekos.no/produkter/comfyrobe?fbclid=private', 'https://utekos.no/produkter/utekos-dun'), '/produkter/comfyrobe');
  assert.equal(vitalDocumentPath(undefined, 'https://utekos.no/produkter/comfyrobe?private=1'), '/produkter/comfyrobe');
  assert.equal(vitalDocumentPath('https://external.test/private', 'https://utekos.no/produkter/comfyrobe'), '/produkter/comfyrobe');
});

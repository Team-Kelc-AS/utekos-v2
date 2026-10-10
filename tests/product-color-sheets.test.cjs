/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadTypeScript } = require('./load-typescript.cjs');
const { productVariantColorSheet } = loadTypeScript('lib/products/variantColorSheets.ts');

const variant = (color, size = 'Medium') => ({ selectedOptions: [
  { name: 'Størrelse', value: size },
  ...(color ? [{ name: 'Farge', value: color }] : []),
] });

test('each product color resolves its exact supplied sheet independently of size', () => {
  const cases = [
    ['utekos-techdown', 'Havdyp', 'MARITIME_BLUE'],
    ['utekos-svale', undefined, 'MARITIME_BLUE_MOONSTUCK'],
    ['utekos-svale', 'Havdyp', 'MARITIME_BLUE_MOONSTUCK'],
    ['utekos-dun', 'Vargnatt', 'ANTHRACITE'],
    ['utekos-mikrofiber', 'Vargnatt', 'ANTHRACITE'],
    ['utekos-dun', 'Fjellblå', 'PATRIOT_BLUE'],
    ['utekos-mikrofiber', 'Fjellblå', 'PATRIOT_BLUE'],
  ];
  for (const [handle, color, sheet] of cases) for (const size of ['Small', 'Medium', 'Large', 'Liten', 'Middels', 'Stor', 'Større']) {
    const result = productVariantColorSheet(handle, variant(color, size));
    assert.equal(result.src, `/images/PANTONE_${sheet}_1000x1500.png`);
    assert.ok(result.alt.startsWith('Fargeark: PANTONE '));
    const png = fs.readFileSync(path.join(__dirname, '../public', result.src));
    assert.equal(png.readUInt32BE(16), 1000);
    assert.equal(png.readUInt32BE(20), 1500);
  }
});

test('Comfyrobe, accessories and unknown colors do not receive a substitute sheet', () => {
  for (const handle of ['comfyrobe', 'utekos-stapper', 'unknown-product']) {
    for (const color of ['Havdyp', 'Vargnatt', 'Fjellnatt', 'Fjellblå', undefined]) {
      assert.equal(productVariantColorSheet(handle, variant(color)), undefined);
    }
  }
  for (const handle of ['utekos-dun', 'utekos-mikrofiber', 'utekos-techdown', 'utekos-svale']) {
    assert.equal(productVariantColorSheet(handle, variant('unknown-color')), undefined);
  }
  for (const handle of ['utekos-dun', 'utekos-mikrofiber', 'utekos-techdown']) {
    assert.equal(productVariantColorSheet(handle, variant()), undefined);
  }
  for (const handle of ['utekos-dun', 'utekos-mikrofiber']) {
    assert.equal(productVariantColorSheet(handle, variant('Fjellnatt')), undefined);
  }
});

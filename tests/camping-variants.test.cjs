/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');
const { campingVariantCards } = loadTypeScript('lib/catalog/campingVariantCards.ts');
const variant = (id, availableForSale = true, currentlyNotInStock = false) => ({
  id: `gid://shopify/ProductVariant/${id}`, availableForSale, currentlyNotInStock,
});
const product = (handle, nodes) => ({ handle, variants: { nodes } });

test('camping leads with all TechDown variants and keeps other models stock-filtered', () => {
  const stor = variant('46944403915000');
  const storre = variant('48249962135800');
  const large = variant('42903231103224');
  const medium = variant('42903231037688');
  const unknown = variant('unknown-stock');
  delete unknown.currentlyNotInStock;
  const middels = variant('46944403882232', false);
  const backorder = variant('backorder', true, true);
  const cards = campingVariantCards([
    product('utekos-techdown', [middels, storre, stor, unknown, backorder]),
    product('utekos-mikrofiber', [medium, large]),
    product('utekos-dun', [variant('dun', false)]),
  ]);
  assert.deepEqual(Array.from(cards, card => card.variant.id), [stor, middels, storre, unknown, backorder, large, medium].map(item => item.id));
  assert.equal(cards[0].variant, stor, 'preserve the exact purchase variant');
  assert.equal(cards[1].variant, middels);
});

test('other models are omitted when stock is unavailable or unknown', () => {
  const unknown = variant('unknown');
  delete unknown.currentlyNotInStock;
  assert.equal(campingVariantCards([product('utekos-mikrofiber', [variant('sold-out', false), unknown])]).length, 0);
});

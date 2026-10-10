/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');
const api = loadTypeScript('lib/catalog/modelPurchase.ts');
const variant = (id, size, color, available = true, amount = '1990') => ({
  id: `gid://shopify/ProductVariant/${id}`, price: { amount, currencyCode: 'NOK' }, available,
  selectedOptions: [{ name: 'Størrelse', value: size }, { name: 'Farge', value: color }, { name: 'Kjønn', value: 'Unisex' }], image: null,
});
const variants = [variant(1, 'Medium', 'Vargnatt', false), variant(2, 'Large', 'Vargnatt'), variant(3, 'Medium', 'Fjellblå'), variant(4, 'Large', 'Fjellblå', true, '2190')];
test('size and variable color both require explicit selection; no first-available substitution', () => {
  const choice = api.initialModelChoice(variants);
  assert.equal(choice.Kjønn, 'Unisex');
  assert.equal(choice.Størrelse, undefined);
  assert.equal(choice.Farge, undefined);
  assert.equal(api.selectedModelVariant(variants, choice), undefined);
  assert.equal(api.selectedModelVariant(variants, { ...choice, Størrelse: 'Medium' }), undefined);
});
test('every size/color resolves exactly its own ID, price, availability and image', () => {
  for (const v of variants) {
    const choice = Object.fromEntries(v.selectedOptions.map(o => [o.name, o.value]));
    assert.equal(api.selectedModelVariant(variants, choice), v);
  }
  const soldOut = api.selectedModelVariant(variants, { Størrelse: 'Medium', Farge: 'Vargnatt', Kjønn: 'Unisex' });
  assert.equal(soldOut.id, 'gid://shopify/ProductVariant/1');
  assert.equal(soldOut.available, false);
  assert.equal(api.modelOptionAvailable(variants, { Størrelse: 'Medium' }, 'Farge', 'Vargnatt'), false);
  assert.equal(api.modelOptionAvailable(variants, { Størrelse: 'Medium' }, 'Farge', 'Fjellblå'), true);
});
test('even a single size is unselected initially; ambiguous or missing combinations cannot buy', () => {
  const one = [variants[0]];
  assert.equal(api.initialModelChoice(one).Farge, 'Vargnatt');
  assert.equal(api.selectedModelVariant(one, api.initialModelChoice(one)), undefined);
  const choice = { Størrelse: 'Medium', Farge: 'Vargnatt', Kjønn: 'Unisex' };
  assert.equal(api.selectedModelVariant([...one, { ...one[0], id: 'other' }], choice), undefined);
  assert.equal(api.selectedModelVariant(one, { ...choice, Størrelse: 'Small' }), undefined);
});
test('compact public DTO blocks backorders and excludes inventory and backend fields', () => {
  const full = variants.map((v, i) => ({ ...v, availableForSale: true, currentlyNotInStock: i === 0, quantityAvailable: 10, sku: 'secret', taxable: true, barcode: 'internal' }));
  const mapped = api.modelVariants({ variants: { nodes: full } });
  assert.equal(mapped[0].available, false);
  assert.equal(mapped[1].available, true);
  assert.deepEqual(Object.keys(mapped[0]).sort(), ['available', 'id', 'image', 'price', 'selectedOptions']);
  assert.equal(api.modelPreviewVariant(full), full[1]);
  const unknown = { ...full[1], currentlyNotInStock: undefined };
  assert.equal(api.modelVariants({ variants: { nodes: [unknown] } })[0].available, false);
});
test('model pricing retains the exact Shopify money range', () => {
  const range = api.modelPriceRange(variants);
  assert.equal(range.min.amount, '1990');
  assert.equal(range.max.amount, '2190');
  assert.equal(api.modelPriceRange([]), null);
});

test('camping keeps exactly four model handles in the approved order', () => {
  const { categories } = loadTypeScript('lib/catalog/categories.ts');
  assert.deepEqual(Array.from(categories['camping-og-bobil'].source.handles), ['utekos-svale', 'utekos-techdown', 'utekos-mikrofiber', 'utekos-dun']);
});

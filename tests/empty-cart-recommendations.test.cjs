/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');
const { popularCartVariants, selectEmptyCartRecommendations } = loadTypeScript('lib/cart/popular-cart-variants.ts');
const { emptyCartRecommendationsSchema } = loadTypeScript('lib/cart/empty-cart-recommendations.ts');

const cards = () => popularCartVariants.map((selection, index) => ({
  product: { handle: selection.handle, title: 'Default Shopify name / Unisex' },
  variant: {
    id: `gid://shopify/ProductVariant/${selection.id}`, title: 'Havdyp / Stor / Unisex',
    availableForSale: true, currentlyNotInStock: false,
    price: { amount: String(1990 + index), currencyCode: 'NOK' },
    image: { url: `https://example.test/${selection.id}.webp`, width: 900, height: 1200, altText: 'Original' },
  },
}));

test('the sales-ranked four retain exact variants, live prices/images and manually named size labels', () => {
  const source = cards().reverse();
  const selected = selectEmptyCartRecommendations(source);
  assert.deepEqual(Array.from(selected, row => row.variantId), Array.from(popularCartVariants.slice(0, 4), row => `gid://shopify/ProductVariant/${row.id}`));
  assert.deepEqual(Array.from(selected, row => row.size), ['Stor', 'Middels', 'Én størrelse', 'Større']);
  for (const row of selected) {
    const original = source.find(card => card.variant.id === row.variantId);
    assert.equal(row.price.amount, original.variant.price.amount);
    assert.equal(row.price.currencyCode, original.variant.price.currencyCode);
    assert.equal(row.image.url, original.variant.image.url);
    assert.doesNotMatch(row.title + row.size, /Shopify|Unisex|Havdyp|Fjell/);
  }
  assert.equal(emptyCartRecommendationsSchema.safeParse({ products: selected }).success, true);
});

test('unavailable, backorder, wrong-product and missing-image variants yield to the next actual ranked variant', () => {
  for (const patch of [
    { availableForSale: false }, { currentlyNotInStock: true }, { currentlyNotInStock: undefined },
    { image: null }, { price: { amount: '100', currencyCode: 'USD' } },
  ]) {
    const source = cards();
    Object.assign(source[0].variant, patch);
    const selected = selectEmptyCartRecommendations(source);
    assert.equal(selected.length, 4);
    assert.equal(selected[0].variantId, source[1].variant.id);
    assert.equal(selected[3].variantId, source[4].variant.id);
  }
  const source = cards(); source[0].product.handle = 'wrong-product';
  assert.equal(selectEmptyCartRecommendations(source)[0].variantId, source[1].variant.id);
  assert.equal(selectEmptyCartRecommendations([]).length, 0);
});

test('the response boundary rejects malformed product data and more than four rows', () => {
  const selected = selectEmptyCartRecommendations(cards());
  assert.equal(emptyCartRecommendationsSchema.safeParse({ products: [...selected, selected[0]] }).success, false);
  assert.equal(emptyCartRecommendationsSchema.safeParse({ products: [{ ...selected[0], image: { ...selected[0].image, width: 0 } }] }).success, false);
  assert.equal(emptyCartRecommendationsSchema.safeParse({ products: [{ ...selected[0], variantId: 'unverified-variant' }] }).success, false);
});

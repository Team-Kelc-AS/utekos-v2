/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const { productOverviewRows } = loadTypeScript('lib/catalog/overview.ts');
const image = name => ({ url: `https://example.test/${name}.webp`, altText: null, width: 1200, height: 1200 });
const id = number => `gid://shopify/ProductVariant/${number}`;

// Fictional IDs and prices, with the published size/color combinations. No API access.
function variant(number, size, color, availableForSale = true, sizeName = 'Størrelse') {
  return {
    id: id(number), title: `Untrusted display title ${number}`, availableForSale,
    price: { amount: `${number}.00`, currencyCode: 'NOK' }, compareAtPrice: null,
    image: image(`variant-${number}`),
    selectedOptions: [
      { name: sizeName, value: size },
      ...(color ? [{ name: 'Farge', value: color }] : []),
      { name: 'Kjønn', value: 'Unisex' },
    ],
  };
}
function product(handle, variants) {
  return {
    id: `gid://shopify/Product/${handle}`, handle, title: handle,
    description: '', descriptionHtml: '', seo: { title: null, description: null },
    options: [], images: { nodes: [image(handle)] }, variants: { nodes: variants },
  };
}
function catalogue() {
  // Product and variant order deliberately differ from the required visual order.
  return [
    product('utekos-dun', [variant(31, 'Medium', 'Vargnatt', false), variant(32, 'Large', 'Vargnatt', false), variant(33, 'Medium', 'Fjellblå', false), variant(34, 'Large', 'Fjellblå', false)]),
    product('utekos-mikrofiber', [variant(41, 'Medium', 'Vargnatt', false), variant(42, 'Large', 'Vargnatt', false), variant(43, 'Medium', 'Fjellblå'), variant(44, 'Large', 'Fjellblå')]),
    product('utekos-stapper', [variant(61, 'OneSize', 'Vargnatt')]),
    product('comfyrobe', [variant(51, 'XS', 'Fjellnatt'), variant(52, 'M', 'Fjellnatt', false), variant(53, 'XL', 'Fjellnatt')]),
    product('utekos-techdown', [variant(21, 'Liten', 'Havdyp', false), variant(22, 'Middels', 'Havdyp'), variant(23, 'Stor', 'Havdyp'), variant(24, 'Større', 'Havdyp')]),
    product('utekos-svale', [variant(11, 'Middels', undefined, true, 'Size'), variant(12, 'Stor', undefined, true, 'Size'), variant(13, 'Større', undefined, true, 'Size')]),
  ];
}
const flatten = rows => Array.from(rows).flatMap(row => Array.from(row.cards));
const row = (rows, rowId) => rows.find(item => item.id === rowId);

test('the original row order, exact variant assignments, labels and image files are preserved', () => {
  const rows = productOverviewRows(catalogue());
  assert.deepEqual(Array.from(rows, item => item.id), ['svale', 'techdown', 'color-Vargnatt', 'color-Fjellblå', 'comfyrobe', 'utekos-stapper']);
  const expected = [
    ['svale', 'Utekos Svale', [
      [11, 'Utekos Svale Middels', '/Svale_1.webp'],
      [12, 'Utekos Svale Stor', '/Svale_2.webp'],
      [13, 'Utekos Svale Større', '/Svale_3.webp'],
    ]],
    ['techdown', 'Utekos TechDown™', [
      [23, 'Utekos TechDown™ Stor', '/TechDown_2000x3000_2.webp'],
      [24, 'Utekos TechDown™ Større', '/TechDown_2000x3000_8.webp'],
      [22, 'Utekos TechDown™ Middels', '/TechDown_2000x3000_1.webp'],
      [21, 'Utekos TechDown™ Liten', '/TechDown-Liten.webp'],
    ]],
    ['color-Vargnatt', 'Utekos Dun™ og Mikrofiber™ – Vargnatt', [
      [31, 'Utekos Dun™ Vargnatt M', '/Soveposejakke_Black_1.webp'],
      [32, 'Utekos Dun™ Vargnatt L', '/Mikrfofiber_1000x1500_Back_Black.webp'],
      [41, 'Utekos Mikrofiber™ Vargnatt M', '/Soveposejakke_Black_3.webp'],
      [42, 'Utekos Mikrofiber™ Vargnatt L', '/Soveposejakke_Black_4.webp'],
    ]],
    ['color-Fjellblå', 'Utekos Dun™ og Mikrofiber™ – Fjellblå', [
      [33, 'Utekos Dun™ Fjellblå M', '/Mikro_1000x1500_Bakside.webp'],
      [34, 'Utekos Dun™ Fjellblå L', '/Mikro_1000x1500_Diagonal.webp'],
      [43, 'Utekos Mikrofiber™ Fjellblå M', '/Mikro_1000x1500_Front.webp'],
      [44, 'Utekos Mikrofiber™ Fjellblå L', '/Mikro_1000x1500_Diagonal.webp'],
    ]],
    ['comfyrobe', 'Comfyrobe™', [
      [51, 'Comfyrobe™ S/XS', '/Comfy_1000x1500_1.webp'],
      [52, 'Comfyrobe™ M/L', '/Comfy_1000x1500_Fly.webp'],
      [53, 'Comfyrobe™ L/XXL', '/Comfy_1000x1500_Open.webp'],
    ]],
    ['utekos-stapper', 'Utekos Stapper™', [[61, 'Utekos Stapper™', 'https://example.test/variant-61.webp']]],
  ];
  for (const [rowId, label, cards] of expected) {
    const actual = row(rows, rowId);
    assert.equal(actual.label, label);
    assert.deepEqual(Array.from(actual.cards, card => [card.variant.id, card.title, card.image.url]), cards.map(([number, title, url]) => [id(number), title, url]));
  }
});

test('all 19 variants retain their exact product, price and availability, including sold-out Liten', () => {
  const products = catalogue();
  const cards = flatten(productOverviewRows(products));
  assert.equal(cards.length, 19);
  assert.equal(new Set(cards.map(card => card.variant.id)).size, 19);
  for (const product of products) for (const variant of product.variants.nodes) {
    const card = cards.find(card => card.variant.id === variant.id);
    assert.equal(card.product, product);
    assert.equal(card.variant, variant);
  }
  const small = cards.find(card => card.variant.id === id(21));
  assert.equal(small.variant.availableForSale, false);
  assert.equal(small.color, 'Havdyp');
  assert.equal(small.title, 'Utekos TechDown™ Liten');
});

test('shuffled product and variant arrays do not alter curated ordering or mutate inputs', () => {
  const products = catalogue();
  const expected = JSON.stringify(productOverviewRows(products));
  const shuffled = products.slice().reverse().map(product => ({ ...product, variants: { nodes: product.variants.nodes.slice().reverse() } }));
  const before = JSON.stringify(shuffled);
  const projection = rows => Array.from(rows, row => ({ id: row.id, cards: Array.from(row.cards, card => [card.variant.id, card.title, card.image.url]) }));
  assert.deepEqual(projection(productOverviewRows(shuffled)), projection(JSON.parse(expected)));
  assert.equal(JSON.stringify(shuffled), before);
});

test('missing or ambiguous size/color combinations are omitted without selecting substitutes', () => {
  const products = catalogue();
  const svale = products.find(product => product.handle === 'utekos-svale');
  svale.variants.nodes = svale.variants.nodes.filter(variant => variant.id !== id(11));
  svale.variants.nodes.push(variant(99, 'Medium'));
  const techdown = products.find(product => product.handle === 'utekos-techdown');
  techdown.variants.nodes[0].selectedOptions.find(option => option.name === 'Farge').value = 'Other color';
  const dun = products.find(product => product.handle === 'utekos-dun');
  dun.variants.nodes.push(variant(98, 'Medium', 'Vargnatt'));
  const rows = productOverviewRows(products);
  assert.deepEqual(Array.from(row(rows, 'svale').cards, card => card.variant.id), [12, 13].map(id));
  assert.deepEqual(Array.from(row(rows, 'techdown').cards, card => card.variant.id), [23, 24, 22].map(id));
  assert.deepEqual(Array.from(row(rows, 'color-Vargnatt').cards, card => card.variant.id), [32, 41, 42].map(id));
  assert.equal(flatten(rows).some(card => [11, 21, 31, 98, 99].map(id).includes(card.variant.id)), false);
});

test('Comfyrobe labels map to Shopify XS, M and XL without inferring other sizes', () => {
  const products = catalogue();
  products.find(product => product.handle === 'comfyrobe').variants.nodes.push(variant(54, 'S', 'Fjellnatt'), variant(55, 'L', 'Fjellnatt'), variant(56, 'XXL', 'Fjellnatt'));
  assert.deepEqual(Array.from(row(productOverviewRows(products), 'comfyrobe').cards, card => [card.title, card.variant.selectedOptions[0].value, card.variant.id]), [
    ['Comfyrobe™ S/XS', 'XS', id(51)], ['Comfyrobe™ M/L', 'M', id(52)], ['Comfyrobe™ L/XXL', 'XL', id(53)],
  ]);
});

test('curated images keep original dimensions and accessories use their own media', () => {
  const products = catalogue();
  const cards = flatten(productOverviewRows(products));
  for (const [number, width, height] of [[31, 2000, 3000], [41, 2000, 3000], [42, 1333, 2000], [11, 1000, 1500]]) {
    const card = cards.find(card => card.variant.id === id(number));
    assert.equal(card.image.width, width);
    assert.equal(card.image.height, height);
  }
  const stapper = products.find(product => product.handle === 'utekos-stapper');
  assert.equal(row(productOverviewRows(products), 'utekos-stapper').cards[0].image, stapper.variants.nodes[0].image);
  stapper.variants.nodes[0].image = null;
  assert.equal(row(productOverviewRows(products), 'utekos-stapper').cards[0].image, stapper.images.nodes[0]);
  stapper.images.nodes = [];
  assert.equal(row(productOverviewRows(products), 'utekos-stapper'), undefined);
});

test('missing products and an empty catalogue do not create placeholder cards', () => {
  const products = catalogue().filter(product => product.handle !== 'utekos-techdown');
  assert.equal(row(productOverviewRows(products), 'techdown'), undefined);
  assert.equal(productOverviewRows([]).length, 0);
});

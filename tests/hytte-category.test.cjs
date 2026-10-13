/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');
const { prepareHytteProduct } = loadTypeScript('lib/catalog/hytteProducts.ts');
const { modelVariants, initialModelChoice, selectedModelVariant } = loadTypeScript('lib/catalog/modelPurchase.ts');
const { buildHytteJsonLd } = loadTypeScript('lib/seo/JSON-LD/buildHytteJsonLd.ts');
const { buildSiteJsonLd } = loadTypeScript('lib/seo/JSON-LD/buildSiteJsonLd.ts');
const { hytteContent } = loadTypeScript('lib/catalog/hytteContent.ts');
const { categories } = loadTypeScript('lib/catalog/categories.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const image = name => ({ url: `/${name}.webp`, width: 720, height: 900, altText: name });
const variant = (id, color, size, availableForSale, currentlyNotInStock) => ({
  id, image: image('unverified-combination'), price: { amount: '2990', currencyCode: 'NOK' },
  selectedOptions: [{ name: 'Farge', value: color }, { name: 'Størrelse', value: size }], availableForSale, currentlyNotInStock,
});

test('hytte retains its five models in order and omits products without variants', () => {
  assert.deepEqual(plain(categories.hytte.source.handles), ['utekos-techdown', 'utekos-mikrofiber', 'utekos-dun', 'comfyrobe', 'utekos-stapper']);
  assert.equal(prepareHytteProduct(null, {}), null);
  assert.equal(prepareHytteProduct({ variants: { nodes: [] } }, {}), null);
  const product = { handle: 'utekos-techdown', variants: { nodes: [variant('1', 'Havdyp', 'Middels', true, false)] } };
  assert.equal(prepareHytteProduct(product, {}), product);
});

test('Dun imagery follows color without changing IDs, money or fail-closed inventory', () => {
  const variants = [variant('1', 'Vargnatt', 'Small', false, false), variant('2', 'Fjellblå', 'Medium', true, false), variant('3', 'Ny farge', 'Large', true, undefined)];
  const product = { handle: 'utekos-dun', variants: { nodes: variants } };
  const mapped = prepareHytteProduct(product, { Fjellblå: image('fjellbla'), Vargnatt: image('vargnatt') });
  assert.equal(mapped.variants.nodes[0].id, '2');
  for (const original of variants) {
    const result = mapped.variants.nodes.find(v => v.id === original.id);
    assert.deepEqual(plain({ ...result, image: undefined }), plain({ ...original, image: undefined }));
  }
  assert.equal(mapped.variants.nodes.find(v => v.id === '1').image.url, '/vargnatt.webp');
  assert.equal(mapped.variants.nodes.find(v => v.id === '2').image.url, '/fjellbla.webp');
  assert.equal(mapped.variants.nodes.find(v => v.id === '3').image, null);
  assert.equal(variants[0].image.url, '/unverified-combination.webp', 'source product remains unchanged');
  const publicVariants = modelVariants(mapped);
  assert.equal(publicVariants.find(v => v.id === '3').available, false);
  assert.equal(selectedModelVariant(publicVariants, initialModelChoice(publicVariants)), undefined);
});

test('Mikrofiber variants use their verified Hytte images without changing purchase data', () => {
  const medium = variant('medium', 'Fjellblå', 'Medium', true, false);
  const large = variant('large', 'Fjellblå', 'Large', true, false);
  const product = { handle: 'utekos-mikrofiber', variants: { nodes: [medium, large] } };
  const mapped = prepareHytteProduct(product, {}, {
    Medium: image('bobil-medium'),
    Large: image('bobil-large'),
  });

  assert.equal(mapped.variants.nodes[0].id, medium.id);
  assert.equal(mapped.variants.nodes[0].image.url, '/bobil-medium.webp');
  assert.equal(mapped.variants.nodes[1].id, large.id);
  assert.equal(mapped.variants.nodes[1].image.url, '/bobil-large.webp');
  assert.equal(medium.image.url, '/unverified-combination.webp', 'source product remains unchanged');
  assert.equal(large.image.url, '/unverified-combination.webp', 'source product remains unchanged');
});

test('Stapper uses its verified final-card image without changing purchase data', () => {
  const oneSize = variant('stapper', 'Vargnatt', 'OneSize', true, false);
  const product = { handle: 'utekos-stapper', variants: { nodes: [oneSize] } };
  const mapped = prepareHytteProduct(product, {}, {}, image('stapper-hytte'));

  assert.equal(mapped.variants.nodes[0].id, oneSize.id);
  assert.equal(mapped.variants.nodes[0].price, oneSize.price);
  assert.equal(mapped.variants.nodes[0].availableForSale, true);
  assert.equal(mapped.variants.nodes[0].currentlyNotInStock, false);
  assert.equal(mapped.variants.nodes[0].image.url, '/stapper-hytte.webp');
  assert.equal(oneSize.image.url, '/unverified-combination.webp', 'source product remains unchanged');
});

test('category graph references only rendered products, canonical PDPs and existing site identities', () => {
  const products = [{ handle: 'utekos-techdown', title: 'TechDown' }, { handle: 'comfyrobe', title: 'Comfyrobe™' }];
  const graph = plain(buildHytteJsonLd(products, 1))['@graph'];
  const [page, list, breadcrumb, faq] = graph;
  const ids = new Set([...graph, ...plain(buildSiteJsonLd())['@graph']].map(node => node['@id']));
  assert.equal(page['@type'], 'CollectionPage');
  for (const field of ['mainEntity', 'breadcrumb', 'hasPart', 'publisher', 'isPartOf']) assert.ok(ids.has(page[field]['@id']));
  assert.equal(page.url, 'https://utekos.no/produkter/hytte');
  assert.equal(list.numberOfItems, products.length);
  assert.deepEqual(list.itemListElement.map(item => [item.position, item.url]), [[1, 'https://utekos.no/produkter/utekos-techdown'], [2, 'https://utekos.no/produkter/comfyrobe']]);
  assert.equal(breadcrumb.itemListElement.at(-1).item, page.url);
  assert.deepEqual(faq.mainEntity.map(item => [item.name, item.acceptedAnswer.text]), plain(hytteContent.faq.map(item => [item.question, item.answer])));
  assert.ok(!graph.some(node => ['Product', 'ProductGroup', 'Offer'].includes(node['@type'])));
});

test('empty lists invent no products, and pagination retains its own identity', () => {
  const [page, list, breadcrumb] = plain(buildHytteJsonLd([], 2))['@graph'];
  assert.equal(page.url, 'https://utekos.no/produkter/hytte?page=2');
  assert.equal(list.numberOfItems, 0);
  assert.deepEqual(list.itemListElement, []);
  assert.equal(breadcrumb.itemListElement.at(-1).item, page.url);
});

test('variant cards exclude sold-out, backorder and unknown stock including Dun', () => {
  const { hytteVariantCards } = loadTypeScript('lib/catalog/hytteProducts.ts');
  const nodes = [variant('in-stock', 'Havdyp', 'Middels', true, false), variant('sold-out', 'Havdyp', 'Liten', false, false), variant('backorder', 'Havdyp', 'Stor', true, true), variant('unknown', 'Havdyp', 'Større', true, undefined)];
  const product = { handle: 'utekos-techdown', variants: { nodes } };
  const cards = hytteVariantCards([product, { handle: 'utekos-dun', variants: { nodes: [nodes[1]] } }]);
  assert.deepEqual(plain(cards.map(card => card.variant.id)), ['in-stock']);
  assert.equal(cards[0].variant, nodes[0]);
  assert.equal(cards[0].product, product);
  assert.equal(nodes.length, 4);
});

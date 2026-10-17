/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');
const { productAvailability } = loadTypeScript('lib/products/availability.ts');
const { buildProductMetadata } = loadTypeScript('lib/seo/productMetadata.ts', { mocks: {
  '@/lib/products/gallery': { productGallery: (_product, variant) => ({ desktop: variant.image ? [variant.image] : [], mobile: [] }) },
} });

// Deliberately fictional catalog fixtures. No live price or merchant evidence.
const fixture = () => ({
  handle: 'test-product', title: 'Testprodukt', description: 'En beskrivelse av testproduktet.',
  seo: { title: 'Tittel fra Shopify', description: 'Beskrivelse fra Shopify' },
  variants: { nodes: [{ id: 'gid://shopify/ProductVariant/1', availableForSale: true,
    selectedOptions: [], image: { url: '/test.jpg', altText: 'Testprodukt forfra', width: 1200, height: 1600 } }] },
});

test('canonical, Open Graph and Twitter use the same product and primary image', () => {
  const data = buildProductMetadata(fixture());
  assert.equal(data.alternates.canonical, 'https://utekos.no/produkter/test-product');
  assert.equal(data.openGraph.url, data.alternates.canonical);
  assert.equal(data.title, 'Tittel fra Shopify');
  assert.equal(data.description, 'Beskrivelse fra Shopify');
  assert.equal(data.openGraph.type, 'website');
  assert.equal(data.openGraph.images[0].url, 'https://utekos.no/test.jpg');
  assert.equal(data.openGraph.images[0].alt, 'Testprodukt forfra');
  assert.equal(data.openGraph.images[0].width, 1200);
  assert.equal(data.twitter.card, 'summary_large_image');
  assert.equal(data.twitter.images[0].url, data.openGraph.images[0].url);
  assert.equal(data.robots, undefined);
});

test('blank SEO fields fall back to visible content, and missing images are not invented', () => {
  const product = fixture();
  product.seo = { title: '  ', description: null };
  product.variants.nodes[0].image = null;
  const data = buildProductMetadata(product);
  assert.equal(data.title, 'Testprodukt');
  assert.equal(data.description, product.description);
  assert.equal(data.openGraph.images, undefined);
  assert.equal(data.twitter.card, 'summary');
  assert.equal(data.twitter.images, undefined);
});

function colorFixture(handle) {
  const product = fixture();
  product.handle = handle;
  product.variants.nodes = ['Fjellblå', 'Vargnatt', 'Annen farge'].flatMap((color, index) =>
    ['Small', 'Large'].map((size, offset) => ({
      id: `gid://shopify/ProductVariant/${100 + index * 2 + offset}`, availableForSale: true,
      selectedOptions: [{ name: 'Farge', value: color }, { name: 'Størrelse', value: size }],
      image: { url: `/fixture-${index}.webp`, altText: `Testbilde ${color}`, width: 800, height: 1200 },
    })),
  );
  return product;
}

for (const [handle, color, ids, filename] of [
  ['utekos-mikrofiber', 'vargnatt', [102, 103], 'og-utekos-vargnatt.webp'],
  ['utekos-mikrofiber', 'fjellbla', [100, 101], 'og-utekos-fjellbla-blue-bg.webp'],
  ['utekos-dun', 'fjellbla', [100, 101], 'og-utekos-fjellbla-night-bg.webp'],
]) test(`${handle} ${color} shares one supplied image across sizes, IDs and tracking parameters`, () => {
  const product = colorFixture(handle);
  const canonical = `https://utekos.no/produkter/${handle}`;
  const queries = [
    { farge: color },
    ...['small', 'large'].map(storrelse => ({ farge: color, storrelse })),
    ...ids.flatMap(id => [{ variant: String(id) }, { variant: `gid://shopify/ProductVariant/${id}` }]),
    { farge: color, variant: String(ids[1]), storrelse: 'large', utm_source: 'test', fbclid: 'test-only' },
  ];
  for (const query of queries) {
    const data = buildProductMetadata(product, query);
    assert.equal(data.alternates.canonical, canonical);
    assert.equal(data.openGraph.url, `${canonical}?farge=${color}`);
    assert.equal(data.openGraph.images[0].url, `https://utekos.no/images/kunnskap/${filename}`);
    assert.equal(data.openGraph.images[0].width, 1200);
    assert.equal(data.openGraph.images[0].height, 630);
    assert.equal(data.openGraph.images[0].type, 'image/webp');
    assert.ok(data.openGraph.images[0].alt.includes(color === 'vargnatt' ? 'Vargnatt' : 'Fjellblå'));
    assert.equal(data.twitter.images[0].url, data.openGraph.images[0].url);
    assert.equal(data.twitter.images[0].alt, data.openGraph.images[0].alt);
  }
  product.variants.nodes.forEach(variant => { variant.availableForSale = false; });
  assert.equal(buildProductMetadata(product, { farge: color }).openGraph.url, `${canonical}?farge=${color}`);
});

test('general, size-only and unmapped selections preserve family metadata as stock changes', () => {
  for (const handle of ['utekos-mikrofiber', 'utekos-dun', 'comfyrobe', 'utekos-techdown', 'utekos-stapper']) {
    const product = colorFixture(handle);
    for (const params of [{}, { utm_source: 'test' }, { storrelse: 'large' }, { farge: 'annen-farge' }, { variant: '104' }]) {
      const data = buildProductMetadata(product, params);
      assert.equal(data.openGraph.url, data.alternates.canonical);
      assert.equal(data.openGraph.images[0].url, 'https://utekos.no/fixture-0.webp');
    }
    product.variants.nodes[0].availableForSale = false;
    product.variants.nodes[1].availableForSale = false;
    assert.equal(buildProductMetadata(product).openGraph.images[0].url, 'https://utekos.no/fixture-1.webp');
    if (handle !== 'utekos-mikrofiber') {
      const data = buildProductMetadata(product, { farge: 'vargnatt' });
      assert.equal(data.openGraph.url, data.alternates.canonical);
      assert.equal(data.openGraph.images[0].url, 'https://utekos.no/fixture-1.webp');
    }
  }
});

test('invalid or contradictory selectors cannot acquire a supplied color image', () => {
  const product = colorFixture('utekos-mikrofiber');
  for (const params of [
    { farge: ['vargnatt', 'fjellbla'] }, { farge: 'missing' }, { variant: '999' },
    { farge: 'vargnatt', variant: '100' }, { farge: 'vargnatt', storrelse: 'missing' },
  ]) {
    const data = buildProductMetadata(product, params);
    assert.equal(data.openGraph.url, data.alternates.canonical);
    assert.equal(data.openGraph.images[0].url, 'https://utekos.no/fixture-0.webp');
  }
});

test('supplied image files match declared type and native dimensions', async () => {
  const path = require('node:path');
  const fs = require('node:fs');
  const { createRequire } = require('node:module');
  const sharp = createRequire(require.resolve('next/package.json'))('sharp');
  const { productSocialImages } = loadTypeScript('lib/seo/productSocialImages.ts');
  for (const colors of Object.values(productSocialImages)) for (const image of Object.values(colors)) {
    const file = path.resolve(__dirname, '../public', image.url.slice(1));
    const actual = await sharp(file).metadata();
    assert.equal(actual.width, image.width);
    assert.equal(actual.height, image.height);
    assert.equal(`image/${actual.format}`, image.type);
    assert.ok(fs.statSync(file).size < 5 * 1024 * 1024);
  }
});

test('backorders never use the in-stock label and unavailable overrides backorder', () => {
  assert.equal(productAvailability({ availableForSale: true, currentlyNotInStock: false }).label, 'På lager');
  const backorder = productAvailability({ availableForSale: true, currentlyNotInStock: true });
  assert.equal(backorder.schema, 'https://schema.org/BackOrder');
  assert.equal(backorder.label, 'Kan bestilles – ikke på lager');
  assert.equal(productAvailability({ availableForSale: false, currentlyNotInStock: true }).schema, 'https://schema.org/OutOfStock');
});

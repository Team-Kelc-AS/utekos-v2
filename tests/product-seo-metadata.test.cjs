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

test('backorders never use the in-stock label and unavailable overrides backorder', () => {
  assert.equal(productAvailability({ availableForSale: true, currentlyNotInStock: false }).label, 'På lager');
  const backorder = productAvailability({ availableForSale: true, currentlyNotInStock: true });
  assert.equal(backorder.schema, 'https://schema.org/BackOrder');
  assert.equal(backorder.label, 'Kan bestilles – ikke på lager');
  assert.equal(productAvailability({ availableForSale: false, currentlyNotInStock: true }).schema, 'https://schema.org/OutOfStock');
});

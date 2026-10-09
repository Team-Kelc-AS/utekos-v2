/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');
const { buildProductJsonLd, buildProductPageJsonLd, serializeProductJsonLd } = loadTypeScript('lib/seo/JSON-LD/buildProductJsonLd.ts', {
  mocks: {
    '@/lib/products/gallery': {
      productGallery: (_product, variant) => ({
        desktop: [{ url: variant.image.url }],
        mobile: [{ url: variant.image.url }, { url: '/images/mobile.webp' }],
      }),
    },
  },
});
const plain = value => JSON.parse(JSON.stringify(value));
function variant(overrides = {}) {
  return {
    id: 'gid://shopify/ProductVariant/46944403849464', sku: 'CURRENT-SKU', barcode: '07090062980009',
    availableForSale: true, currentlyNotInStock: false,
    price: { amount: '899.00', currencyCode: 'NOK' }, compareAtPrice: { amount: '1990.00', currencyCode: 'NOK' },
    image: { url: 'https://cdn.shopify.com/current.webp' },
    selectedOptions: [{ name: 'Farge', value: 'Havdyp' }, { name: 'Størrelse', value: 'Liten' }, { name: 'Kjønn', value: 'Unisex' }],
    ...overrides,
  };
}
function product(variants = [variant(), variant({ id: 'gid://shopify/ProductVariant/999', selectedOptions: [{ name: 'Farge', value: 'Fjellblå' }, { name: 'Størrelse', value: 'Stor' }] })]) {
  return { id: 'gid://shopify/Product/123', handle: 'utekos-techdown', title: 'Utekos TechDown', vendor: 'Utekos', description: 'Synlig beskrivelse', variants: { nodes: variants } };
}

test('uses current variants, prices, availability and direct variant URLs instead of snapshots', () => {
  const result = plain(buildProductJsonLd(product(), null));
  assert.equal(result['@type'], 'ProductGroup');
  assert.equal(result.hasVariant.length, 2);
  assert.deepEqual(result.variesBy, ['https://schema.org/color', 'https://schema.org/size']);
  const first = result.hasVariant[0];
  assert.equal(first.name, 'Utekos TechDown™ Havdyp, Liten');
  assert.equal(first.url, 'https://utekos.no/produkter/utekos-techdown?variant=46944403849464');
  assert.equal(first.isVariantOf['@id'], result['@id']);
  assert.equal(first.offers.price, '899.00');
  assert.equal(first.offers.priceSpecification.price, '1990.00');
  assert.equal(first.offers.shippingDetails.shippingRate.value, 99);
  assert.equal(first.offers.hasMerchantReturnPolicy.returnFees, 'https://schema.org/ReturnFeesCustomerResponsibility');
  assert.equal(first.gtin14, '07090062980009');
  assert.equal(first.sku, 'CURRENT-SKU');
  assert.match(first.colorSwatch, /^https:\/\/.*\.png$/);
  assert.deepEqual(first.image, ['https://cdn.shopify.com/current.webp', 'https://utekos.no/images/mobile.webp']);
  assert.equal(result.aggregateRating, undefined);
  assert.equal(result.review, undefined);
  assert.equal(result.manufacturer, undefined);
});

test('single product, shipping threshold, backorders and unavailable stock remain accurate', () => {
  const result = buildProductJsonLd(product([variant({ price: { amount: '999', currencyCode: 'NOK' }, currentlyNotInStock: true })]), null);
  assert.equal(result['@type'], 'Product');
  assert.equal(result.hasVariant, undefined);
  assert.equal(result.offers.shippingDetails.shippingRate.value, 0);
  assert.equal(result.offers.availability, 'https://schema.org/BackOrder');
  const unavailable = buildProductJsonLd(product([variant({ availableForSale: false, currentlyNotInStock: true })]), null);
  assert.equal(unavailable.offers.availability, 'https://schema.org/OutOfStock');
  assert.equal(buildProductJsonLd(product([]), null), null);
});

test('invalid barcodes and incompatible before prices are omitted', () => {
  for (const barcode of [null, '123', '07090062980008', 'not-a-barcode']) {
    const result = buildProductJsonLd(product([variant({ barcode, compareAtPrice: { amount: '2999', currencyCode: 'EUR' } })]), null);
    assert.equal(Object.keys(result).some(key => /^gtin/.test(key)), false);
    assert.equal(result.offers.priceSpecification, undefined);
  }
});

test('only current public reviews are emitted and script termination is escaped', () => {
  const reviews = { count: 1, average: 4, reviews: [{ id: '42', author: 'Kunde', rating: 4, title: 'Bra', body: '</script><script>alert(1)</script>', date: '2026-10-08', verified: true }] };
  const data = buildProductJsonLd(product(), reviews);
  assert.equal(data.aggregateRating.reviewCount, 1);
  assert.equal(data.review.length, 1);
  assert.equal(data.review[0].reviewRating.ratingValue, 4);
  assert.equal(data.hasVariant[0].aggregateRating, undefined);
  const json = serializeProductJsonLd(data);
  assert.equal(json.includes('<'), false);
  assert.equal(JSON.parse(json).review[0].reviewBody, reviews.reviews[0].body);
  assert.equal(buildProductJsonLd(product(), { count: 0, average: 0, reviews: [] }).aggregateRating, undefined);
});

test('new variants of current products keep the applicable shipping and return policy', () => {
  for (const [amount, expected] of [['998.99', 99], ['999.00', 0], ['999.01', 0]]) {
    const result = buildProductJsonLd(product([variant({ id: 'gid://shopify/ProductVariant/999', price: { amount, currencyCode: 'NOK' } })]), null);
    assert.equal(result.offers.shippingDetails.shippingRate.value, expected);
    assert.equal(result.offers.hasMerchantReturnPolicy.merchantReturnDays, 14);
    assert.equal(result.offers.shippingDetails.deliveryTime.handlingTime, undefined);
  }
  const foreign = buildProductJsonLd(product([variant({ price: { amount: '100', currencyCode: 'EUR' } })]), null);
  assert.equal(foreign.offers.shippingDetails, undefined);
  assert.equal(foreign.offers.hasMerchantReturnPolicy, undefined);
  const unknown = buildProductJsonLd({ ...product([variant()]), handle: 'unreviewed-product' }, null);
  assert.equal(unknown.offers.shippingDetails, undefined);
});

test('malformed prices are not converted into apparently valid offers', () => {
  for (const amount of ['', ' ', '-1', '1e3', '0x10', 'Infinity', '1,99']) {
    assert.equal(buildProductJsonLd(product([variant({ price: { amount, currencyCode: 'NOK' } })]), null).offers, undefined);
  }
  const invalidCompare = buildProductJsonLd(product([variant({ compareAtPrice: { amount: 'Infinity', currencyCode: 'NOK' } })]), null);
  assert.equal(invalidCompare.offers.priceSpecification, undefined);
});

test('page graph preserves product identity and marks up the visible breadcrumb trail', () => {
  const graph = plain(buildProductPageJsonLd(product(), null));
  assert.equal(graph['@graph'].length, 2);
  assert.equal(graph['@graph'][0]['@id'], buildProductJsonLd(product(), null)['@id']);
  assert.equal(graph['@graph'][0]['@context'], undefined);
  assert.deepEqual(graph['@graph'][1].itemListElement, [
    { '@type': 'ListItem', position: 1, name: 'Forsiden', item: 'https://utekos.no/' },
    { '@type': 'ListItem', position: 2, name: 'Produkter', item: 'https://utekos.no/produkter' },
    { '@type': 'ListItem', position: 3, name: 'Utekos TechDown™' },
  ]);
  assert.deepEqual(JSON.parse(serializeProductJsonLd(graph)), graph);
  assert.equal(buildProductPageJsonLd(product([]), null), null);
});

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadTypeScript } = require('./load-typescript.cjs');

const { getProductSitemapVideos, homeSitemapVideos, homeVideos } = loadTypeScript('lib/seo/videoMedia.ts');
const { productVariantVideo } = loadTypeScript('lib/products/variantVideos.ts');
const variant = (size, availableForSale = true) => ({
  id: `gid://shopify/ProductVariant/${size.length}`, availableForSale,
  selectedOptions: [{ name: 'Størrelse', value: size }],
});

test('product sitemap only describes the video on the canonical page default variant', () => {
  const medium = variant('Middels');
  const large = variant('Stor');
  const product = { handle: 'utekos-svale', variants: { nodes: [medium, large] } };
  const entries = getProductSitemapVideos(product);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].content_loc, productVariantVideo(product.handle, large).src);
  assert.notEqual(entries[0].content_loc, productVariantVideo(product.handle, medium).src);
  large.availableForSale = false;
  assert.equal(getProductSitemapVideos(product)[0].content_loc, productVariantVideo(product.handle, medium).src);
});

test('products and default variants without a film do not advertise another variant film', () => {
  assert.equal(getProductSitemapVideos({ handle: 'utekos-techdown', variants: { nodes: [variant('Liten')] } }).length, 0);
  assert.equal(getProductSitemapVideos({ handle: 'unknown-product', variants: { nodes: [variant('Stor')] } }).length, 0);
  assert.equal(getProductSitemapVideos({ handle: 'utekos-svale', variants: { nodes: [] } }).length, 0);
});

test('sitemap and player share existing local posters without invented dates', () => {
  const sources = [...Object.values(homeVideos)];
  for (const handle of ['utekos-svale', 'utekos-techdown']) {
    for (const size of ['Middels', 'Stor', 'Større']) sources.push(productVariantVideo(handle, variant(size)));
  }
  for (const source of sources) {
    assert.ok(fs.statSync(path.join(__dirname, '../public', source.poster)).size > 0);
    assert.match(source.src, /^https:\/\/cdn\.shopify\.com\/videos\/c\/o\/v\/[a-f0-9]+\.mp4$/);
    assert.ok(source.title && source.description);
  }
  for (const [index, video] of Object.values(homeVideos).entries()) {
    assert.equal(homeSitemapVideos[index].content_loc, video.src);
    assert.equal(homeSitemapVideos[index].thumbnail_loc, `https://utekos.no${video.poster}`);
    assert.equal(homeSitemapVideos[index].publication_date, undefined);
  }
});

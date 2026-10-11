/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');

const image = (id, width, height) => ({ id, url: `/${id}.webp`, altText: id, width, height });
const portrait = image('portrait', 1000, 1500);
const otherFormats = [image('square', 1000, 1000), image('tall', 887, 1774), image('desktop', 1440, 1800)];
const desktop = [otherFormats[2]];
const { productGallery } = loadTypeScript('lib/products/gallery.ts', {
  mocks: {
    './gallery/productGalleryImageOverrides': { PRODUCT_GALLERY_IMAGE_OVERRIDES: { comfyrobe: desktop, 'utekos-dun': desktop, 'utekos-stapper': [otherFormats[0]] } },
    './gallery/comfyrobeProductGalleryImages': { COMFYROBE_MOBILE_GALLERY_IMAGES: [portrait, ...otherFormats] },
    './gallery/techdown/productGalleryImages': { TECHDOWN_MOBILE_GALLERY_IMAGES: [] },
    './gallery/mikrofiber/mikrofiberProductGalleryImages': { MICROFIBER_MOBILE_GALLERY_IMAGES: [] },
    './gallery/svale/svaleProductGalleryImages': { SVALE_MOBILE_GALLERY_IMAGES: [] },
  },
});
const product = (handle, images = []) => ({ handle, images: { nodes: images } });
const variant = (color = 'Fjellblå', image = null) => ({ selectedOptions: [{ name: 'Farge', value: color }], image });

test('mobile galleries keep only original 2:3 images and preserve desktop images', () => {
  const gallery = productGallery(product('comfyrobe'), variant());
  assert.deepEqual(Array.from(gallery.mobile), [portrait]);
  assert.equal(gallery.desktop, desktop);
});

test('Dun and Stapper remain empty on mobile when no 2:3 originals exist', () => {
  for (const handle of ['utekos-dun', 'utekos-stapper']) {
    const gallery = productGallery(product(handle), variant());
    assert.equal(gallery.mobile.length, 0);
    assert.ok(gallery.desktop.length > 0);
  }
});

test('variant-specific galleries preserve the exact color image only when it is 2:3', () => {
  for (const handle of ['utekos-dun', 'utekos-mikrofiber']) {
    assert.deepEqual(Array.from(productGallery(product(handle), variant('Vargnatt', portrait)).mobile), [portrait]);
    const gallery = productGallery(product(handle), variant('Vargnatt', otherFormats[0]));
    assert.equal(gallery.mobile.length, 0);
    assert.deepEqual(Array.from(gallery.desktop), [otherFormats[0]]);
  }
});

test('Shopify fallback keeps only known positive finite 2:3 dimensions', () => {
  const images = [portrait, image('large', 2000, 3000), ...otherFormats, image('zero', 0, 0), image('unknown', null, null), image('infinite', Infinity, Infinity)];
  const gallery = productGallery(product('another-product', images), variant());
  assert.deepEqual(Array.from(gallery.mobile), images.slice(0, 2));
  assert.equal(gallery.desktop, images);
});

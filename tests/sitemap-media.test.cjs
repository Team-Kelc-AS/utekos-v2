/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { load } = require('cheerio');
const { resolveSitemap } = require('next/dist/build/webpack/loaders/metadata/resolve-route-data');
const { loadTypeScript } = require('./load-typescript.cjs');

const { DUN_PRODUCT_GALLERY_IMAGES } = loadTypeScript('lib/products/gallery/dun/dunProductGalleryImages.ts');
const { TECHDOWN_PRODUCT_GALLERY_IMAGES } = loadTypeScript('lib/products/gallery/techdown/productGalleryImages.ts');
const { sitemapImages, productSitemapImages, editorialSitemapImages } = loadTypeScript('lib/seo/sitemapImages.ts', {
  // Only unrelated galleries contain static image imports that need Next's loader.
  mocks: {
    './gallery/productGalleryImageOverrides': { PRODUCT_GALLERY_IMAGE_OVERRIDES: {
      'utekos-dun': DUN_PRODUCT_GALLERY_IMAGES,
      'utekos-techdown': TECHDOWN_PRODUCT_GALLERY_IMAGES,
    } },
    './gallery/comfyrobeProductGalleryImages': { COMFYROBE_MOBILE_GALLERY_IMAGES: [] },
    './gallery/mikrofiber/mikrofiberProductGalleryImages': { MICROFIBER_MOBILE_GALLERY_IMAGES: [] },
  },
});
const { encodeSitemapEntry } = loadTypeScript('lib/seo/sitemapXml.ts');

test('product sitemap includes responsive galleries and exact color-specific images', () => {
  const variants = [{ selectedOptions: [{ name: 'Farge', value: 'Fjellblå' }] }, {
    selectedOptions: [{ name: 'Farge', value: 'Vargnatt' }],
    image: { url: 'https://cdn.shopify.com/verified-vargnatt.jpg' },
  }];
  const dunImages = productSitemapImages({ handle: 'utekos-dun', variants: { nodes: variants }, images: { nodes: [{ url: '/unused.jpg' }] } });
  assert.ok(dunImages.includes('https://cdn.shopify.com/verified-vargnatt.jpg'));
  assert.ok(dunImages.some((url) => url.includes('Utekos-Dun-Fjellbl_')));
  assert.ok(!dunImages.includes('https://utekos.no/unused.jpg'));

  const techdownImages = productSitemapImages({ handle: 'utekos-techdown', variants: { nodes: variants }, images: { nodes: [] } });
  assert.ok(techdownImages.includes('https://utekos.no/TechDown_1_1000x1500.webp'));
  assert.ok(techdownImages.includes('https://utekos.no/images/UtekosTechDown_1440x1800_2.webp'));
  assert.equal(new Set(techdownImages).size, techdownImages.length);
});

test('image URLs are absolute, deduplicated after normalization and limited to 1,000', () => {
  assert.deepEqual(Array.from(sitemapImages(['/samme bilde.jpg', 'https://utekos.no/samme%20bilde.jpg'])), ['https://utekos.no/samme%20bilde.jpg']);
  assert.equal(sitemapImages(Array.from({ length: 1001 }, (_, i) => `/image-${i}.jpg`)).length, 1000);
});

test('curated editorial image sources exist without transforming their originals', () => {
  for (const [page, images] of Object.entries(editorialSitemapImages)) {
    for (const image of images) {
      assert.ok(fs.existsSync(path.join(__dirname, '../public', image)), `${page}: missing ${image}`);
    }
  }
});

test('current Next serializer produces XML that preserves media URLs and video text', () => {
  const image = 'https://cdn.shopify.com/image.jpg?v=1&width=1200';
  const content = 'https://cdn.shopify.com/video.mp4?v=1&quality=high';
  const title = 'Størrelser & passform <Utekos>';
  const description = 'Svale "Stor" og TechDown™';
  const xml = resolveSitemap([encodeSitemapEntry({
    url: 'https://utekos.no/produkter/utekos-svale',
    images: [image],
    videos: [{ title, description, thumbnail_loc: image, content_loc: content }],
  })]);
  const $ = load(xml, { xml: true });
  assert.equal($('image\\:loc').text(), image);
  assert.equal($('video\\:content_loc').text(), content);
  assert.equal($('video\\:title').text(), title);
  assert.equal($('video\\:description').text(), description);
  assert.match(xml, /&amp;width/);
  assert.doesNotMatch(xml, /&amp;amp;/);
});

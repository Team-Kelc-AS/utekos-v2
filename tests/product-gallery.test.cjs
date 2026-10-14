/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');

const image = (id, width, height) => ({ id, url: `/${id}.webp`, altText: id, width, height });
const portrait = image('portrait', 1000, 1500);
const otherFormats = [image('square', 1000, 1000), image('tall', 887, 1774), image('desktop', 1440, 1800)];
const desktop = [otherFormats[2]];
const warnings = [];
const { productGallery } = loadTypeScript('lib/products/gallery.ts', {
  globals: { console: { warn: message => warnings.push(message) } },
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

test('galleries accept only 2:3 originals on mobile and 4:5 originals on desktop', () => {
  const gallery = productGallery(product('comfyrobe'), variant());
  assert.deepEqual(Array.from(gallery.mobile), [portrait]);
  assert.deepEqual(Array.from(gallery.desktop), desktop);
});

test('galleries remain empty when no original matches the viewport ratio', () => {
  const dun = productGallery(product('utekos-dun'), variant());
  assert.equal(dun.mobile.length, 0);
  assert.deepEqual(Array.from(dun.desktop), desktop);
  const stapper = productGallery(product('utekos-stapper'), variant());
  assert.equal(stapper.mobile.length, 0);
  assert.equal(stapper.desktop.length, 0);
});

test('Dun variant-specific galleries preserve the exact color only at the required original ratio', () => {
  for (const handle of ['utekos-dun']) {
    const mobile = productGallery(product(handle), variant('Vargnatt', portrait));
    assert.deepEqual(Array.from(mobile.mobile), [portrait]);
    assert.equal(mobile.desktop.length, 0);
    const large = productGallery(product(handle), variant('Vargnatt', desktop[0]));
    assert.deepEqual(Array.from(large.desktop), desktop);
    assert.equal(large.mobile.length, 0);
    const gallery = productGallery(product(handle), variant('Vargnatt', otherFormats[0]));
    assert.equal(gallery.mobile.length, 0);
    assert.equal(gallery.desktop.length, 0);
  }
});

test('Shopify fallback rejects unknown dimensions and accepts small ratio deviations', () => {
  const images = [portrait, image('large', 2000, 3000), ...otherFormats, image('zero', 0, 0), image('unknown', null, null), image('infinite', Infinity, Infinity)];
  const nearDesktop = image('near-4-5', 1122, 1402);
  const nearMobile = image('near-2-3', 340, 513);
  images.push(nearDesktop, nearMobile);
  const gallery = productGallery(product('another-product', images), variant());
  assert.deepEqual(Array.from(gallery.mobile), [...images.slice(0, 2), nearMobile]);
  assert.deepEqual(Array.from(gallery.desktop), [...desktop, nearDesktop]);
});

test('both viewports include exactly ±1.5% ratio deviation and reject values just outside it', () => {
  for (const [viewport, width, height] of [['mobile', 2000, 3000], ['desktop', 4000, 5000]]) {
    const margin = width * 0.015;
    const accepted = [image('lower-bound', width - margin, height), image('upper-bound', width + margin, height)];
    const rejected = [image('below-bound', width - margin - 1, height), image('above-bound', width + margin + 1, height)];
    const gallery = productGallery(product(`tolerance-${viewport}`, [...accepted, ...rejected]), variant());
    assert.deepEqual(Array.from(gallery[viewport]), accepted);
    for (let index = 0; index < accepted.length; index++) {
      assert.equal(gallery[viewport][index], accepted[index]);
    }
  }
});

test('format errors name the rejected source, its dimensions and required ratio without repeated warnings', () => {
  const bad = image('submitted-morgenro', 941, 1672);
  const before = warnings.length;
  productGallery(product('submitted-image', [bad]), variant());
  const messages = warnings.slice(before);
  assert.equal(messages.length, 2);
  assert.ok(messages.every(message => message.includes('/submitted-morgenro.webp (941 × 1672)')));
  assert.ok(messages.every(message => message.includes('±1,5 %')));
  assert.ok(messages.some(message => message.includes('desktop') && message.includes('4:5')));
  assert.ok(messages.some(message => message.includes('mobile') && message.includes('2:3')));
  productGallery(product('submitted-image', [bad]), variant());
  assert.equal(warnings.length, before + 2);
});

const mikrofiberImages = loadTypeScript('lib/products/gallery/mikrofiber/mikrofiberProductGalleryImages.ts', {
  mocks: Object.fromEntries([16].map(number => [
    `@/assets/products/mikrofiber/${number}.webp`, { default: `/static/mikrofiber/${number}.webp` },
  ])),
});
const mikrofiberGallery = loadTypeScript('lib/products/gallery.ts', {
  globals: { console: { warn() {} } },
  mocks: {
    './gallery/productGalleryImageOverrides': { PRODUCT_GALLERY_IMAGE_OVERRIDES: { 'utekos-mikrofiber': mikrofiberImages.MICROFIBER_PRODUCT_GALLERY_IMAGES } },
    './gallery/comfyrobeProductGalleryImages': { COMFYROBE_MOBILE_GALLERY_IMAGES: [] },
    './gallery/techdown/productGalleryImages': { TECHDOWN_MOBILE_GALLERY_IMAGES: [] },
    './gallery/mikrofiber/mikrofiberProductGalleryImages': mikrofiberImages,
    './gallery/svale/svaleProductGalleryImages': { SVALE_MOBILE_GALLERY_IMAGES: [] },
  },
});
const requestedMobileImage = '/images/kunnskap/mikrofiber_fjellbla_1000x1500_3.webp';
const requestedSecondImage = '/images/kunnskap/morgenro_340x513.jpg';
const rejectedImage = '/images/kunnskap/morgenro_ved_fjorden.webp';
const vargnattImages = ['mikrofiber_vargnatt_45_jarle_2.webp', 'mikrofiber_vargnatt_45_2.webp', 'mikrofiber_vargnatt_45_3.webp', 'mikrofiber_vargnatt_45_4.webp'].map(file => `/images/kunnskap/${file}`);

test('Fjellblå M and L use exact native ratios and keep the valid new mobile image third', () => {
  for (const size of ['Medium', 'Large']) {
    const selected = variant('Fjellblå');
    selected.selectedOptions.push({ name: 'Størrelse', value: size });
    const gallery = mikrofiberGallery.productGallery(product('utekos-mikrofiber'), selected);
    assert.equal(gallery.mobile[1].url, requestedSecondImage);
    assert.equal(gallery.mobile[1].width, 340);
    assert.equal(gallery.mobile[1].height, 510);
    assert.equal(gallery.mobile[2].url, requestedMobileImage);
    assert.equal(gallery.desktop.length, 1);
    assert.equal(gallery.mobile.length, 8);
    assert.ok(gallery.desktop.every(image => image.width * 5 === image.height * 4));
    assert.ok(gallery.mobile.every(image => image.width * 3 === image.height * 2));
    assert.ok([...gallery.desktop, ...gallery.mobile].every(image => image.url !== rejectedImage));
    const darkVariant = variant('Vargnatt', portrait);
    darkVariant.selectedOptions.push({ name: 'Størrelse', value: size });
    const dark = mikrofiberGallery.productGallery(product('utekos-mikrofiber'), darkVariant);
    assert.deepEqual(Array.from(dark.desktop, image => image.url), vargnattImages);
    assert.ok(dark.desktop.every(image => image.width === 603 && image.height === 754));
    assert.deepEqual(Array.from(dark.mobile), [portrait]);
  }
});

test('Mikrofiber JSON-LD uses the same Fjellblå gallery and one shared review aggregate across colors and sizes', () => {
  const { buildProductJsonLd } = loadTypeScript('lib/seo/JSON-LD/buildProductJsonLd.ts', {
    mocks: { '@/lib/products/gallery': mikrofiberGallery },
  });
  const variants = ['Fjellblå', 'Vargnatt'].flatMap((color, colorIndex) => ['Medium', 'Large'].map((size, sizeIndex) => ({
    ...variant(color, portrait),
    id: `gid://shopify/ProductVariant/${colorIndex * 2 + sizeIndex + 1}`,
    selectedOptions: [{ name: 'Farge', value: color }, { name: 'Størrelse', value: size }],
    availableForSale: true, currentlyNotInStock: false, barcode: null,
    price: { amount: '1290.00', currencyCode: 'NOK' }, compareAtPrice: null,
  })));
  const reviews = { count: 2, average: 4.5, reviews: [4, 5].map((rating, index) => ({
    id: String(index), author: 'Testkunde', rating, title: '', body: 'Testomtale', date: null, verified: true,
  })) };
  const result = buildProductJsonLd({
    ...product('utekos-mikrofiber'), id: 'gid://shopify/Product/7710040752376',
    title: 'Utekos Mikrofiber', vendor: 'Utekos', variants: { nodes: variants },
  }, reviews);
  assert.equal(result['@type'], 'ProductGroup');
  assert.equal(result.aggregateRating.reviewCount, 2);
  assert.equal(result.aggregateRating.ratingValue, 4.5);
  assert.equal(result.review.length, 2);
  for (const item of result.hasVariant) {
    assert.equal(item.aggregateRating, undefined);
    assert.equal(item.review, undefined);
    assert.equal(item.isVariantOf['@id'], result['@id']);
    if (item.color === 'Fjellblå') {
      assert.ok(item.image.includes(`https://utekos.no${requestedSecondImage}`));
      assert.ok(item.image.includes(`https://utekos.no${requestedMobileImage}`));
      assert.ok(!item.image.includes(`https://utekos.no${rejectedImage}`));
      const gallery = mikrofiberGallery.productGallery(product('utekos-mikrofiber'), variant());
      assert.deepEqual(Array.from(item.image), [...gallery.desktop, ...gallery.mobile].map(image => new URL(image.url, 'https://utekos.no').href));
      assert.equal(new Set(item.image).size, item.image.length);
    } else {
      assert.deepEqual(Array.from(item.image), [...vargnattImages, '/portrait.webp'].map(url => `https://utekos.no${url}`));
    }
  }
});

test('requested Dun Fjellblå desktop originals retain dimensions and stay out of mobile and Vargnatt galleries', () => {
  const { DUN_PRODUCT_GALLERY_IMAGES: originals } = loadTypeScript('lib/products/gallery/dun/dunProductGalleryImages.ts');
  const { productGallery: getGallery } = loadTypeScript('lib/products/gallery.ts', {
    globals: { console: { warn() {} } },
    mocks: {
      './gallery/productGalleryImageOverrides': { PRODUCT_GALLERY_IMAGE_OVERRIDES: { 'utekos-dun': originals } },
      './gallery/comfyrobeProductGalleryImages': { COMFYROBE_MOBILE_GALLERY_IMAGES: [] },
      './gallery/techdown/productGalleryImages': { TECHDOWN_MOBILE_GALLERY_IMAGES: [] },
      './gallery/mikrofiber/mikrofiberProductGalleryImages': { MICROFIBER_MOBILE_GALLERY_IMAGES: [] },
      './gallery/svale/svaleProductGalleryImages': { SVALE_MOBILE_GALLERY_IMAGES: [] },
    },
  });
  const gallery = getGallery(product('utekos-dun'), variant('Fjellblå'));
  assert.equal(gallery.desktop.length, 9);
  assert.equal(gallery.mobile.length, 0);
  assert.deepEqual(Array.from(gallery.desktop.slice(-3), image => [image.width, image.height]), [[1440, 1800], [1440, 1800], [1237, 1718]]);
  const dark = getGallery(product('utekos-dun'), variant('Vargnatt', desktop[0]));
  assert.deepEqual(Array.from(dark.desktop), desktop);
  assert.equal(dark.mobile.length, 0);
});

test('Comfyrobe hood portrait appears on desktop at its native ratio while mobile keeps six images', () => {
  const comfy = loadTypeScript('lib/products/gallery/comfyrobeProductGalleryImages.ts');
  const { productGallery: getGallery } = loadTypeScript('lib/products/gallery.ts', {
    globals: { console: { warn() {} } },
    mocks: {
      './gallery/productGalleryImageOverrides': { PRODUCT_GALLERY_IMAGE_OVERRIDES: { comfyrobe: comfy.COMFYROBE_PRODUCT_GALLERY_IMAGES } },
      './gallery/comfyrobeProductGalleryImages': comfy,
      './gallery/techdown/productGalleryImages': { TECHDOWN_MOBILE_GALLERY_IMAGES: [] },
      './gallery/mikrofiber/mikrofiberProductGalleryImages': { MICROFIBER_MOBILE_GALLERY_IMAGES: [] },
      './gallery/svale/svaleProductGalleryImages': { SVALE_MOBILE_GALLERY_IMAGES: [] },
    },
  });
  const gallery = getGallery(product('comfyrobe'), variant());
  assert.equal(gallery.desktop.length, 3);
  assert.equal(gallery.mobile.length, 6);
  assert.equal(gallery.desktop[2].url, gallery.mobile[1].url);
  assert.equal(gallery.desktop[2].width, 1024);
  assert.equal(gallery.desktop[2].height, 1536);
});

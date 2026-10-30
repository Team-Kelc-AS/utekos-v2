/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');

const image = (id, width, height) => ({ id, url: `/${id}.webp`, altText: id, width, height });
const comfyPortrait = image('comfy-portrait', 1536, 2048);
const portrait = image('portrait', 1000, 1500);
const requestedVargnattImage = '/images/kunnskap/Black_Mikrofiber_Full.webp';
const fjellblaMobileUrls = ['', '_2', '_3', '_4', '_5', '_6', '_7', '_8', '_9']
  .map(suffix => `/images/products/Fjellbla_Front_34${suffix}.webp`);
const otherFormats = [image('square', 1000, 1000), image('tall', 887, 1774), image('desktop', 1440, 1800)];
const desktop = [otherFormats[2]];
const warnings = [];
const { productGallery } = loadTypeScript('lib/products/gallery.ts', {
  globals: { console: { warn: message => warnings.push(message) } },
  mocks: {
    './gallery/productGalleryImageOverrides': { PRODUCT_GALLERY_IMAGE_OVERRIDES: { comfyrobe: desktop, 'utekos-dun': desktop, 'utekos-stapper': [otherFormats[0]] } },
    './gallery/comfyrobeProductGalleryImages': { COMFYROBE_MOBILE_GALLERY_IMAGES: [comfyPortrait, portrait, ...otherFormats] },
    './gallery/techdown/productGalleryImages': { TECHDOWN_MOBILE_GALLERY_IMAGES: [] },
    './gallery/mikrofiber/mikrofiberProductGalleryImages': { MICROFIBER_MOBILE_GALLERY_IMAGES: [] },
    './gallery/svale/svaleProductGalleryImages': { SVALE_MOBILE_GALLERY_IMAGES: [] },
    './gallery/stapper/stapperDesktopImages': { STAPPER_MOBILE_GALLERY_IMAGES: [otherFormats[0]] },
  },
});
const product = (handle, images = []) => ({ handle, images: { nodes: images } });
const variant = (color = 'Fjellblå', image = null) => ({ selectedOptions: [{ name: 'Farge', value: color }], image });

test('Comfyrobe accepts 3:4 originals on mobile and retains its desktop ratio', () => {
  const gallery = productGallery(product('comfyrobe'), variant());
  assert.deepEqual(Array.from(gallery.mobile), [comfyPortrait]);
  assert.deepEqual(Array.from(gallery.desktop), desktop);
});

test('Fjellblå uses the selected mobile originals while other invalid formats remain rejected', () => {
  const dun = productGallery(product('utekos-dun'), variant());
  assert.deepEqual(Array.from(dun.mobile, image => image.url), fjellblaMobileUrls);
  assert.deepEqual(Array.from(dun.desktop), desktop);
  const stapper = productGallery(product('utekos-stapper'), variant());
  assert.equal(stapper.mobile.length, 0);
  assert.equal(stapper.desktop.length, 0);
});

test('Dun Vargnatt starts with the requested full image and filters remaining originals by viewport', () => {
  for (const handle of ['utekos-dun']) {
    const mobile = productGallery(product(handle), variant('Vargnatt', portrait));
    assert.equal(mobile.mobile[0].url, requestedVargnattImage);
    assert.equal(mobile.desktop[0].url, requestedVargnattImage);
    assert.deepEqual([mobile.desktop[0].width, mobile.desktop[0].height], [2000, 3000]);
    assert.deepEqual(Array.from(mobile.mobile.slice(1)), [portrait]);
    assert.equal(mobile.desktop.length, 1);
    const large = productGallery(product(handle), variant('Vargnatt', desktop[0]));
    assert.deepEqual(Array.from(large.desktop.slice(1)), desktop);
    assert.equal(large.mobile.length, 1);
    const gallery = productGallery(product(handle), variant('Vargnatt', otherFormats[0]));
    assert.equal(gallery.mobile.length, 1);
    assert.equal(gallery.desktop.length, 1);
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
const rejectedImage = '/images/kunnskap/morgenro_ved_fjorden.webp';
const vargnattImages = ['mikrofiber_vargnatt_45_jarle_2.webp', 'mikrofiber_vargnatt_45_2.webp', 'mikrofiber_vargnatt_45_3.webp', 'Mikrofiber_Vargnatt_1440x1800_Full2.webp'].map(file => `/images/kunnskap/${file}`);

const blueReplacements = ['Bak', 'Parkas'].map(view => `/images/products/Utekos_Fjellbla_1080x1440_${view}.webp`);
const blueStudio = ['/images/kunnskap/Soveposejakke_Blue1.webp', ...blueReplacements, '/images/kunnskap/Soveposejakke_Blue4.webp'];
const blackStudio = [1, 2, 3, 4].map(n => `/images/kunnskap/Soveposejakke_Black${n}.webp`);

test('Mikrofiber M and L use the nine Fjellblå mobile images while other galleries remain unchanged', () => {
  for (const size of ['Medium', 'Large']) {
    const selected = variant('Fjellblå');
    selected.selectedOptions.push({ name: 'Størrelse', value: size });
    const gallery = mikrofiberGallery.productGallery(product('utekos-mikrofiber'), selected);
    assert.deepEqual(Array.from(gallery.mobile, image => image.url), fjellblaMobileUrls);
    assert.equal(gallery.mobile[6].url, fjellblaMobileUrls[6]);
    assert.equal(gallery.desktop.length, 5);
    assert.equal(gallery.mobile.length, 9);
    assert.deepEqual(Array.from(gallery.desktop.slice(0, 4), image => image.url), blueStudio);
    assert.ok(gallery.desktop[4].url.includes("Mikrofiber_44.webp"));
    assert.deepEqual(Array.from(gallery.desktop.slice(1, 3), image => image.url), blueReplacements);
    assert.ok(gallery.mobile.every(image => image.width === 1200 && image.height === 1600));
    assert.ok([...gallery.desktop, ...gallery.mobile].every(image => image.url !== rejectedImage));
    const darkVariant = variant('Vargnatt', portrait);
    darkVariant.selectedOptions.push({ name: 'Størrelse', value: size });
    const dark = mikrofiberGallery.productGallery(product('utekos-mikrofiber'), darkVariant);
    assert.deepEqual(Array.from(dark.desktop, image => image.url), [...vargnattImages, ...blackStudio]);
    assert.deepEqual(Array.from(dark.mobile, image => image.url), blackStudio);
    assert.deepEqual(Array.from(dark.mobile, image => [image.width, image.height]), [[2000, 3000], [2000, 3001], [2000, 3000], [2000, 3001]]);
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
      assert.ok(fjellblaMobileUrls.every(url => item.image.includes(`https://utekos.no${url}`)));
      assert.ok(!item.image.includes(`https://utekos.no${rejectedImage}`));
      const gallery = mikrofiberGallery.productGallery(product('utekos-mikrofiber'), variant());
      assert.deepEqual(Array.from(item.image), [...new Set([...gallery.desktop, ...gallery.mobile].map(image => new URL(image.url, 'https://utekos.no').href))]);
      assert.equal(new Set(item.image).size, item.image.length);
    } else {
      assert.deepEqual(Array.from(item.image), [...vargnattImages, ...blackStudio].map(url => `https://utekos.no${url}`));
    }
  }
});

test('Dun Fjellblå uses nine mobile originals with image 7 third last and retains its desktop gallery', () => {
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
  assert.deepEqual(Array.from(gallery.mobile, image => image.url), fjellblaMobileUrls);
  assert.equal(gallery.mobile.at(-3).url, '/images/products/Fjellbla_Front_34_7.webp');
  assert.ok(gallery.mobile.every(image => image.width === 1200 && image.height === 1600));
  assert.deepEqual(Array.from(gallery.desktop.slice(-3), image => [image.width, image.height]), [[1440, 1800], [1440, 1800], [1237, 1718]]);
  const dark = getGallery(product('utekos-dun'), variant('Vargnatt', desktop[0]));
  assert.equal(dark.desktop[0].url, requestedVargnattImage);
  assert.deepEqual(Array.from(dark.desktop.slice(1)), desktop);
  assert.equal(dark.mobile.length, 1);
  assert.equal(dark.mobile[0].url, requestedVargnattImage);
});

test('Comfyrobe uses separate native 4:5 desktop and 3:4 mobile galleries', () => {
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
  assert.equal(gallery.desktop.length, 13);
  assert.equal(gallery.desktop[0].url, '/images/products/comfyrobe/comfy-1440x1800.webp');
  const fs = require('node:fs');
  const nonGalleryFiles = ['comfy-xs.webp', 'comfy-xl.webp', 'comfyrobe-herre-smiler-lurt-hender-i-lommen.webp'];
  const files = fs.readdirSync('public/images/products/comfyrobe').filter(file => file.endsWith('.webp') && !file.includes('1440x1800') && !file.includes('-card-') && !nonGalleryFiles.includes(file));
  assert.equal(gallery.mobile.length, 18);
  assert.deepEqual(
    Array.from(gallery.mobile, image => image.url.normalize('NFC')).sort(),
    files.map(file => `/images/products/comfyrobe/${file}`.normalize('NFC')).sort()
  );
  assert.deepEqual(Array.from(gallery.mobile.slice(0, 6), image => image.url), [
    '/images/products/comfyrobe/Comfyrobe.webp',
    '/images/products/comfyrobe/1.webp',
    '/images/products/comfyrobe/2.webp',
    '/images/products/comfyrobe/comfyrobe-avslappet-herre-staende-hender-i-lomme.webp',
    '/images/products/comfyrobe/comfyrobe-herre-smiler-med-hendene-i-lommen.webp',
    '/images/products/comfyrobe/3.webp',
  ]);
  for (const image of gallery.mobile) {
    assert.equal(image.width / image.height, 3 / 4);
    assert.ok(image.altText);
  }
  for (const image of gallery.desktop) {
    assert.equal(image.width, 1440);
    assert.equal(image.height, 1800);
    assert.ok(image.url.startsWith('/images/products/comfyrobe/'));
    assert.ok(fs.existsSync(`public${image.url}`));
  }
});

/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const vm = require('node:vm');
const { loadTypeScript } = require('./load-typescript.cjs');
const { supportPages } = loadTypeScript('lib/seo/supportPages.ts');
const { buildSupportMetadata } = loadTypeScript('lib/seo/buildSupportMetadata.ts');
const { buildSupportJsonLd } = loadTypeScript('lib/seo/JSON-LD/buildSupportJsonLd.ts');
const { buildSiteJsonLd } = loadTypeScript('lib/seo/JSON-LD/buildSiteJsonLd.ts');
const { serializeJsonLd } = loadTypeScript('lib/seo/JSON-LD/serializeJsonLd.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const origin = 'https://utekos.no';
const root = path.resolve(__dirname, '..');
const expected = {
  about: ['Om Utekos | Historien bak varmeplaggene', 'AboutPage', 'Om oss'],
  contact: ['Kontakt Utekos | Kundeservice og produktveiledning', 'ContactPage', 'Kontakt oss'],
  sizeGuide: ['Størrelsesguide for Utekos | Mål og passform', 'WebPage', 'Størrelsesguide'],
  maintenance: ['Vask og vedlikehold av Utekos | Pleie av varmeplagg', 'WebPage', 'Vask og vedlikehold'],
  shippingReturns: ['Frakt og retur hos Utekos | Levering og størrelsesbytte', 'WebPage', 'Frakt og retur'],
};

test('support metadata keeps approved titles, canonical identity and native image ownership', () => {
  for (const [key, [title]] of Object.entries(expected)) {
    const page = supportPages[key];
    const rawMetadata = buildSupportMetadata(key);
    const metadata = plain(rawMetadata);
    assert.equal(metadata.title.absolute, title);
    assert.equal(metadata.description, page.description);
    assert.equal(metadata.alternates.canonical, origin + page.path);
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
    assert.equal(metadata.openGraph.title, title);
    assert.equal(metadata.twitter.title, title);
    assert.equal(metadata.openGraph.description, metadata.description);
    assert.equal(metadata.twitter.description, metadata.description);
    assert.equal(metadata.openGraph.locale, 'nb_NO');
    assert.equal(metadata.openGraph.siteName, 'Utekos');
    assert.equal(metadata.openGraph.type, key === 'maintenance' ? 'article' : 'website');
    assert.equal(metadata.twitter.card, 'summary_large_image');
    assert.equal(Object.hasOwn(rawMetadata.openGraph, 'images'), false);
    assert.equal(Object.hasOwn(rawMetadata.twitter, 'images'), false);
    assert.equal(metadata.openGraph.modifiedTime, key === 'maintenance' ? '2026-09-01' : undefined);
  }
});

test('all support pages keep preview noindex and unrestricted public snippets', () => {
  for (const environment of ['production', 'preview', 'development']) {
    const { buildSupportMetadata: build } = loadTypeScript('lib/seo/buildSupportMetadata.ts', { env: { VERCEL_ENV: environment } });
    for (const key of Object.keys(expected)) {
      assert.equal(build(key).robots.index, environment !== 'preview');
      assert.equal(build(key).robots.follow, true);
      assert.equal(build(key).robots['max-image-preview'], 'large');
      assert.equal(build(key).robots['max-snippet'], -1);
      for (const directive of ['nosnippet', 'noarchive', 'nocache']) assert.equal(build(key).robots[directive], undefined);
    }
  }
});

function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  visit(value);
  Object.values(value).forEach(child => Array.isArray(child) ? child.forEach(item => walk(item, visit)) : walk(child, visit));
}

test('page graphs reuse one merchant, website and nested contact identity, with resolvable references', () => {
  for (const [key, [, type, label]] of Object.entries(expected)) {
    const graph = plain(buildSupportJsonLd(key));
    const metadata = plain(buildSupportMetadata(key));
    const nodes = graph['@graph'];
    assert.equal(nodes.filter(node => ['OnlineStore', 'WebSite', 'Organization'].includes(node['@type'])).length, 0);
    const page = nodes.find(node => node['@id'] === metadata.alternates.canonical + '#webpage');
    assert.equal(page['@type'], type);
    assert.equal(page.name, metadata.title.absolute);
    assert.equal(page.description, metadata.description);
    assert.equal(page.url, metadata.alternates.canonical);
    assert.equal(page.inLanguage, 'nb-NO');
    const breadcrumb = nodes.find(node => node['@type'] === 'BreadcrumbList');
    assert.equal(page.breadcrumb['@id'], breadcrumb['@id']);
    assert.deepEqual(breadcrumb.itemListElement, [
      { '@type': 'ListItem', position: 1, name: 'Forsiden', item: origin + '/' },
      { '@type': 'ListItem', position: 2, name: label, item: page.url },
    ]);
    const combined = [buildSiteJsonLd(), graph];
    const ids = [];
    combined.forEach(data => walk(data, node => { if (node['@type'] && node['@id']) ids.push(node['@id']); }));
    assert.equal(new Set(ids).size, ids.length, 'No duplicate entity definitions');
    combined.forEach(data => walk(data, node => { if (node['@id']) assert.ok(ids.includes(node['@id']), `Unresolved ${node['@id']}`); }));
    walk(graph, node => assert.ok(!['Product', 'ProductGroup', 'Offer', 'AggregateRating', 'FAQPage', 'HowTo', 'Dataset'].includes(node['@type'])));
    assert.deepEqual(JSON.parse(serializeJsonLd(graph)), graph);
  }
  const contact = plain(buildSupportJsonLd('contact'))['@graph'][0];
  assert.equal(contact.mainEntity['@id'], 'https://utekos.no/#customer-service');
  assert.equal(buildSiteJsonLd()['@graph'][0].contactPoint['@id'], contact.mainEntity['@id']);
});

test('founder and article markup contain documented facts and no inferred publication data', () => {
  const about = plain(buildSupportJsonLd('about'))['@graph'];
  const founder = about.find(node => node['@type'] === 'Person');
  assert.equal(founder.name, 'Erling Holthe');
  assert.equal(founder.jobTitle, 'Grunnlegger av Utekos');
  assert.equal(founder.url, origin + '/om-oss#historien');
  assert.equal(about[0].mainEntity['@id'], origin + '/#organization');
  const image = about.find(node => node['@type'] === 'ImageObject');
  assert.equal(founder.image['@id'], image['@id']);
  assert.equal(image.url, origin + '/UtekosGrunder.webp');
  const article = plain(buildSupportJsonLd('maintenance'))['@graph'].find(node => node['@type'] === 'Article');
  assert.equal(article.headline, 'Riktig pleie. Varme som varer.');
  assert.equal(article.dateModified, '2026-09-01');
  assert.equal(article.mainEntityOfPage['@id'], origin + '/handlehjelp/vask-og-vedlikehold#webpage');
  for (const field of ['author', 'datePublished', 'image']) assert.equal(Object.hasOwn(article, field), false);
  for (const key of ['about', 'contact', 'sizeGuide', 'shippingReturns']) assert.equal(buildSupportJsonLd(key)['@graph'].some(node => node['@type'] === 'Article'), false);
  const families = plain(buildSupportJsonLd('sizeGuide'))['@graph'][0].about;
  assert.deepEqual(families.map(node => node.name), ['Utekos TechDown™', 'Utekos Dun™', 'Utekos Mikrofiber™', 'Comfyrobe™']);
  assert.ok(families.every(node => node['@type'] === 'Thing' && node.url.startsWith(origin + '/produkter/')));
});

test('shipping policy page links to shared policies and uses its visible revision date', () => {
  const page = plain(buildSupportJsonLd('shippingReturns'))['@graph'][0];
  const merchant = plain(buildSiteJsonLd())['@graph'][0];
  assert.equal(page.dateModified, '2026-10-05');
  assert.deepEqual(page.mainEntity.map(entity => entity['@id']), [
    merchant.hasMerchantReturnPolicy['@id'], merchant.hasShippingService['@id'],
  ]);
  assert.equal(page.about['@id'], merchant['@id']);
  for (const field of ['author', 'datePublished', 'image']) assert.equal(Object.hasOwn(page, field), false);
});

test('replacement slots contain valid 1200 × 630 JPEGs with alt text', async () => {
  const sharp = createRequire(require.resolve('next/package.json'))('sharp');
  for (const page of Object.values(supportPages)) {
    const dir = path.join(root, 'src/app/(storefront)', page.path);
    const file = path.join(dir, 'opengraph-image.jpg');
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.format, 'jpeg');
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 630);
    assert.ok(fs.statSync(file).size < 5 * 1024 * 1024, 'Also fits Twitter limit');
    assert.ok(fs.readFileSync(path.join(dir, 'opengraph-image.alt.txt'), 'utf8').trim().length > 0);
  }
  const image = buildSupportJsonLd('about')['@graph'].find(node => node['@type'] === 'ImageObject');
  const actual = await sharp(path.join(root, 'public/UtekosGrunder.webp')).metadata();
  assert.equal(image.width.value, actual.width);
  assert.equal(image.height.value, actual.height);
});

test('installed Next metadata loader changes the image URL when image bytes change', async () => {
  const loader = require('next/dist/build/webpack/loaders/next-metadata-image-loader').default;
  const resourcePath = path.join(root, 'src/app/(storefront)/om-oss/opengraph-image.jpg');
  const bytes = fs.readFileSync(resourcePath);
  const context = {
    resourcePath, rootContext: root,
    getOptions: () => ({ type: 'openGraph', segment: '/(storefront)/om-oss', pageExtensions: ['tsx', 'ts', 'mdx'], basePath: '' }),
  };
  async function imageUrl(content) {
    const source = await loader.call(context, content);
    const factory = vm.runInNewContext(`(${source.replace('export default ', '')})`);
    return factory()[0].url;
  }
  const original = await imageUrl(bytes);
  // Valid JPEG with different trailing bytes; repository assets are never mutated.
  const changed = await imageUrl(Buffer.concat([bytes, Buffer.from('seo-image-version-test')]));
  assert.notEqual(original, changed);
  assert.equal(original.split('?')[0], changed.split('?')[0]);
  assert.ok(original.includes('?'));
});

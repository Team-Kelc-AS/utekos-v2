/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { loadTypeScript } = require('./load-typescript.cjs');
const { buildRootMetadata, buildHomeMetadata } = loadTypeScript('lib/seo/siteMetadata.ts');
const { buildSiteJsonLd } = loadTypeScript('lib/seo/JSON-LD/buildSiteJsonLd.ts');
const { serializeJsonLd } = loadTypeScript('lib/seo/JSON-LD/serializeJsonLd.ts');
const { siteIdentity, siteSocialImage } = loadTypeScript('lib/seo/siteIdentity.ts');
const plain = value => JSON.parse(JSON.stringify(value));

test('root defaults cannot leak a homepage canonical or override route social content', () => {
  const root = plain(buildRootMetadata());
  assert.equal(root.metadataBase, 'https://utekos.no/');
  assert.equal(root.alternates, undefined);
  assert.equal(root.openGraph.url, undefined);
  assert.equal(root.openGraph.title, undefined);
  assert.equal(root.openGraph.description, undefined);
  assert.deepEqual(root.twitter, { card: 'summary_large_image' });
  assert.equal(root.openGraph.locale, 'nb_NO');
  assert.equal(root.openGraph.siteName, 'Utekos');
  assert.equal(root.title.template, '%s | Utekos');
  assert.notEqual(root.description, 'Nettbutikk');
  const home = plain(buildHomeMetadata());
  assert.equal(home.alternates.canonical, 'https://utekos.no/');
  assert.equal(home.openGraph.url, home.alternates.canonical);
  assert.equal(home.openGraph.title, home.title.absolute);
  assert.equal(home.twitter.title, home.openGraph.title);
  assert.equal(home.twitter.description, home.description);
  assert.equal(home.twitter.images[0].url, home.openGraph.images[0].url);
});

test('shared robots preserves preview noindex and empty-listing noindex', () => {
  for (const environment of ['production', 'preview', 'development']) {
    const { buildRobotsMetadata, buildRootMetadata: root } = loadTypeScript('lib/seo/siteMetadata.ts', { env: { VERCEL_ENV: environment } });
    assert.equal(root().robots.index, environment !== 'preview');
    assert.equal(buildRobotsMetadata(true).index, environment !== 'preview');
    assert.equal(buildRobotsMetadata(false).index, false);
    assert.equal(buildRobotsMetadata().follow, true);
    assert.equal(buildRobotsMetadata()['max-image-preview'], 'large');
  }
});

test('site graph represents the verified merchant and website, without page-specific entities', () => {
  const graph = plain(buildSiteJsonLd())['@graph'];
  assert.deepEqual(graph.map(node => node['@type']), ['OnlineStore', 'WebSite']);
  const [merchant, website] = graph;
  assert.equal(merchant['@id'], 'https://utekos.no/#organization');
  assert.equal(merchant.name, 'Utekos');
  assert.equal(merchant.legalName, 'KELC AS');
  assert.equal(merchant.identifier.value, '925820393');
  assert.equal(merchant.url, 'https://utekos.no/');
  assert.equal(merchant.email, 'kundeservice@utekos.no');
  assert.equal(merchant.contactPoint.telephone, '+4740216343');
  assert.equal(merchant.address.addressCountry, 'NO');
  assert.equal(merchant.address.postalCode, '5162');
  assert.equal(merchant.logo, 'https://utekos.no/icon.png');
  assert.equal(website.name, merchant.name);
  assert.equal(website.publisher['@id'], merchant['@id']);
  for (const unsupported of ['foundingDate', 'sameAs', 'vatID', 'aggregateRating', 'review', 'openingHours']) {
    assert.equal(merchant[unsupported], undefined);
  }
});

test('shared merchant policies preserve complete return terms and standard Norway shipping thresholds', () => {
  const merchant = plain(buildSiteJsonLd())['@graph'][0];
  assert.deepEqual(merchant.hasMerchantReturnPolicy, {
    '@type': 'MerchantReturnPolicy', '@id': 'https://utekos.no/frakt-og-retur#return-policy',
    merchantReturnLink: 'https://utekos.no/frakt-og-retur',
  });
  const service = merchant.hasShippingService;
  assert.equal(service['@id'], 'https://utekos.no/frakt-og-retur#shipping-service');
  assert.equal(service.url, 'https://utekos.no/frakt-og-retur#frakt-og-levering');
  assert.equal(service.description, 'Ordinær frakt i Norge koster 99 kr på bestillinger under 999 kr. Fra 999 kr er ordinær frakt gratis.');
  for (const field of ['handlingTime', 'fulfillmentType', 'validForMemberTier']) assert.equal(service[field], undefined);
  assert.equal(service.shippingConditions.length, 2);
  for (const condition of service.shippingConditions) {
    assert.equal(condition.shippingDestination.addressCountry, 'NO');
    assert.equal(condition.shippingRate.currency, 'NOK');
    for (const field of ['transitTime', 'seasonalOverride', 'shippingOrigin', 'doesNotShip']) assert.equal(condition[field], undefined);
  }
  // Google selects the lowest applicable rate when shipping conditions overlap.
  function rate(orderValue) {
    return Math.min(...service.shippingConditions
      .filter(condition => orderValue >= (condition.orderValue?.minValue ?? 0) && orderValue <= (condition.orderValue?.maxValue ?? Infinity))
      .map(condition => condition.shippingRate.value));
  }
  for (const [value, expected] of [[1, 99], [998.99, 99], [999, 0], [1000, 0]]) assert.equal(rate(value), expected);
  assert.equal(service.shippingConditions[1].orderValue.currency, 'NOK');
});

test('collection and partner page references resolve through the root graph without duplicate identities', () => {
  const { buildKnowledgeOverviewJsonLd } = loadTypeScript('lib/knowledge/buildKnowledgeJsonLd.ts');
  const { nbccStructuredData } = loadTypeScript('lib/nbcc/structuredData.ts');
  for (const routeGraph of [buildKnowledgeOverviewJsonLd(), nbccStructuredData()]) {
    const all = plain([...buildSiteJsonLd()['@graph'], ...routeGraph['@graph']]);
    const ids = new Set(all.map(node => node['@id']));
    assert.equal(ids.size, all.length);
    const page = all.find(node => ['CollectionPage', 'WebPage'].includes(node['@type']));
    assert.ok(ids.has(page.isPartOf['@id']));
    assert.ok(ids.has(page.breadcrumb['@id']));
    if (page.mainEntity) assert.ok(ids.has(page.mainEntity['@id']));
    if (page.about) assert.ok(ids.has(page.about[0]['@id']));
  }
});

test('shared serialization cannot terminate a script or corrupt Norwegian text', () => {
  const input = { text: '</script><script>alert(1)</script> Æ Ø Å ™ \u2028 \u2029' };
  const serialized = serializeJsonLd(input);
  assert.ok(!serialized.includes('<'));
  assert.deepEqual(JSON.parse(serialized), input);
});

test('original default sharing image and logo match their declared dimensions and formats', async () => {
  const sharp = createRequire(require.resolve('next/package.json'))('sharp');
  for (const image of [
    { ...siteSocialImage, src: new URL(siteSocialImage.url).pathname, format: 'jpeg' },
    { ...siteIdentity.logo, format: 'png' },
  ]) {
    const file = path.resolve(__dirname, '../public', image.src.slice(1));
    const actual = await sharp(file).metadata();
    assert.equal(actual.width, image.width);
    assert.equal(actual.height, image.height);
    assert.equal(actual.format, image.format);
    assert.ok(fs.statSync(file).size < 8_000_000);
  }
});

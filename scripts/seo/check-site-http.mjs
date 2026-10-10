/** Rendered root/leaf metadata regression, against an already running server. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { load } from 'cheerio';

const base = process.env.SEO_TEST_ORIGIN ?? 'http://localhost:3000';
const output = process.env.SEO_TEST_OUTPUT ?? '/tmp/utekos-site-seo-http';
const preview = process.env.SEO_EXPECT_PREVIEW === '1';
fs.mkdirSync(output, { recursive: true });
const routes = ['/', '/kontaktskjema', '/om-oss', '/handlehjelp/storrelsesguide', '/handlehjelp/vask-og-vedlikehold', '/frakt-og-retur', '/personvern', '/forhandlere', '/produkter', '/produkter/camping-og-bobil/nbcc', '/produkter/utekos-techdown', '/uteguiden', '/uteguiden/hvorfor-blir-man-kald'];
const agents = { browser: 'Mozilla/5.0', google: 'Googlebot', bing: 'bingbot', facebook: 'facebookexternalhit/1.1' };
const results = [];

function checkIdentity($, route) {
  const script = $('script#site-jsonld[type="application/ld+json"]');
  assert.equal(script.length, 1, `Root graph count: ${route}`);
  const all = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const data = JSON.parse($(el).text());
    all.push(...(data['@graph'] ?? [data]));
  });
  const ids = all.filter(node => node['@id']).map(node => node['@id']);
  assert.equal(new Set(ids).size, ids.length, `Duplicate top-level IDs: ${route}`);
  assert.equal(all.filter(node => node['@id'] === 'https://utekos.no/#organization').length, 1);
  assert.equal(all.filter(node => node['@id'] === 'https://utekos.no/#website').length, 1);
  assert.equal(all.find(node => node['@id'] === 'https://utekos.no/#organization')['@type'], 'OnlineStore');
  assert.equal(all.find(node => node['@type'] === 'WebSite').url, 'https://utekos.no/');
  const inspect = node => {
    if (!node || typeof node !== 'object') return;
    // All Utekos organization definitions live at the root, even inside offers.
    if (['Organization', 'OnlineStore'].includes(node['@type']) && node.name === 'Utekos') {
      assert.equal(node['@id'], 'https://utekos.no/#organization');
      assert.equal(node['@type'], 'OnlineStore');
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(inspect);
      else inspect(value);
    }
  };
  all.forEach(inspect);
  return all;
}

for (const route of routes) {
  for (const [agent, userAgent] of Object.entries(agents)) {
    const response = await fetch(`${base}${route}`, { headers: { 'user-agent': userAgent }, signal: AbortSignal.timeout(90_000) });
    assert.equal(response.status, 200, `${route} ${agent}`);
    const html = await response.text();
    const $ = load(html);
    const title = $('head title').text();
    const meta = (name, attribute = 'name') => $(`meta[${attribute}="${name}"]`).attr('content');
    assert.equal($('html').attr('lang'), 'nb');
    assert.equal($('link[rel="canonical"]').length, 1);
    assert.equal(new URL($('link[rel="canonical"]').attr('href')).href, `https://utekos.no${route}`);
    assert.ok(title.length > 'Utekos'.length, `Page title: ${route}`);
    assert.ok(!title.includes('| Utekos | Utekos'));
    assert.ok(meta('description')?.length > 20);
    assert.equal(meta('twitter:card'), 'summary_large_image');
    assert.equal(meta('twitter:title'), meta('og:title', 'property'), `Twitter title fallback: ${route}`);
    assert.equal(meta('twitter:description'), meta('og:description', 'property'), `Twitter description fallback: ${route}`);
    if (meta('og:image', 'property')) assert.equal(meta('twitter:image'), meta('og:image', 'property'), `Twitter image fallback: ${route}`);
    if (meta('og:url', 'property')) assert.equal(new URL(meta('og:url', 'property')).href, `https://utekos.no${route}`);
    assert.equal(meta('robots')?.includes('noindex'), preview);
    assert.match(meta('robots'), /max-image-preview:large/);
    const nodes = checkIdentity($, route);
    if (route === '/') assert.deepEqual(nodes.map(node => node['@type']), ['OnlineStore', 'WebSite']);
    if (route.startsWith('/uteguiden/')) assert.equal(nodes.filter(node => node['@type'] === 'Article').length, 1);
    if (route === '/produkter/utekos-techdown') {
      const product = nodes.find(node => ['Product', 'ProductGroup'].includes(node['@type']));
      assert.ok(product);
      for (const variant of product.hasVariant ?? [product]) assert.equal(variant.offers.seller['@id'], 'https://utekos.no/#organization');
    }
    if (agent === 'browser') {
      const name = route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
      fs.writeFileSync(`${output}/${name}.html`, html);
      // Public schema + metadata only; suitable for external code validators.
      fs.writeFileSync(`${output}/${name}-schema.html`, `<!doctype html><html lang="nb"><head>${$('head').html()}</head><body>${$('script[type="application/ld+json"]').toArray().map(el => $.html(el)).join('')}</body></html>`);
    }
    results.push({ route, agent, status: response.status, title, graphs: $('script[type="application/ld+json"]').length });
  }
}
for (const route of ['/?utm_source=seo-check', '/uteguiden/hvorfor-blir-man-kald?utm_source=seo-check']) {
  const $ = load(await (await fetch(`${base}${route}`)).text());
  assert.equal(new URL($('link[rel="canonical"]').attr('href')).href, `https://utekos.no${route.split('?')[0]}`);
}
const missing = await fetch(`${base}/uteguiden/seo-check-unknown`);
assert.equal(missing.status, 404);
const missingHtml = load(await missing.text());
assert.ok(missingHtml('meta[name="robots"]').toArray().some(el => missingHtml(el).attr('content')?.includes('noindex')));
const missingCanonical = missingHtml('link[rel="canonical"]').attr('href');
assert.ok(!missingCanonical || new URL(missingCanonical).href !== 'https://utekos.no/');
for (const [asset, mime] of [['/icon.png', 'image/png'], ['/og-image-skreddersy-varmen.jpg', 'image/jpeg']]) {
  const response = await fetch(`${base}${asset}`);
  assert.equal(response.status, 200);
  assert.ok(response.headers.get('content-type')?.startsWith(mime));
}
fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
console.log(`${results.length} root/route × user-agent checks passed; attribution canonicals, unknown 404/noindex and assets passed. Evidence: ${output}`);

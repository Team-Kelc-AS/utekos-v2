/** Inspect real Next output against an already running server; never starts a job. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { load } from 'cheerio';

const require = createRequire(import.meta.url);
const { loadTypeScript } = require('../../tests/load-typescript.cjs');
const { supportPages } = loadTypeScript('lib/seo/supportPages.ts');
const base = process.env.SEO_TEST_ORIGIN ?? 'http://localhost:3000';
const output = process.env.SEO_TEST_OUTPUT ?? '/tmp/utekos-support-seo-http';
const preview = process.env.SEO_EXPECT_PREVIEW === '1';
const baselinePath = process.env.SEO_BASELINE;
const baseline = baselinePath ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')) : undefined;
fs.mkdirSync(output, { recursive: true });
const agents = { browser: 'Mozilla/5.0', google: 'Googlebot', bing: 'bingbot', facebook: 'facebookexternalhit/1.1', mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' };
const results = [];

function contentSnapshot($) {
  const main = $('main').clone();
  main.find('script, style').remove();
  return {
    text: main.text().replace(/\s+/g, ' ').trim(),
    tables: main.find('table').map((_, el) => $(el).text().replace(/\s+/g, ' ').trim()).get(),
    links: main.find('a[href]').map((_, el) => $(el).attr('href')).get(),
    // Preserve authored fragment IDs, excluding React/Base UI generated identifiers.
    ids: main.find('[id]').addBack('[id]').map((_, el) => $(el).attr('id')).get().filter(id => !/^[«:_]|^base-ui-/.test(id)),
    classes: main.find('[class]').addBack('[class]').map((_, el) => $(el).attr('class')).get(),
  };
}

function inspect(html, key) {
  const page = supportPages[key];
  const $ = load(html);
  const canonical = `https://utekos.no${page.path}`;
  const meta = (name, attribute = 'name') => $(`head meta[${attribute}="${name}"]`);
  assert.equal($('head title').length, 1);
  assert.equal($('head title').text(), page.title);
  for (const name of ['description', 'twitter:title', 'twitter:description', 'twitter:card', 'twitter:image', 'twitter:image:alt']) assert.equal(meta(name).length, 1, `${key} ${name}`);
  for (const name of ['og:title', 'og:description', 'og:url', 'og:type', 'og:site_name', 'og:locale', 'og:image', 'og:image:alt', 'og:image:width', 'og:image:height', 'og:image:type']) assert.equal(meta(name, 'property').length, 1, `${key} ${name}`);
  const value = (name, attribute) => meta(name, attribute).attr('content');
  assert.equal(value('description'), page.description);
  assert.equal(value('og:title', 'property'), page.title);
  assert.equal(value('twitter:title'), page.title);
  assert.equal(value('og:description', 'property'), page.description);
  assert.equal(value('twitter:description'), page.description);
  assert.equal($('head link[rel="canonical"]').length, 1);
  assert.equal($('head link[rel="canonical"]').attr('href'), canonical);
  assert.equal(value('og:url', 'property'), canonical);
  assert.equal(value('og:type', 'property'), page.socialType);
  assert.equal(value('og:site_name', 'property'), 'Utekos');
  assert.equal(value('og:locale', 'property'), 'nb_NO');
  assert.equal(value('twitter:card'), 'summary_large_image');
  assert.equal(value('twitter:image'), value('og:image', 'property'));
  assert.equal(value('twitter:image:alt').trim(), fs.readFileSync(`src/app/(storefront)${page.path}/opengraph-image.alt.txt`, 'utf8').trim());
  assert.equal(value('twitter:image:alt'), value('og:image:alt', 'property'));
  assert.equal(value('og:image:width', 'property'), '1200');
  assert.equal(value('og:image:height', 'property'), '630');
  assert.equal(value('og:image:type', 'property'), 'image/jpeg');
  const imageUrl = new URL(value('og:image', 'property'));
  assert.ok(imageUrl.pathname.startsWith(page.path + '/opengraph-image'));
  assert.ok(imageUrl.search.length > 1, 'Native file URL has content hash');
  assert.equal(value('robots')?.includes('noindex'), preview);
  assert.match(value('robots'), /max-image-preview:large/);
  assert.match(value('robots'), /max-snippet:-1/);
  assert.doesNotMatch(value('robots'), /nosnippet|nocache|noarchive/);
  assert.equal($('html').attr('lang'), 'nb');
  const headEnd = Buffer.byteLength(html.slice(0, html.indexOf('</head>') + 7));
  assert.ok(headEnd < 1024 * 1024, 'All OG tags in head within first 1 MB');
  assert.equal($('script#site-jsonld').length, 1);
  assert.equal($('script[id^="support-"]').length, 1);
  assert.equal($(`script#support-${key}`).length, 1);
  const graphs = $('script[type="application/ld+json"]').toArray().map(el => JSON.parse($(el).text()));
  const nodes = graphs.flatMap(graph => graph['@graph'] ?? [graph]);
  const definitions = new Map();
  const references = [];
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    if (node['@id']) {
      references.push(node['@id']);
      if (node['@type']) { assert.ok(!definitions.has(node['@id']), `Duplicate entity ${node['@id']}`); definitions.set(node['@id'], node); }
    }
    Object.values(node).forEach(child => Array.isArray(child) ? child.forEach(walk) : walk(child));
  };
  graphs.forEach(walk);
  references.forEach(id => assert.ok(definitions.has(id), `Unresolved ${id}`));
  assert.equal(nodes.filter(node => node['@type'] === 'OnlineStore').length, 1);
  assert.equal(nodes.filter(node => node['@type'] === 'WebSite').length, 1);
  assert.equal(nodes.filter(node => node['@type'] === page.pageType).length, 1);
  const breadcrumbs = nodes.find(node => node['@type'] === 'BreadcrumbList');
  const uiCrumbs = $('main nav[aria-label="Brødsmuler"] li').toArray().filter(el => $(el).attr('aria-hidden') !== 'true').map(el => $(el).text().trim());
  assert.deepEqual(breadcrumbs.itemListElement.map(item => item.name), uiCrumbs);
  assert.equal(breadcrumbs.itemListElement.at(-1).item, canonical);
  assert.equal(nodes.filter(node => node['@type'] === 'Article').length, key === 'maintenance' ? 1 : 0);
  if (page.dateModified) {
    assert.equal(nodes.find(node => node['@id'] === canonical + '#webpage').dateModified, $('main time').attr('datetime'));
    assert.equal($('main time').attr('datetime'), page.dateModified);
  }
  if (key === 'maintenance') {
    const article = nodes.find(node => node['@type'] === 'Article');
    assert.equal(article.headline, $('main h1').text());
    assert.equal(article.dateModified, $('main time').attr('datetime'));
  }
  if (baseline) {
    const before = load(baseline[page.path].main);
    assert.deepEqual(contentSnapshot($), contentSnapshot(before), `Visible text, tables, links, fragments and classes: ${key}`);
  }
  return { $, imageUrl, headEnd, types: nodes.map(node => node['@type']) };
}

for (const [key, page] of Object.entries(supportPages)) {
  let desktop;
  for (const [agent, userAgent] of Object.entries(agents)) {
    const response = await fetch(base + page.path, { headers: { 'user-agent': userAgent }, signal: AbortSignal.timeout(90_000) });
    assert.equal(response.status, 200, `${key} ${agent}`);
    const headerRobots = response.headers.get('x-robots-tag');
    if (!preview) assert.ok(!headerRobots || !/noindex|none/i.test(headerRobots));
    const html = await response.text();
    const { $, imageUrl, headEnd, types } = inspect(html, key);
    if (agent === 'browser') {
      desktop = contentSnapshot($);
      fs.writeFileSync(`${output}/${key}.html`, html);
      const metadata = $('head title, head meta, head link[rel="canonical"]').toArray().map(el => $.html(el)).join('');
      const schema = $('script[type="application/ld+json"]').toArray().map(el => $.html(el)).join('');
      fs.writeFileSync(`${output}/${key}-schema.html`, `<!doctype html><html lang="nb"><head>${metadata}</head><body>${schema}</body></html>`);
      const imageResponse = await fetch(base + imageUrl.pathname + imageUrl.search);
      assert.equal(imageResponse.status, 200);
      assert.ok(imageResponse.headers.get('content-type')?.startsWith('image/jpeg'));
      assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), fs.readFileSync(`src/app/(storefront)${page.path}/opengraph-image.jpg`));
    } else assert.deepEqual(contentSnapshot($), desktop, `${key} same primary content for ${agent}`);
    results.push({ route: page.path, agent, status: response.status, headerRobots, headBytes: headEnd, bytes: Buffer.byteLength(html), image: imageUrl.href, types });
  }
  const attributed = await fetch(base + page.path + '?utm_source=seo-check&fbclid=seo-check');
  inspect(await attributed.text(), key);
  // Meta documents Range support OR ignoring Range. Both 200/full and 206 are valid.
  const ranged = await fetch(base + page.path, { headers: { 'user-agent': agents.facebook, range: 'bytes=0-1048575', 'accept-encoding': 'gzip, deflate' } });
  assert.ok([200, 206].includes(ranged.status));
  inspect(await ranged.text(), key);
  results.push({ route: page.path, agent: 'facebook-range-compression', status: ranged.status, encoding: ranged.headers.get('content-encoding') });
}
fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
console.log(`${results.length} support HTTP scenarios passed; images, query canonicals, graph references, breadcrumbs and content verified. Evidence: ${output}`);

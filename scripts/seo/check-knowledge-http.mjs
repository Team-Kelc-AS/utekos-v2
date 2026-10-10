/** Check the rendered HTML, not just the builders. Uses an already running server. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { load } from 'cheerio';
const require = createRequire(import.meta.url);
const { loadTypeScript } = require('../../tests/load-typescript.cjs');
const { knowledgeArticleList: articles, knowledgeOverview } = loadTypeScript('lib/knowledge/knowledgeArticles.ts');
const base = process.env.SEO_TEST_ORIGIN ?? 'http://localhost:3000';
const output = process.env.SEO_TEST_OUTPUT ?? '/tmp/utekos-seo-http';
const baseline = process.env.SEO_TEST_BASELINE ? JSON.parse(fs.readFileSync(process.env.SEO_TEST_BASELINE, 'utf8')) : undefined;
fs.mkdirSync(output, { recursive: true });
const agents = {
  browser: 'Mozilla/5.0', google: 'Googlebot', bing: 'bingbot', facebook: 'facebookexternalhit/1.1',
};
const results = [];
for (const article of [undefined, ...articles]) {
  const route = article?.path ?? knowledgeOverview.path;
  for (const [agent, userAgent] of Object.entries(agents)) {
    const response = await fetch(`${base}${route}`, { headers: { 'user-agent': userAgent } });
    assert.equal(response.status, 200, `${agent}: ${route}`);
    const html = await response.text();
    const $ = load(html);
    assert.equal($('h1').length, 1, `H1: ${route}`);
    assert.equal($('h1').text().trim(), article?.title ?? knowledgeOverview.title);
    assert.equal($('link[rel="canonical"]').attr('href'), `https://utekos.no${route}`);
    assert.equal($('title').text(), article?.metaTitle ?? knowledgeOverview.metaTitle);
    assert.equal($('meta[property="og:type"]').attr('content'), article ? 'article' : 'website');
    assert.equal($('meta[property="og:image:width"]').attr('content'), '1200');
    assert.equal($('meta[property="og:image:height"]').attr('content'), '630');
    assert.equal($('meta[name="twitter:card"]').attr('content'), 'summary_large_image');
    const scripts = $('script[id^="knowledge-"][type="application/ld+json"]');
    assert.equal(scripts.length, 1, `Graph count: ${route}`);
    const graph = JSON.parse(scripts.text())['@graph'];
    assert.equal(graph.filter(node => node['@type'] === 'Article').length, article ? 1 : 0);
    const breadcrumb = graph.find(node => node['@type'] === 'BreadcrumbList');
    const visibleCrumbs = $('nav[aria-label="Brødsmuler"] li:not([aria-hidden="true"])').map((_, el) => $(el).text().trim()).get();
    assert.deepEqual(visibleCrumbs, breadcrumb.itemListElement.map(item => item.name));
    if (article) {
      assert.equal($('a[rel="author"]').length, 1, `Byline: ${route}`);
      const imageSources = $('main img').map((_, el) => {
        const src = $(el).attr('src');
        const url = new URL(src, base);
        return url.pathname === '/_next/image' ? url.searchParams.get('url') : decodeURI(url.pathname);
      }).get();
      for (const image of article.images) assert.ok(imageSources.includes(image.src), `${route}: invisible schema image ${image.src}`);
    } else {
      assert.equal($('details summary').filter((_, el) => $(el).text() === 'Se mer').length, 1);
      for (const item of articles) assert.ok($(`a[href="${item.path}"]`).length > 0, `Missing server link ${item.path}`);
    }
    if (agent === 'browser') {
      fs.writeFileSync(`${output}/${article?.slug ?? 'index'}.html`, html);
      if (baseline?.[article?.slug ?? '']) {
        const before = baseline[article?.slug ?? ''];
        const headings = $('main h1, main h2, main h3, main h4, main h5, main h6').map((_, el) => ({ id: $(el).attr('id') ?? '', text: $(el).text().trim() })).get();
        const paragraphs = $('main p').map((_, el) => $(el).text().replace(/\s+/g, ' ').trim()).get();
        const sources = $('[id^="kilde-"]').map((_, el) => $(el).text().replace(/\s+/g, ' ').trim()).get();
        for (const heading of before.headings) assert.ok(headings.some(h => h.id === heading.id && h.text === heading.text), `Changed heading: ${route}: ${JSON.stringify(heading)}`);
        for (const paragraph of before.paragraphs) assert.ok(paragraphs.includes(paragraph), `Lost paragraph: ${route}: ${paragraph}`);
        assert.deepEqual(sources, before.sources, `Changed sources: ${route}`);
      }
    }
    results.push({ route, agent, status: response.status, title: $('title').text(), graphs: scripts.length });
  }
}
for (const image of [knowledgeOverview.socialImage, ...articles.flatMap(a => [a.socialImage, ...a.images])]) {
  const response = await fetch(`${base}${image.src}`);
  assert.equal(response.status, 200, image.src);
  assert.match(response.headers.get('content-type'), /^image\//);
}
const xmlResponse = await fetch(`${base}/sitemap.xml`);
assert.equal(xmlResponse.status, 200);
const xml = load(await xmlResponse.text(), { xml: true });
for (const article of articles) {
  const entries = xml('url').filter((_, el) => xml(el).children('loc').text() === `https://utekos.no${article.path}`);
  assert.equal(entries.length, 1, `Sitemap: ${article.path}`);
  assert.equal(entries.children('lastmod').text(), article.updatedAt ?? '');
  const images = entries.find('image\\:loc').map((_, el) => xml(el).text()).get();
  for (const image of article.images) assert.ok(images.includes(new URL(image.src, 'https://utekos.no').toString()), `Sitemap image: ${image.src}`);
}
const unknown = await fetch(`${base}/uteguiden/unknown-seo-test-article`);
assert.equal(unknown.status, 404);
const query = load(await (await fetch(`${base}${articles[0].path}?utm_source=seo-test&fbclid=test`)).text());
assert.equal(query('link[rel="canonical"]').attr('href'), `https://utekos.no${articles[0].path}`);
for (const route of ['/uteguiden', ...articles.map(a => a.path)]) {
  const response = await fetch(`${base}${route.replace('/uteguiden', '/kunnskap')}`, { redirect: 'manual' });
  assert.equal(response.status, 308);
  assert.equal(new URL(response.headers.get('location'), base).pathname, route);
}
fs.writeFileSync(`${output}/results.json`, JSON.stringify({ pages: results, images: 'pass', sitemap: 'pass', unknown: 404, redirects: 308, baseline: Boolean(baseline) }, null, 2));
console.log(`PASS: ${results.length} page/bot responses; visible images, sitemap, 404, query canonical, eleven redirects${baseline ? ', original paragraphs/headings/sources' : ''}. Evidence: ${output}`);

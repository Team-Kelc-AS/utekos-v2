/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createRequire } = require('node:module');
const { loadTypeScript } = require('./load-typescript.cjs');
const sharp = createRequire(require.resolve('next/package.json'))('sharp');
const { knowledgeArticleList: articles, knowledgeOverview } = loadTypeScript('lib/knowledge/knowledgeArticles.ts');
const { buildKnowledgeMetadata, buildKnowledgeOverviewMetadata } = loadTypeScript('lib/knowledge/buildKnowledgeMetadata.ts');
const { buildKnowledgeJsonLd, buildKnowledgeOverviewJsonLd, serializeKnowledgeJsonLd } = loadTypeScript('lib/knowledge/buildKnowledgeJsonLd.ts');
const { validateKnowledgeArticles } = loadTypeScript('lib/knowledge/validateKnowledgeArticles.ts');
const { buildSiteJsonLd } = loadTypeScript('lib/seo/JSON-LD/buildSiteJsonLd.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const root = path.resolve(__dirname, '..');
const routeRoot = path.join(root, 'src/app/(blog)/uteguiden');
const expectedSources = [14, 56, 0, 70, 12, 6, 8, 10, 7, 8];

test('registry covers every existing article route once and preserves source counts', () => {
  const routes = fs.readdirSync(routeRoot).filter(slug => fs.existsSync(path.join(routeRoot, slug, 'page.mdx'))).sort();
  assert.equal(articles.length, 10);
  assert.deepEqual(Array.from(articles, a => a.slug).sort(), routes);
  assert.equal(new Set(articles.map(a => a.path)).size, 10);
  assert.deepEqual(Array.from(articles, a => a.references.length), expectedSources);
  for (const slug of ['', ...routes]) {
    assert.ok(fs.existsSync(path.join(routeRoot, slug, 'layout.mdx')));
    assert.ok(!fs.existsSync(path.join(routeRoot, slug, 'layout.tsx')));
  }
});

test('metadata, graph identities, dates and image references agree for all articles', () => {
  for (const article of articles) {
    const url = `https://utekos.no${article.path}`;
    const metadata = buildKnowledgeMetadata(article);
    const graph = plain(buildKnowledgeJsonLd(article))['@graph'];
    const entity = graph.find(node => node['@type'] === 'Article');
    const page = graph.find(node => node['@type'] === 'WebPage');
    const breadcrumbs = graph.find(node => node['@type'] === 'BreadcrumbList');
    const completeGraph = [...plain(buildSiteJsonLd())['@graph'], ...graph];
    const ids = new Set(completeGraph.map(node => node['@id']));
    assert.equal(ids.size, completeGraph.length);
    assert.equal(graph.filter(node => ['Organization', 'OnlineStore', 'WebSite'].includes(node['@type'])).length, 0);
    assert.equal(metadata.alternates.canonical, url);
    assert.equal(metadata.title.absolute, article.metaTitle);
    assert.equal(metadata.openGraph.url, url);
    assert.equal(metadata.openGraph.type, 'article');
    assert.equal(metadata.openGraph.images[0].width, 1200);
    assert.equal(metadata.openGraph.images[0].height, 630);
    assert.equal(metadata.twitter.images[0].url, metadata.openGraph.images[0].url);
    assert.equal(metadata.robots['max-image-preview'], 'large');
    assert.equal(entity.headline, article.title);
    assert.equal(entity.url, url);
    assert.equal(entity.description, metadata.description);
    assert.equal(entity.datePublished, article.publishedAt);
    assert.equal(entity.dateModified, article.updatedAt);
    assert.equal((entity.citation ?? []).length, article.references.length);
    for (const [index, reference] of article.references.entries()) {
      const urls = [entity.citation[index].url].flat();
      for (const link of reference.additionalLinks ?? []) assert.ok(urls.includes(link.url));
    }
    assert.equal(entity.mainEntityOfPage['@id'], page['@id']);
    assert.equal(page.mainEntity['@id'], entity['@id']);
    for (const reference of [entity.author, entity.publisher, page.isPartOf, page.breadcrumb, page.primaryImageOfPage, ...entity.image]) {
      assert.ok(ids.has(reference['@id']), `Unresolved graph reference: ${reference['@id']}`);
    }
    assert.deepEqual(breadcrumbs.itemListElement.map(item => item.position), [1, 2, 3]);
    assert.deepEqual(breadcrumbs.itemListElement.map(item => item.item), ['https://utekos.no/', 'https://utekos.no/uteguiden', url]);
    assert.equal(breadcrumbs.itemListElement[2].name, article.title);
  }
});

test('undocumented dates remain absent; date-only values retain their precision', () => {
  const undated = articles.filter(a => !a.publishedAt);
  assert.equal(undated.length, 3);
  for (const article of undated) {
    const entity = buildKnowledgeJsonLd(article)['@graph'].find(node => node['@type'] === 'Article');
    assert.ok(!Object.hasOwn(entity, 'datePublished'));
    assert.ok(!Object.hasOwn(entity, 'dateModified'));
    assert.ok(!Object.hasOwn(buildKnowledgeMetadata(article).openGraph, 'publishedTime'));
  }
  const dateOnly = { ...articles[0], publishedAt: '2026-09-01', updatedAt: '2026-09-02' };
  const entity = buildKnowledgeJsonLd(dateOnly)['@graph'].find(node => node['@type'] === 'Article');
  assert.equal(entity.datePublished, '2026-09-01');
  assert.equal(entity.dateModified, '2026-09-02');
  assert.equal(buildKnowledgeMetadata(dateOnly).openGraph.publishedTime, '2026-09-01');
});

test('overview has a complete ordered collection and no Article entity', () => {
  const graph = plain(buildKnowledgeOverviewJsonLd())['@graph'];
  assert.equal(graph.filter(node => node['@type'] === 'Article').length, 0);
  assert.equal(graph.filter(node => node['@type'] === 'CollectionPage').length, 1);
  const list = graph.find(node => node['@type'] === 'ItemList');
  assert.equal(list.numberOfItems, 10);
  assert.deepEqual(list.itemListElement.map(item => item.url), Array.from(articles, a => `https://utekos.no${a.path}`));
  assert.deepEqual(list.itemListElement.map(item => item.position), Array.from({ length: 10 }, (_, i) => i + 1));
  assert.equal(buildKnowledgeOverviewMetadata().openGraph.type, 'website');
});

test('preview metadata is noindex while canonical stays on production', () => {
  const { buildKnowledgeMetadata: previewMetadata } = loadTypeScript('lib/knowledge/buildKnowledgeMetadata.ts', { env: { VERCEL_ENV: 'preview' } });
  assert.equal(previewMetadata(articles[0]).robots.index, false);
  assert.equal(previewMetadata(articles[0]).alternates.canonical, `https://utekos.no${articles[0].path}`);
});

test('JSON-LD escapes HTML script termination and preserves Unicode', () => {
  const hostile = plain(articles[0]);
  hostile.title = '</script><script>alert(1)</script> Blåbær ™ \u2028';
  const serialized = serializeKnowledgeJsonLd(buildKnowledgeJsonLd(hostile));
  assert.ok(!serialized.includes('<'));
  assert.equal(JSON.parse(serialized)['@graph'].find(node => node['@type'] === 'Article').headline, hostile.title);
});

test('validation rejects malformed dates, chronology, URL, dimensions and duplicate paths', () => {
  const original = plain(articles[0]);
  for (const change of [
    { publishedAt: '2026-02-30' }, { publishedAt: '2026-10-09', updatedAt: '2025-01-01' },
    { metaDescription: ' ' }, { path: '/uteguiden/wrong-slug' },
    { references: [{ title: 'Source', attribution: '', url: 'javascript:alert(1)' }] },
    { socialImage: { ...original.socialImage, width: 0 } },
  ]) assert.throws(() => validateKnowledgeArticles([{ ...original, ...change }]));
  assert.throws(() => validateKnowledgeArticles([original, original]));
  assert.doesNotThrow(() => validateKnowledgeArticles(articles));
});

test('all declared local images exist with exact dimensions; social graphics are below 8 MB', async () => {
  const images = [knowledgeOverview.socialImage, ...articles.flatMap(a => [a.socialImage, a.cardImage, ...a.images])];
  for (const image of images) {
    const file = path.join(root, 'public', image.src);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.width, image.width, image.src);
    assert.equal(metadata.height, image.height, image.src);
    if (image.src.includes('/social/')) {
      assert.equal(metadata.format, 'png');
      assert.ok(fs.statSync(file).size < 8_000_000);
    }
  }
});

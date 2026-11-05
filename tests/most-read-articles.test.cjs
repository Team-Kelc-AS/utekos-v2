/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');
const recorded = require('../src/lib/knowledge/articleViews.generated.json');
const { articleViewsSchema, rankMostReadArticles, parseArticleViewsReport, readershipDateRange } = loadTypeScript('lib/knowledge/mostReadArticles.ts');

const slugs = ['one', 'two', 'three', 'four', 'five', 'six'];
const articles = slugs.map(slug => ({ slug, path: `/uteguiden/${slug}`, title: slug }));
const snapshot = { ...recorded, rows: slugs.map((slug, index) => ({ path: `/uteguiden/${slug}`, views: index + 1 })) };
const report = {
  dimensionHeaders: [{ name: 'pagePath' }], metricHeaders: [{ name: 'screenPageViews' }],
  rows: snapshot.rows.map(row => ({ dimensionValues: [{ value: row.path }], metricValues: [{ value: String(row.views) }] })),
  rowCount: 6, metadata: { timeZone: 'Europe/Oslo' },
};

test('ranks the five measured articles, normalizes legacy URLs, and excludes unknown pages', () => {
  const rows = [...snapshot.rows, { path: '/kunnskap/one/?utm_source=test', views: 20 }, { path: '/uteguiden/unknown', views: 1000 }];
  const ranked = rankMostReadArticles(articles, rows);
  assert.deepEqual(Array.from(ranked, row => row.article.slug), ['one', 'six', 'five', 'four', 'three']);
  assert.equal(ranked[0].views, 21);
  assert.equal(rankMostReadArticles(articles, [{ path: '/uteguiden/one', views: 1 }]).length, 1);
});

test('ties have deterministic order independent of report or registry ordering', () => {
  const rows = articles.map(article => ({ path: article.path, views: 2 }));
  const first = rankMostReadArticles(articles, rows).map(row => row.article.slug);
  const second = rankMostReadArticles([...articles].reverse(), [...rows].reverse()).map(row => row.article.slug);
  assert.deepEqual(first, second);
});

test('the verified GA4 snapshot produces the actual top five, with no current-page substitution', () => {
  const data = articleViewsSchema.parse(recorded);
  const registry = data.rows.filter(row => row.path !== '/uteguiden/uteguiden').map(row => ({ slug: row.path.split('/').at(-1), path: row.path }));
  assert.deepEqual(Array.from(rankMostReadArticles(registry, data.rows), row => row.article.slug), [
    'hva-skal-man-ha-innerst', 'sherpacore', 'hydroguard', 'vinterlagring-av-campingvogn-og-bobil', 'cloudweave',
  ]);
});

test('measurement windows use the previous 30 complete Oslo days across midnight and daylight saving', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(readershipDateRange(new Date('2026-11-04T23:30:00Z')))), { startDate: '2026-10-06', endDate: '2026-11-04' });
  assert.deepEqual(JSON.parse(JSON.stringify(readershipDateRange(new Date('2026-03-29T22:30:00Z')))), { startDate: '2026-02-28', endDate: '2026-03-29' });
});

test('incomplete, sampled, thresholded, invalid and wrong-metric reports cannot become a ranking', () => {
  const period = { startDate: recorded.startDate, endDate: recorded.endDate };
  assert.equal(parseArticleViewsReport(report, period, recorded.propertyId, recorded.fetchedAt).rows.length, 6);
  for (const invalid of [
    { ...report, rowCount: 7 },
    { ...report, metadata: { ...report.metadata, dataLossFromOtherRow: true } },
    { ...report, metadata: { ...report.metadata, subjectToThresholding: true } },
    { ...report, metadata: { ...report.metadata, samplingMetadatas: [{}] } },
    { ...report, metricHeaders: [{ name: 'activeUsers' }] },
    { ...report, rows: [{ dimensionValues: [{ value: '/uteguiden/one' }], metricValues: [{ value: '-1' }] }], rowCount: 1 },
  ]) assert.throws(() => parseArticleViewsReport(invalid, period, recorded.propertyId, recorded.fetchedAt));
  assert.throws(() => articleViewsSchema.parse({ ...snapshot, startDate: '2026-11-06' }));
});

function reader({ fetch, configured = true } = {}) {
  const logs = [], lifetimes = [];
  class SignJWT {
    setProtectedHeader() { return this; }
    setIssuer() { return this; }
    setAudience() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    async sign() { return 'test-assertion'; }
  }
  const readershipModule = loadTypeScript('lib/knowledge/getArticleReadership.ts', {
    mocks: {
      jose: { errors: { JOSEError: class JOSEError extends Error {} }, importPKCS8: async () => 'test-key', SignJWT },
      'next/cache': { cacheLife: value => lifetimes.push(value) },
      './knowledgeArticles': { knowledgeArticleList: articles },
      './articleViews.generated.json': { default: snapshot },
    },
    env: configured ? { GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON: JSON.stringify({ type: 'service_account', client_email: 'test@example.com', private_key: 'test-private-key' }) } : {},
    globals: { console: { error: message => logs.push(message) } },
    fetch,
  });
  return { ...readershipModule, logs, lifetimes };
}

test('server reader fetches real report data and uses daily cache revalidation', async () => {
  const requests = [];
  const app = reader({ fetch: async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => requests.length === 1 ? { access_token: 'test-token' } : report };
  } });
  const data = await app.getArticleReadership();
  assert.equal(requests.length, 2);
  assert.match(requests[1].url, /properties\/489598217:runReport$/);
  const query = JSON.parse(requests[1].options.body);
  assert.equal(query.metrics[0].name, 'screenPageViews');
  assert.deepEqual(query.dimensionFilter.andGroup.expressions[0].filter.inListFilter.values, ['utekos.no', 'www.utekos.no']);
  assert.equal(data.rows.length, 6);
  assert.equal(app.lifetimes[0].revalidate, 86400);
});

test('missing credentials preserve the dated evidence without making a provider call', async () => {
  const app = reader({ configured: false });
  const data = await app.getArticleReadership();
  assert.equal(data.fetchedAt, snapshot.fetchedAt);
  assert.equal(data.endDate, snapshot.endDate);
});

test('provider failure retains the measured date range and logs failure without secrets', async () => {
  const app = reader({ fetch: async () => ({ ok: false }) });
  const data = await app.getArticleReadership();
  assert.equal(data.endDate, snapshot.endDate);
  assert.equal(app.logs.length, 1);
  assert.ok(!JSON.stringify(app.logs).includes('test-private-key'));
  assert.equal(app.lifetimes.at(-1).revalidate, 300);
});

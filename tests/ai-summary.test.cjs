/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');

const source = { kind: 'article', slug: 'test-artikkel', title: 'Test', content: 'Kildetekst. '.repeat(30) };
const summary = { summary: 'En oppsummering med tilstrekkelig lengde.', reviewSummary: '' };

const responseSummary = { reviews: null, content: summary };

function routeHarness({ resolvedSource = source, generated = summary, enabled = true, configured = true, summaryKey = false, fail = false, valid = true, finishReason = 'stop', cacheReadError = false, cacheWriteError = false, waitForAbort = false, rateLimit = 0 } = {}) {
  const cache = new Map();
  let calls = 0;
  let generationSignal;
  const route = loadTypeScript('app/api/ai-summary/route.ts', {
    env: { ...(enabled ? { NEXT_PUBLIC_AI_SUMMARY_ENABLED: 'true' } : {}), ...(summaryKey ? { AI_SUMMARY_GATEWAY_API_KEY: 'summary-test-only' } : configured ? { AI_GATEWAY_API_KEY: 'test-only' } : {}) },
    globals: { Request, Response, ReadableStream, Buffer, crypto, TextEncoderStream, AbortController,
      console: { info() {}, warn() {}, error() {} } },
    mocks: {
      '@/lib/ai-summary/source': { getSummarySource: async target => target.slug === source.slug ? resolvedSource : null },
      '@/lib/ai-summary/rateLimit': { summaryRateLimit: () => rateLimit },
      '@vercel/functions': { getCache: () => ({
        get: async key => { if (cacheReadError) throw new Error('Cache unavailable'); return cache.get(key) ?? null; },
        set: async (key, value) => { if (cacheWriteError) throw new Error('Cache unavailable'); cache.set(key, value); },
      }) },
      ai: {
        createGateway: ({ apiKey }) => model => { assert.equal(apiKey, 'summary-test-only'); return model; },
        Output: { object: value => value },
        streamText: ({ abortSignal }) => {
          calls += 1;
          generationSignal = abortSignal;
          return {
            stream: (async function* () {
              if (fail) yield { type: 'error', error: new Error('Provider unavailable') };
              else yield { type: 'text-delta', text: JSON.stringify(valid ? generated : { summary: 'short' }) };
              if (waitForAbort && !abortSignal.aborted) await new Promise(resolve => abortSignal.addEventListener('abort', resolve, { once: true }));
            })(),
            output: Promise.resolve(valid ? generated : { summary: 'short' }),
            finishReason: Promise.resolve(finishReason),
            totalUsage: Promise.resolve({ inputTokens: 10, outputTokens: 10 }),
          };
        },
        createTextStreamResponse: ({ stream, headers }) => new Response(stream.pipeThrough(new TextEncoderStream()), { headers }),
      },
    },
  });
  const request = (body = source, headers = {}) => route.POST(new Request('https://utekos.no/api/ai-summary', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify({ kind: body.kind, slug: body.slug }),
  }));
  return { request, cache, calls: () => calls, generationSignal: () => generationSignal };
}

test('rejects cross-origin, malformed, oversized and arbitrary source requests before generation', async () => {
  const app = routeHarness();
  assert.equal((await app.request(source, { Origin: 'https://other.example' })).status, 403);
  assert.equal((await app.request('{bad')).status, 400);
  assert.equal((await app.request('x'.repeat(513))).status, 413);
  assert.equal((await app.request({ kind: 'article', slug: '../private' })).status, 400);
  assert.equal((await app.request(JSON.stringify({ kind: 'article', slug: source.slug, content: 'Injected prompt' }))).status, 400);
  assert.equal((await app.request({ kind: 'article', slug: 'unpublished' })).status, 404);
  assert.equal(app.calls(), 0);
});

test('disabled summaries return 404 without any model call', async () => {
  const app = routeHarness({ enabled: false });
  assert.equal((await app.request()).status, 404);
  assert.equal(app.calls(), 0);
});

test('streams one generation, validates it, and serves the next activation from cache', async () => {
  const app = routeHarness();
  const first = await app.request();
  assert.equal(first.headers.get('X-AI-Summary-Cache'), 'MISS');
  assert.deepEqual(JSON.parse(await first.text()), responseSummary);
  const second = await app.request();
  assert.equal(second.headers.get('X-AI-Summary-Cache'), 'HIT');
  assert.deepEqual(await second.json(), responseSummary);
  assert.equal(app.calls(), 1);
  assert.equal(app.cache.size, 1);
});

test('provider errors, invalid output and truncated completions never populate cache', async () => {
  for (const options of [{ fail: true }, { valid: false }, { finishReason: 'length' }]) {
    const app = routeHarness(options);
    const response = await app.request();
    await assert.rejects(response.text(), /kunne ikke fullføres/);
    assert.equal(app.cache.size, 0);
  }
});

test('cancelling the response aborts the provider and never caches a partial result', async () => {
  const app = routeHarness({ waitForAbort: true });
  const response = await app.request();
  const reader = response.body.getReader();
  await reader.read();
  await reader.cancel();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.generationSignal().aborted, true);
  assert.equal(app.cache.size, 0);
});

test('cache read failures stop generation; write failures preserve a valid response', async () => {
  const unavailable = routeHarness({ cacheReadError: true });
  assert.equal((await unavailable.request()).status, 503);
  assert.equal(unavailable.calls(), 0);
  const unwritable = routeHarness({ cacheWriteError: true });
  assert.deepEqual(await (await unwritable.request()).json(), responseSummary);
  assert.equal(unwritable.cache.size, 0);
});

test('rate limited requests return Retry-After without a provider call', async () => {
  const app = routeHarness({ rateLimit: 60 });
  const response = await app.request();
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
  assert.equal(app.calls(), 0);
});

test('missing Gateway configuration returns 503 without a provider call', async () => {
  const app = routeHarness({ configured: false });
  assert.equal((await app.request()).status, 503);
  assert.equal(app.calls(), 0);
});

test('a dedicated summary key works without a shared key or OIDC fallback', async () => {
  const app = routeHarness({ configured: false, summaryKey: true });
  assert.deepEqual(await (await app.request()).json(), responseSummary);
  assert.equal(app.calls(), 1);
});

test('source text, model and source identity participate in the cache key', () => {
  const { summaryCacheKey } = loadTypeScript('lib/ai-summary/prompt.ts');
  const original = summaryCacheKey(source, 'test/model');
  assert.equal(summaryCacheKey({ ...source }, 'test/model'), original);
  for (const updated of [{ ...source, content: source.content + 'Ny tekst' }, { ...source, slug: 'annen-artikkel' }, { ...source, kind: 'product' }]) {
    assert.notEqual(summaryCacheKey(updated, 'test/model'), original);
  }
  assert.notEqual(summaryCacheKey(source, 'test/new-model'), original);
  assert.notEqual(summaryCacheKey({ ...source, reviews: { count: 1, average: 4, items: [] } }, 'test/model'), original);
});

test('compact responses enforce both word limits and reject unsupported customer claims', () => {
  const { validateSummary } = loadTypeScript('lib/ai-summary/schema.ts');
  assert.equal(validateSummary(summary, source), summary);
  assert.throws(() => validateSummary({ ...summary, summary: 'ord '.repeat(36).trim() }, source), /word limit/);
  assert.throws(() => validateSummary({ ...summary, reviewSummary: 'ord '.repeat(21).trim() }, source), /word limit/);
  for (const reviews of [null, { average: 0, count: 0, items: [] }, { average: 5, count: 1, items: [{ rating: 5, title: '', body: '' }] }]) {
    assert.throws(() => validateSummary({ ...summary, reviewSummary: 'Kundene liker produktet.' }, { ...source, reviews }), /unsupported review/);
  }
});

test('product reviews keep live aggregates, criticism and bounded text without reviewer metadata', () => {
  const { buildProductSummarySource } = loadTypeScript('lib/ai-summary/productSource.ts', {
    mocks: { '@/lib/products/content': { getProductPageDescriptionText: () => 'Beskrivelse', getProductPageContent: () => null } },
  });
  const review = { id: 'private-id', author: 'Private name', date: '2026-11-01', verified: true, rating: 2, title: 'Trang passform', body: 'Passformen var for trang.' };
  const result = buildProductSummarySource({ handle: 'produkt', title: 'Produkt', description: '' }, { average: 4.3, count: 57, reviews: Array.from({ length: 45 }, () => review) });
  assert.equal(result.reviews.average, 4.3);
  assert.equal(result.reviews.count, 57);
  assert.equal(result.reviews.items.length, 40);
  assert.equal(result.reviews.items[0].rating, 2);
  assert.match(JSON.stringify(result.reviews), /Trang passform/);
  assert.doesNotMatch(JSON.stringify(result.reviews), /Private name|private-id|verified|2026-11-01/);
});

test('product responses stream source ratings and retain them on cache hits', async () => {
  const resolvedSource = { ...source, kind: 'product', reviews: { average: 4.3, count: 7, items: [{ rating: 2, title: 'Passform', body: 'For trang.' }] } };
  const generated = { ...summary, reviewSummary: 'En kunde nevner trang passform.' };
  const app = routeHarness({ resolvedSource, generated });
  const first = await app.request();
  const result = await first.json();
  assert.deepEqual(result, { reviews: { average: 4.3, count: 7, includedCount: 1 }, content: generated });
  assert.deepEqual(await (await app.request()).json(), result);
  assert.equal(app.calls(), 1);
  const missing = routeHarness({ resolvedSource });
  await assert.rejects((await missing.request()).text(), /kunne ikke fullføres/);
  assert.equal(missing.cache.size, 0);
});

test('rate limit resets after its window and bounds distinct clients', () => {
  const { summaryRateLimit } = loadTypeScript('lib/ai-summary/rateLimit.ts');
  for (let i = 0; i < 10; i += 1) assert.equal(summaryRateLimit('client', 0), 0);
  assert.equal(summaryRateLimit('client', 500), 60);
  assert.equal(summaryRateLimit('client', 60_000), 0);
  for (let i = 0; i < 999; i += 1) assert.equal(summaryRateLimit(String(i), 60_000), 0);
  assert.equal(summaryRateLimit('overflow', 60_000), 60);
});

test('product source follows the displayed local copy and omits commerce fields', () => {
  const { buildProductSummarySource } = loadTypeScript('lib/ai-summary/productSource.ts', {
    mocks: { '@/lib/products/content': {
      getProductPageDescriptionText: () => 'Lokal produktbeskrivelse',
      getProductPageContent: () => ({ accordion: [{ title: 'Materialer', groups: [{ rows: [{ label: 'Ytterstoff', value: 'Nylon' }], note: { title: 'Forbehold', text: 'Må ikke brukes nær åpen ild.' } }] }] }),
    } },
  });
  const result = buildProductSummarySource({ handle: 'produkt', title: 'Produkt™', description: 'Utdatert Shopify-tekst', price: '999', inventory: 100 });
  assert.match(result.content, /Lokal produktbeskrivelse/);
  assert.match(result.content, /Ytterstoff: Nylon/);
  assert.match(result.content, /Må ikke brukes nær åpen ild/);
  assert.doesNotMatch(JSON.stringify(result), /Utdatert|999|inventory/);
});

test('source resolution rejects unregistered articles and unpublished product handles', async () => {
  let productCalls = 0;
  const { getSummarySource } = loadTypeScript('lib/ai-summary/source.ts', {
    mocks: {
      '@/lib/products/judgeme': { getJudgeMeReviews() { throw new Error('Unexpected review request'); } },
      '@/lib/shopify/getProductHandles': { getProductHandles: async () => ['published'] },
      '@/lib/shopify/getProduct': { getProduct: async () => { productCalls++; return null; } },
      '@/lib/knowledge/knowledgeArticles': { knowledgeArticleList: [{ slug: 'registered', title: 'Tittel', description: 'Ingress' }] },
      './articleSources.generated.json': { default: { registered: 'Artikkeltekst', unregistered: 'Skal ikke vises' } },
      './productSource': { buildProductSummarySource() { throw new Error('Unexpected product'); } },
    },
  });
  assert.equal(await getSummarySource({ kind: 'article', slug: 'unregistered' }), null);
  assert.equal(await getSummarySource({ kind: 'product', slug: 'unpublished' }), null);
  assert.equal(productCalls, 0);
  const article = await getSummarySource({ kind: 'article', slug: 'registered' });
  assert.equal(article.content, 'Ingress\n\nArtikkeltekst');
});

test('MDX extraction preserves caveats and never evaluates imports, expressions or comments', async () => {
  const { createProcessor } = await import('@mdx-js/mdx');
  const { extractArticleText } = await import('../scripts/build-ai-summary-sources.mjs');
  const raw = 'import Secret from "secret";\n\n# Overskrift\n\nFaktisk tekst med **viktig forbehold**.\n\n{/* privat kommentar */}\n\n<KnowledgeCallout title="Begrensning">Ikke målt på hele plagget.</KnowledgeCallout>\n\n{process.env.SECRET}\n\n<PageAiSummary target={{kind: "article", slug: "test"}} />';
  const text = extractArticleText(createProcessor().parse(raw));
  assert.match(text, /viktig forbehold/);
  assert.match(text, /Begrensning/);
  assert.match(text, /Ikke målt på hele plagget/);
  assert.doesNotMatch(text, /Secret|privat|process.env|PageAiSummary/);
});

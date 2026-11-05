/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');

const source = { kind: 'article', slug: 'test-artikkel', title: 'Test', content: 'Kildetekst. '.repeat(30) };
const summary = { summary: 'En oppsummering med tilstrekkelig lengde.', reviewSummary: '' };
const articleSummary = {
  scope: 'Artikkelen forklarer hvordan lagvis bekledning hjelper deg å holde varmen ute, med vekt på fukt, isolasjon og beskyttelse mot været.',
  learning: 'Du lærer å velge et innerlag som flytter fukt, et mellomlag som holder på luft og et ytterlag som skjermer mot vind. Du får også råd om å justere lagene når aktivitet og temperatur endrer seg.',
  points: [
    { text: 'Begynn med et innerlag som passer aktiviteten. Fukt nær kroppen kan gjøre deg kald når du stopper, selv om du var varm mens du gikk.', details: ['Juster bekledningen før du blir svett, og ha et tørt plagg tilgjengelig til pausen.'] },
    { text: 'Velg isolasjon etter hvor mye du beveger deg og hvor lenge du skal sitte stille. Flere lag gir fleksibilitet når forholdene skifter.', details: ['Unngå at lagene sitter så stramt at de presser sammen luftlaget som bidrar til å holde på varmen.'] },
    { text: 'Bruk ytterlaget til å skjerme mot vind og nedbør. Åpne for lufting ved behov, og vurder hele antrekket fremfor ett enkelt materiale.', details: [] },
  ],
};
const shortDraft = { ...articleSummary, scope: 'UTKAST SKAL IKKE VISES. Dette er for kort.' };
const withoutDetails = { ...articleSummary, points: articleSummary.points.map(point => ({ text: [point.text, ...point.details].join(' '), details: [] })) };

const responseSummary = { reviews: null, content: articleSummary };

function routeHarness({ resolvedSource = source, generated = resolvedSource.kind === 'article' ? articleSummary : summary, generatedDrafts = [generated], enabled = true, configured = true, summaryKey = false, fail = false, valid = true, finishReason = 'stop', cacheReadError = false, cacheWriteError = false, waitForAbort = false, waitForAbortAtCall = waitForAbort ? 1 : 0, rateLimit = 0 } = {}) {
  const cache = new Map();
  const cacheWrites = [];
  const prompts = [];
  const schemas = [];
  const callWaiters = [];
  let calls = 0;
  let sourceCalls = 0;
  let generationSignal;
  const route = loadTypeScript('app/api/ai-summary/route.ts', {
    env: { ...(enabled ? { NEXT_PUBLIC_AI_SUMMARY_ENABLED: 'true' } : {}), ...(summaryKey ? { AI_SUMMARY_GATEWAY_API_KEY: 'summary-test-only' } : configured ? { AI_GATEWAY_API_KEY: 'test-only' } : {}) },
    globals: { Request, Response, ReadableStream, Buffer, crypto, TextEncoderStream, AbortController,
      console: { info() {}, warn() {}, error() {} } },
    mocks: {
      '@/lib/ai-summary/source': { getSummarySource: async target => { sourceCalls++; return target.slug === source.slug ? resolvedSource : null; } },
      '@/lib/ai-summary/rateLimit': { summaryRateLimit: () => rateLimit },
      '@vercel/functions': { getCache: () => ({
        get: async key => { if (cacheReadError) throw new Error('Cache unavailable'); return cache.get(key) ?? null; },
        set: async (key, value, options) => { if (cacheWriteError) throw new Error('Cache unavailable'); cache.set(key, value); cacheWrites.push({ key, value, options }); },
      }) },
      ai: {
        createGateway: ({ apiKey }) => model => { assert.equal(apiKey, 'summary-test-only'); return model; },
        Output: { object: value => value },
        streamText: ({ abortSignal, providerOptions, reasoning, prompt, output }) => {
          assert.equal(reasoning, undefined);
          assert.equal(providerOptions.google.thinkingConfig.thinkingLevel, 'low');
          assert.equal(providerOptions.vertex.thinkingConfig.thinkingLevel, 'low');
          calls += 1;
          const call = calls;
          const draft = valid ? generatedDrafts[Math.min(call - 1, generatedDrafts.length - 1)] : { summary: 'short' };
          prompts.push(prompt);
          schemas.push(output.schema);
          generationSignal = abortSignal;
          for (const waiter of callWaiters) if (call >= waiter.call) waiter.resolve();
          return {
            stream: (async function* () {
              if (fail) yield { type: 'error', error: new Error('Provider unavailable') };
              else yield { type: 'text-delta', text: JSON.stringify(draft) };
              if (call === waitForAbortAtCall && !abortSignal.aborted) await new Promise(resolve => abortSignal.addEventListener('abort', resolve, { once: true }));
            })(),
            output: Promise.resolve(draft),
            finishReason: Promise.resolve(finishReason),
            totalUsage: Promise.resolve({ inputTokens: 10, outputTokens: 10 }),
          };
        },
        createTextStreamResponse: ({ stream, headers }) => new Response(stream.pipeThrough(new TextEncoderStream()), { headers }),
      },
    },
  });
  const request = (body = resolvedSource, headers = {}) => route.POST(new Request('https://utekos.no/api/ai-summary', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify({ kind: body.kind, slug: body.slug }),
  }));
  return { request, cache, cacheWrites, prompts, schemas, calls: () => calls, sourceCalls: () => sourceCalls, generationSignal: () => generationSignal,
    waitForCall: call => calls >= call ? Promise.resolve() : new Promise(resolve => callWaiters.push({ call, resolve })),
  };
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
  assert.equal(app.cacheWrites[0].options.ttl, 86400);
});

test('article repair exposes only the validated result and caches it for the next reader', async () => {
  const app = routeHarness({ generatedDrafts: [shortDraft, { replacement: articleSummary.scope }] });
  const first = await app.request();
  const text = await first.text();
  assert.deepEqual(JSON.parse(text), responseSummary);
  assert.doesNotMatch(text, /UTKAST SKAL IKKE VISES/);
  assert.equal(app.calls(), 2);
  assert.match(app.prompts[1], /Skriv BARE en ny tekst til scope i feltet replacement/);
  assert.equal(app.schemas[1].safeParse(articleSummary).success, false);
  assert.equal(app.schemas[1].safeParse({ replacement: articleSummary.scope }).success, true);
  assert.deepEqual(Object.keys(app.schemas[1].shape), ['replacement']);
  assert.equal(JSON.parse(text).content.learning, shortDraft.learning);
  assert.deepEqual(JSON.parse(text).content.points, shortDraft.points);
  assert.equal(app.cacheWrites.length, 1);
  assert.equal(app.cacheWrites[0].options.ttl, 86400);
  const second = await app.request();
  assert.equal(second.headers.get('X-AI-Summary-Cache'), 'HIT');
  assert.equal(await second.text(), text);
  assert.equal(app.calls(), 2);
});

test('missing nested points require a full article repair instead of a single-field patch', async () => {
  const app = routeHarness({ generatedDrafts: [withoutDetails, articleSummary] });
  const response = await app.request();
  assert.deepEqual(await response.json(), responseSummary);
  assert.equal(app.calls(), 2);
  assert.match(app.prompts[1], /Minst ett hovedpunkt må ha et underpunkt/);
  assert.equal(app.schemas[1].safeParse(articleSummary).success, true);
  assert.equal(app.schemas[1].safeParse({ replacement: articleSummary.scope }).success, false);
  assert.equal(app.cacheWrites.length, 1);
});

test('three invalid article drafts fail without caching or exposing a draft', async () => {
  const app = routeHarness({ generatedDrafts: [shortDraft, { replacement: shortDraft.scope }] });
  const response = await app.request();
  const reader = response.body.getReader();
  const chunks = [];
  await assert.rejects(async () => {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;
      chunks.push(Buffer.from(value));
    }
  }, /kunne ikke fullføres/);
  assert.doesNotMatch(Buffer.concat(chunks).toString(), /UTKAST SKAL IKKE VISES/);
  assert.equal(app.calls(), 3);
  assert.equal(app.cache.size, 0);
});

test('cancelling during article repair aborts the active call and prevents a third attempt', async () => {
  const app = routeHarness({ generatedDrafts: [shortDraft, { replacement: shortDraft.scope }, { replacement: articleSummary.scope }], waitForAbortAtCall: 2 });
  const response = await app.request();
  const reader = response.body.getReader();
  await reader.read();
  await app.waitForCall(2);
  await reader.cancel();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.generationSignal().aborted, true);
  assert.equal(app.calls(), 2);
  assert.equal(app.cache.size, 0);
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
  const product = { ...source, kind: 'product' };
  assert.equal(validateSummary(summary, product), summary);
  assert.throws(() => validateSummary({ ...summary, summary: 'ord '.repeat(36).trim() }, product), /word limit/);
  assert.throws(() => validateSummary({ ...summary, reviewSummary: 'ord '.repeat(21).trim() }, product), /word limit/);
  for (const reviews of [null, { average: 0, count: 0, items: [] }, { average: 5, count: 1, items: [{ rating: 5, title: '', body: '' }] }]) {
    assert.throws(() => validateSummary({ ...summary, reviewSummary: 'Kundene liker produktet.' }, { ...product, reviews }), /unsupported review/);
  }
});

// Known section sizes, including the literal headings and block separators.
function articleWithSectionLengths(scope, learning, points) {
  return {
    scope: 'a'.repeat(scope - 7),
    learning: 'b'.repeat(learning - 14),
    points: [
      { text: 'c'.repeat(150), details: ['d'.repeat(100)] },
      { text: 'e'.repeat(150), details: [] },
      { text: 'f'.repeat(points - 432), details: [] },
    ],
  };
}

test('article length includes headings and spaces and accepts exactly 950–1000 characters', () => {
  const { articleSummaryMetrics, validateSummary } = loadTypeScript('lib/ai-summary/schema.ts');
  assert.equal(articleSummaryMetrics(articleSummary).total, 956);
  for (const total of [949, 950, 1000, 1001]) {
    const article = articleWithSectionLengths(150, 200, total - 352);
    assert.equal(articleSummaryMetrics(article).total, total);
    if (total >= 950 && total <= 1000) assert.doesNotThrow(() => validateSummary(article, source));
    else assert.throws(() => validateSummary(article, source), /950–1000/);
  }
});

test('article counting normalizes Norwegian characters and visible whitespace', () => {
  const { articleSummaryMetrics } = loadTypeScript('lib/ai-summary/schema.ts');
  const equivalent = { ...articleSummary, scope: `  ${articleSummary.scope.replace('å', 'a\u030a').replace(' ', '\n\t  ')}  ` };
  assert.equal(articleSummaryMetrics(equivalent).total, 956);
  assert.equal(articleSummaryMetrics({ ...articleSummary, scope: articleSummary.scope.replace('A', '🌲') }).total, 956);
});

test('article proportions allow five percentage points either side of 15/20/65', () => {
  const { validateSummary } = loadTypeScript('lib/ai-summary/schema.ts');
  const boundaries = [
    [100, 220, 678], [200, 170, 628],
    [170, 150, 678], [110, 250, 638],
    [180, 218, 600], [130, 168, 700],
  ];
  for (const lengths of boundaries) assert.doesNotThrow(() => validateSummary(articleWithSectionLengths(...lengths), source), lengths.join('/'));
  const outside = [
    [99, 221, 678], [201, 169, 628],
    [171, 149, 678], [109, 251, 638],
    [181, 218, 599], [129, 168, 701],
  ];
  for (const lengths of outside) assert.throws(() => validateSummary(articleWithSectionLengths(...lengths), source), /utgjør/, lengths.join('/'));
});

test('articles require nested points and cannot use the compact product schema', () => {
  const { articleSummarySchema, validateSummary } = loadTypeScript('lib/ai-summary/schema.ts');
  assert.throws(() => validateSummary(withoutDetails, source), /underpunkt/);
  assert.throws(() => validateSummary(summary, source));
  assert.throws(() => validateSummary(articleSummary, { ...source, kind: 'product' }), /Invalid product/);
  assert.equal(articleSummarySchema.safeParse({ ...articleSummary, points: articleSummary.points.slice(0, 2) }).success, false);
  assert.equal(articleSummarySchema.safeParse({ ...articleSummary, scope: '' }).success, false);
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
  assert.equal(app.sourceCalls(), 1);
  const missing = routeHarness({ resolvedSource });
  await assert.rejects((await missing.request()).text(), /kunne ikke fullføres/);
  assert.equal(missing.cache.size, 1); // Only the validated source, never the invalid summary.
});

test('unavailable product reviews fail without generating or caching a misleading summary', async () => {
  const app = routeHarness({ resolvedSource: { ...source, kind: 'product', reviews: null } });
  assert.equal((await app.request()).status, 503);
  assert.equal(app.calls(), 0);
  assert.equal(app.cache.size, 0);
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
      '@/lib/products/judgeme': { getJudgeMePreview() { throw new Error('Unexpected review request'); } },
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

/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

async function loadChatRoute(entry, options) {
  const persistence = await import('@tanstack/ai-persistence');
  const store = persistence.memoryPersistence();
  const helpers = loadTypeScript('lib/chat/persistence.ts', { globals: { Request, Response } });
  return loadTypeScript(entry, {
    ...options,
    mocks: {
      '@tanstack/ai-persistence': persistence,
      '@/lib/chat/persistence': {
        ...helpers,
        createChatPersistence: () => ({ stores: { messages: store.stores.messages } }),
      },
      ...options.mocks,
    },
  });
}

test('weather middleware forces the first call only and preserves other model options', async () => {
  const { weatherFirst } = loadTypeScript('assets/components/chat/weatherFirst.ts');
  const config = { messages: [], systemPrompts: [], tools: [], modelOptions: { store: false, max_output_tokens: 200 } };
  assert.equal(await weatherFirst.onConfig({ phase: 'init', iteration: 0 }, config), undefined);
  const first = await weatherFirst.onConfig({ phase: 'beforeModel', iteration: 0 }, config);
  assert.equal(first.modelOptions.tool_choice.type, 'function');
  assert.equal(first.modelOptions.tool_choice.name, 'get_weather');
  assert.equal(first.modelOptions.store, false);
  assert.equal(first.modelOptions.max_output_tokens, 200);
  const second = await weatherFirst.onConfig({ phase: 'beforeModel', iteration: 1 }, { ...config, ...first });
  assert.equal(second.modelOptions.tool_choice, 'auto');
  assert.equal(second.modelOptions.max_output_tokens, 200);
  assert.equal(config.modelOptions.tool_choice, undefined);
  assert.equal(await weatherFirst.onConfig({ phase: 'structuredOutput', iteration: 1 }, config), undefined);
});

async function loadServerTools(getSearchIndex) {
  const ai = await import('@tanstack/ai');
  return loadTypeScript('assets/components/chat/serverToolDefinition.ts', {
    mocks: {
      '@tanstack/ai': ai,
      '@tanstack/ai/client': ai,
      '@/lib/search/getSearchIndex': { getSearchIndex },
    },
  });
}

test('product tool filters real index data, excludes pages, limits results and propagates outages', async () => {
  const { searchProducts } = await loadServerTools(async () => ({ groups: [
    { label: 'Produkter', items: [
      { title: 'Fixture varme A', href: '/produkter/a', keywords: [] },
      { title: 'Fixture varme B', href: '/produkter/b', keywords: [] },
      { title: 'Fixture annet', href: '/produkter/c', keywords: [] },
    ] },
    { label: 'Sider', items: [{ title: 'Fixture varme guide', href: '/guide', keywords: [] }] },
  ] }));
  const input = searchProducts.inputSchema.parse({ query: ' VARME ', limit: 1 });
  const result = await searchProducts.execute(input);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].href, '/produkter/a');
  assert.equal(searchProducts.inputSchema.safeParse({ query: ' ' }).success, false);
  assert.equal(searchProducts.inputSchema.safeParse({ query: 'varme', limit: -1 }).success, false);
  assert.equal(searchProducts.inputSchema.parse({ query: 'varme' }).limit, 10);
  const broken = await loadServerTools(async () => { throw new Error('catalog unavailable'); });
  await assert.rejects(broken.searchProducts.execute(input), /catalog unavailable/);
});

test('user tool retains email validation and requires a supplied authorized lookup', async () => {
  const { getUserDataDef, createGetUserDataTool } = await loadServerTools(async () => ({ groups: [] }));
  const output = { name: 'Test', email: 'test@example.com', createdAt: '2026-01-01T00:00:00.000Z' };
  assert.equal(getUserDataDef.outputSchema.safeParse(output).success, true);
  assert.equal(getUserDataDef.outputSchema.safeParse({ ...output, email: 'invalid' }).success, false);
  const tool = createGetUserDataTool(async () => null);
  await assert.rejects(tool.execute({ userId: 'fixture' }), /User not found/);
});

function chatRequest(overrides = {}) {
  return new Request('https://utekos.test/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threadId: 'fixture-thread', runId: 'fixture-run', messages: [], tools: [], context: [], state: null, ...overrides }),
  });
}

for (const route of ['chat', 'search-products']) {
  test(`${route} rejects invalid requests and missing configuration without calling a provider`, async () => {
    const ai = await import('@tanstack/ai');
    const { POST } = await loadChatRoute(`app/api/${route}/route.ts`, {
      globals: { Request, Response, AbortController },
      mocks: {
        '@tanstack/ai': { ...ai, chat: () => assert.fail('provider must not be called') },
        '@tanstack/ai-openai': { openaiText: () => assert.fail('adapter must not be created') },
        '@/assets/components/chat/serverToolDefinition': { searchProducts: { name: 'search_products' } },
      },
    });
    assert.equal((await POST(chatRequest({ messages: 'invalid' }))).status, 400);
    assert.equal((await POST(new Request('https://utekos.test', { method: 'POST', body: '{' }))).status, 400);
    assert.equal((await POST(chatRequest())).status, 503);
  });

  test(`${route} forwards AG-UI identities and a cancellable stream`, async () => {
    const ai = await import('@tanstack/ai');
    let captured;
    const { POST } = await loadChatRoute(`app/api/${route}/route.ts`, {
      globals: { Request, Response, AbortController },
      env: { OPENAI_API_KEY: 'fixture-not-a-key' },
      mocks: {
        '@tanstack/ai': {
          ...ai,
          chat: options => { captured = options; return 'fixture-stream'; },
          toServerSentEventsResponse: (stream, options) => {
            assert.equal(stream, 'fixture-stream');
            assert.equal(options.abortController, captured.abortController);
            return new Response('fixture');
          },
        },
        '@tanstack/ai-openai': { openaiText: () => ({}) },
        '@/assets/components/chat/serverToolDefinition': { searchProducts: { name: 'search_products' } },
      },
    });
    assert.equal((await POST(chatRequest())).status, 200);
    assert.equal(captured.threadId, 'fixture-thread');
    assert.equal(captured.runId, 'fixture-run');
    assert.equal(captured.tools[0].name, 'search_products');
    assert.equal(captured.tools.some(tool => tool.name === 'get_user_data'), false);
    assert.equal(captured.abortController.signal.aborted, false);
  });
}

test('chat sends native cache options through the real OpenAI adapter', async () => {
  const ai = await import('@tanstack/ai');
  const { createOpenaiChat } = await import('@tanstack/ai-openai');
  let body;
  const { POST } = await loadChatRoute('app/api/chat/route.ts', {
    globals: { Request, Response, AbortController },
    env: { OPENAI_API_KEY: 'fixture-not-a-key' },
    mocks: {
      '@tanstack/ai': ai,
      '@tanstack/ai-openai': {
        openaiText: model => createOpenaiChat(model, 'fixture-not-a-key', {
          maxRetries: 0,
          fetch: async (input, init) => {
            body = await new Request(input, init).json();
            return new Response(`data: ${JSON.stringify({
              type: 'response.completed',
              response: { id: 'fixture-response', status: 'completed', output: [], usage: { input_tokens: 1, output_tokens: 0, total_tokens: 1 } },
            })}\n\n`, { headers: { 'Content-Type': 'text/event-stream' } });
          },
        }),
      },
      '@/assets/components/chat/serverToolDefinition': {
        searchProducts: ai.toolDefinition({ name: 'search_products', description: 'Fixture search' }).server(async () => ({ results: [] })),
      },
    },
  });
  const response = await POST(chatRequest({ messages: [{ id: 'fixture-user', role: 'user', content: 'Hei' }] }));
  const events = await response.text();
  assert.equal(response.status, 200);
  assert.equal(body.model, 'gpt-6.1-sol');
  assert.equal(body.prompt_cache_key, 'acme-support');
  assert.equal(Object.hasOwn(body, 'promptCache'), false);
  assert.equal(Object.hasOwn(body, 'prompt_cache_retention'), false);
  assert.match(events, /RUN_FINISHED/);
  assert.doesNotMatch(events, /RUN_ERROR/);
});

test('file operations are explicit and use lifecycle ids, while message sources use wire URIs', async () => {
  const ai = await import('@tanstack/ai');
  const { createFilesAPI } = loadTypeScript('assets/components/chat/config/filesAPI.ts', {
    mocks: {
      '@tanstack/ai': ai,
      '@tanstack/ai-openai': {
        openaiFiles: () => assert.fail('import must not initialize a provider'),
        createOpenaiFiles: () => assert.fail('import must not initialize a provider'),
      },
    },
  });
  const calls = [];
  const handle = { provider: 'fixture', id: 'fixture-id', uri: 'https://files.test/fixture', mimeType: 'image/png' };
  const files = createFilesAPI({
    name: 'fixture', kind: 'files',
    upload: async input => { calls.push(['upload', input.mimeType]); return handle; },
    get: async id => { calls.push(['get', id]); return handle; },
    delete: async id => { calls.push(['delete', id]); },
  });
  assert.deepEqual(calls, []);
  const uploaded = await files.upload({ data: 'fixture', mimeType: 'image/png' });
  assert.equal((await files.get(uploaded)).id, 'fixture-id');
  assert.equal(files.source(uploaded).value, 'https://files.test/fixture');
  await files.delete(uploaded);
  assert.deepEqual(calls, [['upload', 'image/png'], ['get', 'fixture-id'], ['delete', 'fixture-id']]);
});

test('MCP chat connects only when consumed and closes on early cancellation', async () => {
  const calls = [];
  const { createMcpChatStream } = loadTypeScript('assets/components/chat/createMCPClient.ts', {
    mocks: {
      '@tanstack/ai': { chat: async function* () { yield { type: 'RUN_STARTED' }; yield { type: 'RUN_FINISHED' }; } },
      '@tanstack/ai-openai': { openaiText: () => ({}) },
      '@tanstack/ai-mcp': { createMCPClient: async () => {
        calls.push('connect');
        return { close: async () => { calls.push('close'); } };
      } },
    },
  });
  const stream = createMcpChatStream({ url: 'https://mcp.test', messages: [] });
  assert.deepEqual(calls, []);
  assert.equal((await stream.next()).value.type, 'RUN_STARTED');
  await stream.return();
  assert.deepEqual(calls, ['connect', 'close']);
});

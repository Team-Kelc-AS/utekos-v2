/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const env = { CHAT_SUPABASE_URL: 'https://database.test', CHAT_SUPABASE_PUBLISHABLE_KEY: 'fixture-public-key' };
const globals = { Request, Response };
const ownerA = 'a'.repeat(64), ownerB = 'b'.repeat(64);
const messages = [
  { id: 'user-fixture', role: 'user', content: 'Synthetic question' },
  { id: 'assistant-fixture', role: 'assistant', content: 'Synthetic answer' },
];

function databaseFixture() {
  const rows = new Map();
  const calls = [];
  const fetch = async (url, init) => {
    assert.equal(url.toString(), 'https://database.test/rest/v1/rpc/chat_transcript');
    assert.equal(init.cache, 'no-store');
    assert.equal(init.redirect, 'error');
    const body = JSON.parse(init.body);
    const owner = init.headers['x-utekos-chat-session'];
    const key = `${owner}:${body.p_thread_id}`;
    calls.push(body);
    const existing = rows.get(key) ?? { messages: [], version: 0 };
    if (body.p_messages !== undefined) {
      if (body.p_expected_version !== existing.version) return Response.json({}, { status: 409 });
      rows.set(key, { messages: body.p_messages, version: existing.version + 1 });
    }
    return Response.json(rows.get(key) ?? existing);
  };
  return { fetch, calls };
}

test('chat session uses an opaque host-only HttpOnly cookie and rejects cross-origin access', () => {
  const { chatSession, isSameOriginChatRequest } = loadTypeScript('lib/chat/persistence.ts', { globals });
  const first = chatSession(new Request('https://utekos.test/api/chat'));
  assert.match(first.token, /^[a-f0-9]{64}$/);
  assert.match(first.headers['Set-Cookie'], /^__Host-utekos_chat=/);
  assert.match(first.headers['Set-Cookie'], /Path=\/; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure$/);
  assert.equal(first.headers['Cache-Control'], 'private, no-store');
  const next = chatSession(new Request('https://utekos.test/api/chat', { headers: { cookie: first.headers['Set-Cookie'].split(';')[0] } }));
  assert.equal(next.token, first.token);
  const forged = chatSession(new Request('https://utekos.test/api/chat', { headers: { cookie: '__Host-utekos_chat=not-a-session' } }));
  assert.notEqual(forged.token, 'not-a-session');
  assert.equal(isSameOriginChatRequest(new Request('https://utekos.test/api/chat', { headers: { origin: 'https://foreign.test' } })), false);
  assert.equal(isSameOriginChatRequest(new Request('https://utekos.test/api/chat', { headers: { 'sec-fetch-site': 'cross-site' } })), false);
});

test('Supabase transcript store isolates identical thread ids and rejects stale full replacements', async () => {
  const database = databaseFixture();
  const { createChatPersistence } = loadTypeScript('lib/chat/persistence.ts', { env, globals, fetch: database.fetch });
  const first = createChatPersistence(ownerA).stores.messages;
  const stale = createChatPersistence(ownerA).stores.messages;
  const otherVisitor = createChatPersistence(ownerB).stores.messages;
  await first.loadThread('support-chat');
  await stale.loadThread('support-chat');
  await first.saveThread('support-chat', messages);
  assert.deepEqual(await otherVisitor.loadThread('support-chat'), []);
  await assert.rejects(stale.saveThread('support-chat', []), error => error.status === 409);
  assert.deepEqual(await first.loadThread('support-chat'), messages);
  await first.saveThread('support-chat', [messages[0]]);
  assert.deepEqual(await first.loadThread('support-chat'), [messages[0]]);
  await assert.rejects(first.loadThread(''), error => error.status === 400);
});

test('GET reconstructs server history for only the cookie owner, with no shared caching', async () => {
  const database = databaseFixture();
  const persistence = await import('@tanstack/ai-persistence');
  const { createChatPersistence } = loadTypeScript('lib/chat/persistence.ts', { env, globals, fetch: database.fetch });
  await createChatPersistence(ownerA).stores.messages.saveThread('support-chat', messages);
  const { loadChatHistory } = loadTypeScript('lib/chat/history.ts', {
    env, globals, fetch: database.fetch, mocks: { '@tanstack/ai-persistence': persistence },
  });
  const response = await loadChatHistory(new Request('https://utekos.test/api/chat?threadId=support-chat', {
    headers: { cookie: `__Host-utekos_chat=${ownerA}` },
  }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const hydrated = await response.json();
  assert.equal(hydrated.messages[1].id, 'assistant-fixture');
  assert.equal(hydrated.messages[1].parts[0].content, 'Synthetic answer');
  assert.equal(hydrated.activeRun, null);
  const other = await loadChatHistory(new Request('https://utekos.test/api/chat?threadId=support-chat', {
    headers: { cookie: `__Host-utekos_chat=${ownerB}` },
  }));
  assert.deepEqual((await other.json()).messages, []);
  assert.equal((await loadChatHistory(new Request('https://utekos.test/api/chat'))).status, 400);
  assert.equal((await loadChatHistory(new Request('https://utekos.test/api/chat?offset=-1&runId=fixture'))).status, 410);
  assert.equal((await loadChatHistory(new Request('https://utekos.test/api/chat?threadId=support-chat', {
    headers: { origin: 'https://foreign.test' },
  }))).status, 403);
});

test('storage outages fail closed and never expose the provider response', async () => {
  const { createChatPersistence, chatStorageResponse } = loadTypeScript('lib/chat/persistence.ts', {
    env, globals, fetch: async () => Response.json({ privateDetail: 'do-not-return-this' }, { status: 500 }),
  });
  let caught;
  try { await createChatPersistence(ownerA).stores.messages.loadThread('support-chat'); } catch (error) { caught = error; }
  assert.equal(caught.status, 503);
  const response = chatStorageResponse(caught);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /do-not-return-this/);
});

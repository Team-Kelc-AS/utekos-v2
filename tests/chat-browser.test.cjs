/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require('esbuild');
const { chromium, expect } = require('playwright/test');

let browser;
let script;
test.before(async () => {
  const result = await esbuild.build({
    stdin: {
      resolveDir: path.resolve(__dirname, '..'), loader: 'tsx',
      contents: `import {createRoot} from 'react-dom/client';
        import {ProductPageChat} from './src/assets/components/chat/ProductPageChat';
        import {ChatScreen} from './src/assets/components/chat/ChatScreen';
        import {Chat} from './src/assets/components/chat/Chat';
        import {TanStackAiHelper} from './src/assets/components/chat/TanStackAiHelper';
        createRoot(document.getElementById('root')).render(window.fixture === 'product' ? <ProductPageChat /> : window.fixture === 'chat' ? <Chat /> : window.fixture === 'demo' ? <TanStackAiHelper /> : <ChatScreen />);`,
    },
    bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  script = result.outputFiles[0].text;
  browser = await chromium.launch();
});
test.after(async () => { await browser?.close(); });

async function fixture(t, kind, width, status = 200) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
  t.after(() => context.close());
  const errors = [], unexpected = [], requests = [], hydrations = [];
  const transcripts = new Map();
  t.after(() => { assert.deepEqual(errors, []); assert.deepEqual(unexpected, []); });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === 'https://utekos.test' && request.isNavigationRequest()) {
      return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Chat fixture</title><div id="root"></div>' });
    }
    if (url.origin === 'https://utekos.test' && url.pathname === '/api/chat') {
      if (request.method() === 'GET') {
        hydrations.push(url.searchParams.get('threadId'));
        return route.fulfill({ json: {
          messages: transcripts.get(url.searchParams.get('threadId')) ?? [], activeRun: null, interrupts: null,
        } });
      }
      const input = request.postDataJSON();
      requests.push(input);
      if (status !== 200) return route.fulfill({ status, json: { error: 'Fixture unavailable' } });
      const events = [
        { type: 'RUN_STARTED', threadId: input.threadId, runId: input.runId },
        { type: 'TEXT_MESSAGE_START', messageId: 'fixture-answer', role: 'assistant' },
        { type: 'TEXT_MESSAGE_CONTENT', messageId: 'fixture-answer', delta: 'Svar fra test.' },
        { type: 'TEXT_MESSAGE_END', messageId: 'fixture-answer' },
        { type: 'RUN_FINISHED', threadId: input.threadId, runId: input.runId },
      ];
      transcripts.set(input.threadId, [
        ...input.messages.map(message => ({ id: message.id, role: message.role, parts: [{ type: 'text', content: message.content }] })),
        { id: 'fixture-answer', role: 'assistant', parts: [{ type: 'text', content: 'Svar fra test.' }] },
      ]);
      return route.fulfill({ contentType: 'text/event-stream', body: events.map(event => `data: ${JSON.stringify(event)}\n\n`).join('') });
    }
    if (url.pathname === '/favicon.ico') return route.fulfill({ status: 204 });
    unexpected.push(url.origin + url.pathname);
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('https://utekos.test');
  await page.evaluate(value => { window.fixture = value; }, kind);
  await page.addScriptTag({ content: script });
  return { page, requests, hydrations };
}

for (const width of [390, 1280]) {
  test(`product help opens and receives an SSE response at ${width}px`, async t => {
    const { page, requests } = await fixture(t, 'product', width);
    await page.getByRole('button', { name: /Spør oss/ }).click();
    await expect(page.getByRole('region', { name: 'Handlehjelp' })).toBeVisible();
    await expect(page.getByText('Svar fra test.')).toBeVisible();
    assert.equal(requests.length, 1);
    assert.ok(requests[0].threadId);
    assert.ok(requests[0].runId);
    assert.deepEqual(requests[0].tools.map(tool => tool.name).sort(), ['open_help_panel', 'search_products']);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  });
}

test('React UI factory renders its input and streamed messages', async t => {
  const { page, requests } = await fixture(t, 'screen', 390);
  await page.getByRole('textbox', { name: 'Melding' }).fill('Hei');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Svar fra test.')).toBeVisible();
  assert.equal(requests.length, 1);
});

test('product help shows request failures without an uncaught rejection', async t => {
  const { page } = await fixture(t, 'product', 390, 503);
  await page.getByRole('button', { name: /Spør oss/ }).click();
  await expect(page.getByRole('alert')).toHaveText('Handlehjelpen er midlertidig utilgjengelig.');
  await expect(page.getByRole('button', { name: /Spør oss/ })).toBeEnabled();
});

test('the main Chat component sends through the API and restores its transcript after reload', async t => {
  const { page, requests, hydrations } = await fixture(t, 'chat', 390);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Svar fra test.')).toBeVisible();
  assert.equal(requests.length, 1);
  assert.equal(await page.evaluate(() => Object.values(localStorage).some(value => value.includes('Svar fra test.'))), false);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.evaluate(() => { window.fixture = 'chat'; });
  await page.addScriptTag({ content: script });
  await expect(page.getByText('Svar fra test.')).toBeVisible();
  assert.equal(requests.length, 1);
  assert.deepEqual(hydrations, ['support-chat', 'support-chat']);
});

test('the scripted chat demo renders its scroller, tooltips and menu without runtime errors', async t => {
  const { page, requests } = await fixture(t, 'demo', 390);
  await expect(page.getByText('New Chat', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add files' }).click();
  await expect(page.getByRole('menuitem', { name: 'Create Image' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText("I'm building a chat for our app", { exact: false }).first()).toBeVisible();
  assert.equal(requests.length, 0);
});

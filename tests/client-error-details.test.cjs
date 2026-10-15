/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildSync } = require('esbuild');
const Module = require('node:module');
function bundled(root, entry) {
  const cwd = path.resolve(__dirname, root);
  const code = buildSync({ absWorkingDir: cwd, entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text;
  const mod = new Module(path.join(cwd, 'test-bundle.cjs'), module);
  mod.filename = path.join(cwd, 'test-bundle.cjs');
  mod.paths = module.paths;
  mod._compile(code, mod.filename);
  return mod.exports;
}
const sanitizer = bundled('..', 'src/lib/observability/logging/sanitizeClientErrorDetails.ts');
const frontend = bundled('..', 'src/lib/observability/logging/clientLogPayloadSchema.ts');
const backend = bundled(process.env.CLIENT_ERROR_BACKEND_ROOT || '..', 'src/lib/observability/logging/clientLogPayloadSchema.ts');
const appContract = bundled(process.env.CLIENT_ERROR_BACKEND_ROOT || '..', 'src/lib/observability/logging/appLogContract.ts');
const asset = '/_next/static/chunks/abc-123.js';

test('Chrome, Firefox and Safari locations survive repeated sanitization without secrets', () => {
  const stack = `Error: customer@example.com token=secret\n    at privateCustomer (https://utekos.no${asset}?token=secret:12:34)\nfn@https://utekos.no${asset}:56:78\nhttps://utekos.no${asset}:9:10\n    at https://external.example/customer@example.com.js:3:4`;
  const result = sanitizer.sanitizeClientErrorStack(stack);
  assert.equal(result, `    at ${asset}:12:34\n    at ${asset}:56:78\n    at ${asset}:9:10\n    at /:other:3:4`);
  assert.equal(sanitizer.sanitizeClientErrorStack(result), result);
  assert.doesNotMatch(result, /secret|customer|privateCustomer|external/);
  assert.equal(sanitizer.sanitizeClientErrorStack('arbitrary private text'), '');
  assert.equal(sanitizer.sanitizeClientErrorFilename(`https://utekos.no${asset}?email=private#secret`), asset);
  assert.equal(sanitizer.sanitizeClientErrorFilename('https://host/customer@example.com'), '/:other');
  assert.equal(sanitizer.sanitizeClientErrorStack(Array(50).fill(`at https://utekos.no${asset}:1:2`).join('\n')).split('\n').length, 10);
});

test('frontend and backend contracts retain stack and event position; legacy reports still accepted', () => {
  const payload = { event: 'client_error', level: 'error', data: { source: 'window_error', message: 'TypeError', filename: `https://utekos.no${asset}?secret=1`, stack: `at https://utekos.no${asset}:12:34`, line: 12, column: 34, operation: 'window' }, context: { pathname: '/produkter/test' } };
  const sent = frontend.clientLogPayloadSchema.parse(payload);
  const received = backend.clientLogPayloadSchema.parse(sent);
  assert.equal(received.data.filename, asset);
  assert.equal(received.data.stack, `    at ${asset}:12:34`);
  assert.equal(received.data.line, 12);
  assert.equal(received.data.column, 34);
  assert.equal(received.data.operation, 'window');
  const logged = appContract.appLogInputSchema.parse(backend.toAppLogInput(received));
  assert.equal(logged.event, 'client.error');
  assert.deepEqual(logged.data, received.data);
  assert.equal(backend.clientLogPayloadSchema.safeParse({ ...payload, data: { source: 'window_error', message: 'Error' } }).success, true);
});

test('production reporter sends original stack and ErrorEvent coordinates through fetch', async () => {
  const { reportClientCaughtError } = bundled('..', 'src/lib/observability/client/reportClientCaughtError.ts');
  const oldWindow = global.window, oldFetch = global.fetch, oldEnv = process.env.NODE_ENV;
  let sent;
  global.window = { location: { pathname: '/produkter/test' } };
  global.fetch = async (_url, options) => { sent = JSON.parse(options.body); return new Response(null); };
  process.env.NODE_ENV = 'production';
  try {
    const error = new TypeError('customer@example.com');
    error.stack = `TypeError: customer@example.com\n    at fn (https://utekos.no${asset}:12:34)`;
    reportClientCaughtError(error, 'window', { filename: `https://utekos.no${asset}`, lineno: 12, colno: 34 });
    assert.equal(sent.data.stack, `    at ${asset}:12:34`);
    assert.equal(sent.data.line, 12);
    assert.equal(sent.data.column, 34);
    assert.equal(sent.data.message, 'TypeError');
    reportClientCaughtError(error, 'promise');
    assert.equal(sent.data.operation, 'promise');
    assert.equal(sent.data.stack, `    at ${asset}:12:34`);
    reportClientCaughtError('private rejection', 'promise', { lineno: NaN, colno: -1 });
    assert.equal(sent.data.line, undefined);
    assert.doesNotMatch(JSON.stringify(sent), /private rejection|customer@example/);
  } finally {
    global.window = oldWindow; global.fetch = oldFetch;
    if (oldEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldEnv;
  }
});

test('browser listeners capture ErrorEvent and rejected promise and detach cleanly', async () => {
  const { chromium } = require('playwright');
  const code = buildSync({ entryPoints: [path.resolve(__dirname, '../src/lib/observability/client/registerClientErrorListeners.ts')], bundle: true, platform: 'browser', format: 'iife', globalName: 'errorLogging', define: { 'process.env.NODE_ENV': '"production"' }, write: false }).outputFiles[0].text;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ content: code });
    const results = await page.evaluate(() => {
      const payloads = [];
      window.fetch = async (_url, options) => { payloads.push(JSON.parse(options.body)); return new Response(null); };
      const stop = errorLogging.registerClientErrorListeners();
      const error = new TypeError('private@example.com');
      error.stack = 'TypeError: private@example.com\n    at f (https://utekos.no/_next/static/chunks/test.js?secret=1:7:9)';
      const emit = () => window.dispatchEvent(new ErrorEvent('error', { error, filename: 'https://utekos.no/_next/static/chunks/test.js?secret=1', lineno: 7, colno: 9 }));
      emit();
      window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', { promise: Promise.resolve(), reason: error }));
      stop(); emit();
      return payloads;
    });
    assert.equal(results.length, 2);
    assert.equal(results[0].data.line, 7);
    assert.equal(results[0].data.column, 9);
    assert.equal(results[0].data.filename, '/_next/static/chunks/test.js');
    assert.equal(results[1].data.operation, 'promise');
    assert.equal(results[1].data.stack, '    at /_next/static/chunks/test.js:7:9');
    assert.doesNotMatch(JSON.stringify(results), /private@example|secret/);
  } finally { await browser.close(); }
});


test('known external scripts and inline documents retain source without account IDs', () => {
  const sources = [
    ['https://www.googletagmanager.com/gtm.js?id=GTM-PRIVATE', '/:script/google-tag-manager'],
    ['https://connect.facebook.net/signals/config/123456?secret=1', '/:script/meta'],
    ['https://x.klarnacdn.net/apf/beta/library/main.js', '/:script/klarna'],
    ['chrome-extension://private-extension/content.js', '/:script/browser-extension'],
    ['https://utekos.no/produkter/private-handle?email=private@example.com', '/produkter/:product'],
    ['https://utekos.no/analytics/meta-pixel-canonical-v1.js', '/analytics/meta-pixel-canonical-v1.js'],
  ];
  for (const [url, expected] of sources) {
    assert.equal(sanitizer.sanitizeClientErrorFilename(url), expected);
    assert.equal(sanitizer.sanitizeClientErrorFilename(expected), expected);
    const payload = { event: 'client_error', level: 'error', data: { source: 'window_error', filename: url }, context: { pathname: '/produkter/test' } };
    const sent = frontend.clientLogPayloadSchema.parse(payload);
    assert.equal(backend.clientLogPayloadSchema.parse(sent).data.filename, expected);
  }
  const stack = sanitizer.sanitizeClientErrorStack('at https://www.googletagmanager.com/gtm.js?id=GTM-PRIVATE:1:11853');
  assert.equal(stack, '    at /:script/google-tag-manager:1:11853');
  assert.equal(sanitizer.sanitizeClientErrorStack(stack), stack);
});

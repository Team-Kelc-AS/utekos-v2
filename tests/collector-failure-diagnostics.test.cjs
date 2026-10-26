/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { buildSync } = require('esbuild');

function bundle(root, contents) {
  const code = buildSync({ absWorkingDir: root, stdin: { contents, resolveDir: root, loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', write: false, define: { 'process.env.NODE_ENV': '"production"' } }).outputFiles[0].text;
  const mod = new Module(path.join(root, 'collector-diagnostic-test.cjs'), module);
  mod.filename = path.join(root, 'collector-diagnostic-test.cjs');
  mod.paths = module.paths;
  mod._compile(code, mod.filename);
  return mod.exports;
}
const root = path.resolve(__dirname, '..');
const backendRoot = process.env.CLIENT_ERROR_BACKEND_ROOT || root;
const helpers = () => bundle(root, `
  export { deliverCanonicalEvent } from './src/lib/tracking/delivery';
  export { getCollectorFailureDiagnostics } from './src/lib/observability/client/collectorFailureDiagnostics';
  export { reportClientCaughtError } from './src/lib/observability/client/reportClientCaughtError';
`);
const frontend = bundle(root, "export { clientLogPayloadSchema, toAppLogInput } from './src/lib/observability/logging/clientLogPayloadSchema';");
const backend = bundle(backendRoot, "export { clientLogPayloadSchema, toAppLogInput } from './src/lib/observability/logging/clientLogPayloadSchema'; export { appLogInputSchema } from './src/lib/observability/logging/appLogContract';");

test('concurrent canonical bytes are measured at failure, original error and retries remain intact, counters are released', async () => {
  const { deliverCanonicalEvent, getCollectorFailureDiagnostics } = helpers();
  const event = { private_value: 'x'.repeat(40_000) };
  const bytes = Buffer.byteLength(JSON.stringify(event));
  let release;
  const pending = deliverCanonicalEvent('/api/events/page-view', event, () => new Promise(resolve => { release = resolve; }));
  const error = new TypeError('Failed to fetch');
  const originalStack = error.stack;
  const attempts = [];
  await assert.rejects(deliverCanonicalEvent('/api/events/view-item', event, async (_url, init) => {
    attempts.push(init);
    throw error;
  }), thrown => thrown === error);
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].body, attempts[1].body);
  assert.equal(error.stack, originalStack);
  const diagnostic = getCollectorFailureDiagnostics(error);
  assert.equal(diagnostic.target, 'view_item');
  assert.equal(diagnostic.native_reason, 'failed_to_fetch');
  assert.equal(diagnostic.body_bytes, bytes);
  assert.equal(diagnostic.canonical_in_flight_keepalive_bytes, bytes * 2);
  assert.equal(diagnostic.attempts, 2);
  assert.equal(diagnostic.keepalive, true);
  assert.equal(diagnostic.signal_aborted, false);
  release(new Response(null, { status: 202 }));
  assert.equal((await pending).status, 'accepted_unverified');

  const next = new TypeError('Load failed');
  await assert.rejects(deliverCanonicalEvent('/api/events/page-view/capture', {}, async () => { throw next; }));
  assert.equal(getCollectorFailureDiagnostics(next).canonical_in_flight_keepalive_bytes, 2);
  assert.equal(getCollectorFailureDiagnostics(next).target, 'page_view_capture');
  assert.equal(getCollectorFailureDiagnostics(next).native_reason, 'load_failed');
  assert.equal(getCollectorFailureDiagnostics(new TypeError('unrelated')), undefined);
});

test('native reason categories, oversized bodies and unknown endpoint values never expose raw details', async () => {
  const { deliverCanonicalEvent, getCollectorFailureDiagnostics } = helpers();
  for (const [error, reason] of [
    [new TypeError('NetworkError when attempting to fetch resource.'), 'network_error'],
    [new TypeError('customer@example.test secret-token'), 'type_error'],
    [new DOMException('private text', 'AbortError'), 'abort'],
    [new DOMException('private text', 'TimeoutError'), 'timeout'],
    [new Error('private text'), 'other'],
  ]) {
    await assert.rejects(deliverCanonicalEvent('/private/customer@example.test?secret=1', { value: 'private text'.repeat(7000) }, async () => { throw error; }));
    const diagnostic = getCollectorFailureDiagnostics(error);
    assert.equal(diagnostic.native_reason, reason);
    assert.equal(diagnostic.target, 'other');
    assert.equal(diagnostic.keepalive, false);
    assert.equal(diagnostic.canonical_in_flight_keepalive_bytes, 0);
    assert.doesNotMatch(JSON.stringify(diagnostic), /customer|private|secret/);
  }
});

for (const visibility of ['visible', 'hidden']) {
  test(`transport retries keep the correct mode and release byte counters when ${visibility}`, async () => {
    const previousDocument = global.document;
    global.document = { visibilityState: visibility };
    try {
      const { deliverCanonicalEvent, getCollectorFailureDiagnostics } = helpers();
      const attempts = [];
      const error = new TypeError('Failed to fetch');
      await assert.rejects(deliverCanonicalEvent('/api/events/view-item', {}, async (_url, init) => {
        attempts.push(init.keepalive);
        throw error;
      }));
      assert.deepEqual(attempts, visibility === 'visible' ? [true, false] : [true, true]);
      const diagnostic = getCollectorFailureDiagnostics(error);
      assert.equal(diagnostic.keepalive, visibility !== 'visible');
      assert.equal(diagnostic.canonical_in_flight_keepalive_bytes, visibility === 'visible' ? 0 : 2);
      const next = new DOMException('deadline', 'TimeoutError');
      await assert.rejects(deliverCanonicalEvent('/api/events/page-view', {}, async () => { throw next; }));
      assert.equal(getCollectorFailureDiagnostics(next).canonical_in_flight_keepalive_bytes, 2, 'prior attempts leave no bytes behind');
    } finally {
      global.document = previousDocument;
    }
  });
}

test('the actual attempt signal identifies a deadline without changing the two-attempt policy', async () => {
  const { deliverCanonicalEvent, getCollectorFailureDiagnostics } = helpers();
  const original = global.AbortSignal;
  let caught, attempts = 0;
  global.AbortSignal = { timeout: () => original.abort(new DOMException('deadline', 'TimeoutError')) };
  try {
    await deliverCanonicalEvent('/api/events/page-view', {}, async (_url, init) => {
      attempts++;
      throw init.signal.reason;
    }).catch(error => { caught = error; });
    assert.equal(attempts, 2);
    assert.equal(getCollectorFailureDiagnostics(caught).signal_aborted, true);
    assert.equal(getCollectorFailureDiagnostics(caught).native_reason, 'timeout');
  } finally { global.AbortSignal = original; }
});

test('transport facts survive the real reporter and both log contracts while extra fields and values are rejected', async () => {
  const { deliverCanonicalEvent, reportClientCaughtError } = helpers();
  const oldWindow = global.window, oldDocument = global.document, oldFetch = global.fetch;
  let payload;
  global.window = { location: { pathname: '/produkter/comfyrobe' } };
  global.document = { visibilityState: 'hidden' };
  global.fetch = async (_url, init) => { payload = JSON.parse(init.body); return new Response(null, { status: 200 }); };
  try {
    const error = new TypeError('Load failed');
    error.stack = 'TypeError: private@example.test\n    at https://load.edge.utekos.no/apgqnrnczg.js:1:3320';
    await deliverCanonicalEvent('/api/events/page-view/capture', { private_data: 'private@example.test' }, async () => { throw error; })
      .catch(caught => reportClientCaughtError(caught, 'page_view.capture'));
    assert.ok(payload);
    assert.equal(payload.data.message, 'TypeError');
    assert.equal(payload.data.collector.target, 'page_view_capture');
    assert.equal(payload.data.collector.native_reason, 'load_failed');
    assert.equal(payload.data.collector.visibility, 'hidden');
    assert.match(payload.data.stack, /:script\/stape:1:3320/);
    assert.doesNotMatch(JSON.stringify(payload), /private_data|private@example/);
    const received = backend.clientLogPayloadSchema.parse(frontend.clientLogPayloadSchema.parse(payload));
    const logged = backend.appLogInputSchema.parse(backend.toAppLogInput(received));
    assert.deepEqual(logged.data.collector, payload.data.collector);
    assert.equal(logged.level, 'ERROR');
    for (const update of [
      { target: 'private@example.test' }, { native_reason: 'raw private error' },
      { body_bytes: -1 }, { body_bytes: Number.MAX_SAFE_INTEGER + 1 },
      { canonical_in_flight_keepalive_bytes: Infinity }, { attempts: 100 },
      { visibility: 'private' }, { online: 'false' }, { raw_message: 'private' },
    ]) {
      const invalid = { ...payload, data: { ...payload.data, collector: { ...payload.data.collector, ...update } } };
      assert.equal(frontend.clientLogPayloadSchema.safeParse(invalid).success, false);
      assert.equal(backend.clientLogPayloadSchema.safeParse(invalid).success, false);
    }
  } finally {
    global.window = oldWindow; global.document = oldDocument; global.fetch = oldFetch;
  }
});

for (const engine of ['chromium', 'webkit']) {
  test(`${engine}: a native fetch rejection carries diagnostic facts through the reporter without any external request`, async () => {
    const { [engine]: browserType } = require('playwright');
    const code = buildSync({ absWorkingDir: root, stdin: { contents: "export { deliverCanonicalEvent } from './src/lib/tracking/delivery'; export { reportClientCaughtError } from './src/lib/observability/client/reportClientCaughtError';", resolveDir: root, loader: 'ts' }, bundle: true, platform: 'browser', format: 'iife', globalName: 'collectorProbe', write: false, define: { 'process.env.NODE_ENV': '"production"' } }).outputFiles[0].text;
    const browser = await browserType.launch({ headless: true });
    try {
      const page = await browser.newPage();
      let attempts = 0;
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body>Local diagnostic fixture</body></html>' });
        if (url.pathname === '/api/events/view-item') { attempts++; return route.abort('failed'); }
        if (url.pathname === '/api/log') return route.fulfill({ status: 200, body: '{}' });
        return route.abort();
      });
      await page.goto('https://collector.test/');
      await page.addScriptTag({ content: code });
      const reported = page.waitForResponse(response => response.url() === 'https://collector.test/api/log');
      await page.evaluate(async () => {
        const nativeFetch = window.fetch;
        window.fetch = function () { return nativeFetch.apply(this, arguments); };
        await window.collectorProbe.deliverCanonicalEvent('/api/events/view-item', { event_id: 'synthetic-fixture' })
          .catch(error => window.collectorProbe.reportClientCaughtError(error, 'view_item.collector'));
      });
      const response = await reported;
      const payload = response.request().postDataJSON();
      assert.equal(attempts, 2);
      assert.equal(payload.data.message, 'TypeError');
      assert.equal(payload.data.collector.target, 'view_item');
      assert.equal(payload.data.collector.native_reason, engine === 'chromium' ? 'failed_to_fetch' : 'load_failed');
      assert.equal(payload.data.collector.attempts, 2);
      assert.equal(payload.data.collector.signal_aborted, false);
      const received = backend.clientLogPayloadSchema.parse(payload);
      assert.deepEqual(backend.toAppLogInput(received).data.collector, payload.data.collector);
    } finally { await browser.close(); }
  });
}

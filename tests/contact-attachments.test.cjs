/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp1sAAAAASUVORK5CYII=', 'base64');
const initial = { status: 'idle', message: '', values: {}, attempt: 0 };
function submission(files = []) {
  const data = new FormData();
  for (const [name, value] of Object.entries({ name: 'Testperson', email: 'test@example.com', message: 'Dette er en testhenvendelse.', privacy: 'on' })) data.set(name, value);
  for (const file of files) data.append('attachments', file);
  return data;
}
function setup(response = { ok: true, json: async () => ({ id: 'mock-email-id' }) }) {
  const calls = [];
  const tracking = [];
  const { submitContactForm } = loadTypeScript('app/kontaktskjema/actions.ts', {
    mocks: { '@/lib/tracking/server-forms': { recordAcceptedForm: async (form, id, receipt) => { tracking.push({ id, receipt }); }, submissionIdFromReceipt: id => `fixture:${id}` } },
    env: { RESEND_API_KEY: 'test-only-key', CONTACT_FORM_SEND_TO_EMAIL: 'support@example.com' },
    fetch: async (url, options) => { calls.push({ url, ...options, payload: JSON.parse(options.body) }); return response; },
  });
  return { submit: (data, previous = initial) => submitContactForm(previous, data), calls, tracking };
}

test('native multipart images arrive as unchanged base64 email attachments', async () => {
  const { submit, calls, tracking } = setup();
  const result = await submit(submission([new File([png], 'sømbilde.png', { type: 'image/png' })]));
  assert.equal(result.status, 'success');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal(calls[0].payload.reply_to, 'test@example.com');
  assert.deepEqual(calls[0].payload.attachments, [{ filename: 'sømbilde.png', content: png.toString('base64'), content_type: 'image/png' }]);
  assert.deepEqual(tracking, [{ id: 'contact', receipt: 'fixture:mock-email-id' }]);
});

test('text-only messages and the browser empty-file placeholder remain supported', async () => {
  const { submit, calls } = setup();
  for (const files of [[], [new File([], '', { type: 'application/octet-stream' })]]) {
    assert.equal((await submit(submission(files))).status, 'success');
  }
  assert.ok(calls.every(({ payload }) => !Object.hasOwn(payload, 'attachments')));
});

for (const [label, files] of [
  ['too many images', Array.from({ length: 4 }, (_, i) => new File([png], `${i}.png`, { type: 'image/png' }))],
  ['too many bytes', [new File([Buffer.alloc(4_000_001)], 'large.png', { type: 'image/png' })]],
  ['empty named image', [new File([], 'empty.png', { type: 'image/png' })]],
  ['unsupported image format', [new File(['<svg/>'], 'image.svg', { type: 'image/svg+xml' })]],
  ['forged image MIME type', [new File(['<script>alert(1)</script>'], 'fake.png', { type: 'image/png' })]],
  ['mismatching image signature', [new File([png], 'fake.jpg', { type: 'image/jpeg' })]],
]) {
  test(`${label} is rejected on the server before any provider call`, async () => {
    const { submit, calls } = setup();
    const result = await submit(submission(files));
    assert.equal(result.status, 'error');
    assert.ok(result.errors.attachments[0]);
    assert.equal(calls.length, 0);
  });
}

test('non-file form fields cannot bypass attachment validation', async () => {
  const { submit, calls } = setup();
  const data = submission();
  data.append('attachments', 'https://example.com/image.png');
  assert.ok((await submit(data)).errors.attachments[0]);
  assert.equal(calls.length, 0);
});

test('filenames have no paths or control characters and use the detected extension', async () => {
  const { submit, calls } = setup();
  await submit(submission([new File([png], '../image\r\n.exe', { type: 'image/png' })]));
  assert.equal(calls[0].payload.attachments[0].filename, 'image__.png');
});

test('retries reuse the key, while changed image content gets a new key', async () => {
  const { submit, calls } = setup();
  const file = new File([png], 'image.png', { type: 'image/png' });
  await submit(submission([file]));
  await submit(submission([file]));
  await submit(submission([new File([png, Buffer.from('changed')], 'image.png', { type: 'image/png' })]));
  assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key']);
  assert.notEqual(calls[0].headers['Idempotency-Key'], calls[2].headers['Idempotency-Key']);
});

test('provider failure preserves text values without serializing uploaded content into action state', async () => {
  const { submit, calls, tracking } = setup({ ok: false });
  const result = await submit(submission([new File([png], 'image.png', { type: 'image/png' })]));
  assert.equal(result.status, 'error');
  assert.equal(result.values.message, 'Dette er en testhenvendelse.');
  assert.equal(result.attempt, 1);
  assert.equal(calls.length, 1);
  assert.equal(JSON.stringify(result).includes(png.toString('base64')), false);
  assert.equal(tracking.length, 0);
});

test('invalid text and honeypot submissions never reach the email provider', async () => {
  const { submit, calls, tracking } = setup();
  const invalid = submission();
  invalid.set('email', 'invalid');
  assert.ok((await submit(invalid)).errors.email);
  const bot = submission();
  bot.set('website', 'spam');
  assert.equal((await submit(bot)).status, 'error');
  assert.equal(calls.length, 0);
  assert.equal(tracking.length, 0);
});

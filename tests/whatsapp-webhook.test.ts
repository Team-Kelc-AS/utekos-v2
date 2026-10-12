import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { receiveWhatsAppWebhook, storeWhatsAppReceipts, verifyWhatsAppWebhook, whatsappReceipts } from '../src/lib/whatsapp/webhook';

const secret = 'synthetic-app-secret';
const message = (id: string) => ({ id, from: 'synthetic-sender', timestamp: '1', type: 'text', text: { body: 'synthetic test' } });
const payload = (value: Record<string, unknown>) => ({ object: 'whatsapp_business_account', entry: [{ id: 'synthetic-waba',
  changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { phone_number_id: 'synthetic-phone' }, ...value } }] }] });
function signed(body: string) {
  return new Request('https://utekos.no/api/whatsapp/webhook', { method: 'POST', body,
    headers: { 'x-hub-signature-256': `sha256=${createHmac('sha256', secret).update(body).digest('hex')}` } });
}

test('verification returns the exact challenge only with matching token and subscribe mode', async () => {
  const url = 'https://utekos.no/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=12345&hub.verify_token=synthetic-token';
  const result = verifyWhatsAppWebhook(new Request(url), { verifyToken: 'synthetic-token' });
  assert.equal(result.status, 200);
  assert.equal(await result.text(), '12345');
  assert.match(result.headers.get('cache-control')!, /no-store/);
  assert.equal(verifyWhatsAppWebhook(new Request(url), { verifyToken: 'wrong' }).status, 403);
  assert.equal(verifyWhatsAppWebhook(new Request(url.replace('subscribe', 'other')), { verifyToken: 'synthetic-token' }).status, 403);
  assert.equal(verifyWhatsAppWebhook(new Request(url), {}).status, 503);
});

test('signature covers exact raw bytes and unsigned/tampered requests never reach storage', async () => {
  let writes = 0;
  const store = async () => { writes++; };
  const body = JSON.stringify(payload({ messages: [message('one')] }));
  assert.equal((await receiveWhatsAppWebhook(signed(body), { appSecret: secret }, store)).status, 200);
  assert.equal(writes, 1);
  assert.equal((await receiveWhatsAppWebhook(signed(body), { appSecret: 'wrong' }, store)).status, 401);
  assert.equal((await receiveWhatsAppWebhook(new Request('https://utekos.no', { method: 'POST', body }), { appSecret: secret }, store)).status, 401);
  assert.equal(writes, 1);
});

test('storage must complete successfully before acknowledgement; failure asks Meta to retry', async () => {
  const body = JSON.stringify(payload({ messages: [message('one')] }));
  const response = await receiveWhatsAppWebhook(signed(body), { appSecret: secret }, async () => { throw new Error('private database details'); });
  assert.equal(response.status, 503);
  assert.equal(await response.text(), 'storage_unavailable');
});

test('message IDs deduplicate across retries, property order and changed batches', () => {
  const batched = whatsappReceipts(payload({ messages: [message('one'), message('two'), message('one')] }));
  assert.equal(batched.length, 2);
  const single = whatsappReceipts(payload({ messages: [message('two')] }));
  assert.equal(single[0].event_key, batched[1].event_key);
  assert.equal(whatsappReceipts(payload({ messages: [{ ...message('one'), text: { body: 'updated body' } }] }))[0].event_key, batched[0].event_key);
});

test('sent, delivered and read statuses remain separate receipts', () => {
  const rows = whatsappReceipts(payload({ statuses: ['sent', 'delivered', 'read'].map(status => ({ id: 'one', status, timestamp: '1' })) }));
  assert.equal(rows.length, 3);
  assert.equal(new Set(rows.map(row => row.event_key)).size, 3);
});

test('signed malformed and wrong-object payloads are rejected without storage', async () => {
  for (const body of ['{', JSON.stringify({ object: 'page', entry: [] }), JSON.stringify(payload({ messages: [{}] }))]) {
    const response = await receiveWhatsAppWebhook(signed(body), { appSecret: secret }, async () => { assert.fail('must not store'); });
    assert.equal(response.status, 400);
  }
});

test('body limit is enforced with and without content-length', async () => {
  const body = 'x'.repeat(3 * 1024 * 1024 + 1);
  for (const explicitLength of [false, true]) {
    const request = signed(body);
    if (explicitLength) request.headers.set('content-length', String(body.length));
    assert.equal((await receiveWhatsAppWebhook(request, { appSecret: secret }, async () => { assert.fail('must not store'); })).status, 413);
  }
});

test('account/template fields and error webhooks are retained and deduplicated', () => {
  const account = { object: 'whatsapp_business_account', entry: [{ id: 'synthetic-waba', changes: [
    { field: 'message_template_status_update', value: { event: 'APPROVED', message_template_id: 'synthetic-template' } },
  ] }] };
  assert.equal(whatsappReceipts(account)[0].field, 'message_template_status_update');
  assert.equal(whatsappReceipts(payload({ errors: [{ code: 123, title: 'synthetic' }] })).length, 1);
});

test('receipt RPC uses dedicated credentials and propagates database failure', async () => {
  const names = ['WHATSAPP_SUPABASE_URL', 'WHATSAPP_SUPABASE_PUBLISHABLE_KEY', 'WHATSAPP_WEBHOOK_INGEST_TOKEN'] as const;
  const previous = names.map(name => process.env[name]);
  process.env.WHATSAPP_SUPABASE_URL = 'https://synthetic.supabase.co';
  process.env.WHATSAPP_SUPABASE_PUBLISHABLE_KEY = 'synthetic-key';
  process.env.WHATSAPP_WEBHOOK_INGEST_TOKEN = 'synthetic-ingest-token';
  try {
    const receipts = whatsappReceipts(payload({ messages: [message('one')] }));
    await storeWhatsAppReceipts(receipts, async (url, init) => {
      assert.equal(String(url), 'https://synthetic.supabase.co/rest/v1/rpc/ingest_whatsapp_webhook_receipts');
      assert.equal(new Headers(init?.headers).get('x-utekos-whatsapp-token'), 'synthetic-ingest-token');
      assert.equal(new Headers(init?.headers).get('apikey'), 'synthetic-key');
      assert.equal(new Headers(init?.headers).get('authorization'), null);
      assert.equal(init?.body, JSON.stringify({ p_receipts: receipts }));
      assert.equal(init?.cache, 'no-store');
      return new Response(null, { status: 201 });
    });
    await assert.rejects(storeWhatsAppReceipts(receipts, async () => new Response(null, { status: 500 })));
  } finally {
    names.forEach((name, i) => { if (previous[i] === undefined) delete process.env[name]; else process.env[name] = previous[i]; });
  }
});

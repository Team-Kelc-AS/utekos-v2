import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const MAX_BODY_BYTES = 3 * 1024 * 1024;
type JsonObject = Record<string, unknown>;
export type WhatsAppReceipt = {
  event_key: string;
  waba_id: string;
  field: string;
  payload: JsonObject;
};
type Config = { verifyToken?: string; appSecret?: string };
type Store = (receipts: WhatsAppReceipt[]) => Promise<void>;
class StorageError extends Error {
  constructor(public reason: string, public status?: number, public providerCode?: string) { super(reason); }
}
const object = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
function equal(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
function response(status: number, body: string) {
  return new Response(body, { status, headers: {
    'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'private, no-store',
  } });
}

export function verifyWhatsAppWebhook(request: Request, config: Config) {
  if (!config.verifyToken) return response(503, 'webhook_not_configured');
  const params = new URL(request.url).searchParams;
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');
  if (params.get('hub.mode') !== 'subscribe' || !token || !challenge || challenge.length > 1024
    || !equal(token, config.verifyToken)) return response(403, 'verification_failed');
  return response(200, challenge);
}

async function readBody(request: Request) {
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) throw new RangeError();
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new RangeError(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

// Split messages and statuses so a retry with different batching still deduplicates.
export function whatsappReceipts(payload: unknown): WhatsAppReceipt[] {
  if (!object(payload) || payload.object !== 'whatsapp_business_account'
    || !Array.isArray(payload.entry) || payload.entry.length === 0) throw new Error('invalid_payload');
  const receipts = new Map<string, WhatsAppReceipt>();
  for (const entry of payload.entry) {
    if (!object(entry) || !text(entry.id) || !Array.isArray(entry.changes) || !entry.changes.length) throw new Error('invalid_entry');
    for (const change of entry.changes) {
      if (!object(change) || !text(change.field) || !object(change.value)) throw new Error('invalid_change');
      const value = change.value;
      const metadata = object(value.metadata) ? value.metadata : {};
      const add = (identity: unknown, data: JsonObject) => {
        const event_key = hash(canonical([entry.id, metadata.phone_number_id ?? '', change.field, identity]));
        receipts.set(event_key, { event_key, waba_id: entry.id as string, field: change.field as string,
          payload: { object: 'whatsapp_business_account', entry: [{ id: entry.id,
            changes: [{ field: change.field, value: data }] }] } });
      };
      if (change.field === 'messages') {
        const { messages, statuses, errors, ...context } = value;
        let count = 0;
        for (const [kind, items] of [['messages', messages], ['statuses', statuses], ['errors', errors]] as const) {
          if (items === undefined) continue;
          if (!Array.isArray(items)) throw new Error('invalid_messages');
          for (const item of items) {
            if (!object(item)) throw new Error('invalid_message');
            if (kind !== 'errors' && !text(item.id)) throw new Error('invalid_message_id');
            if (kind === 'statuses' && (!text(item.status) || !text(item.timestamp))) throw new Error('invalid_status');
            const identity = kind === 'messages' ? [kind, item.id, item.type, item.timestamp]
              : kind === 'statuses' ? [kind, item.id, item.status, item.timestamp] : [kind, item];
            add(identity, { ...context, [kind]: [item] });
            count++;
          }
        }
        if (!count) throw new Error('empty_messages');
      } else {
        add(value, value);
      }
      if (receipts.size > 1000) throw new Error('too_many_events');
    }
  }
  return [...receipts.values()];
}

export async function receiveWhatsAppWebhook(request: Request, config: Config, store: Store) {
  if (!config.appSecret) return response(503, 'webhook_not_configured');
  const signature = request.headers.get('x-hub-signature-256');
  if (!signature || !/^sha256=[a-fA-F0-9]{64}$/.test(signature)) return response(401, 'invalid_signature');
  let raw: Buffer;
  try { raw = await readBody(request); }
  catch (error) { return response(error instanceof RangeError ? 413 : 400, 'invalid_body'); }
  const expected = createHmac('sha256', config.appSecret).update(raw).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'))) return response(401, 'invalid_signature');
  let receipts: WhatsAppReceipt[];
  try { receipts = whatsappReceipts(JSON.parse(raw.toString('utf8'))); }
  catch { return response(400, 'invalid_payload'); }
  try { await store(receipts); }
  catch (error) {
    // Only bounded machine codes; never log credentials, request URLs or payloads.
    console.error('whatsapp_webhook_storage_failed', error instanceof StorageError
      ? { reason: error.reason, status: error.status, providerCode: error.providerCode }
      : { reason: 'storage_request_failed', errorType: error instanceof Error ? error.name : 'unknown' });
    return response(503, 'storage_unavailable');
  }
  return response(200, 'EVENT_RECEIVED');
}

export async function storeWhatsAppReceipts(receipts: WhatsAppReceipt[], fetcher = fetch) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new StorageError('storage_not_configured');
  let endpoint: URL;
  try { endpoint = new URL('/rest/v1/whatsapp_webhook_receipts?on_conflict=event_key', url); }
  catch { throw new StorageError('invalid_storage_url'); }
  const result = await fetcher(endpoint, {
    method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}`,
      Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(receipts),
  });
  if (!result.ok) {
    const failure = await result.json().catch(() => null);
    const code = typeof failure?.code === 'string' && /^[A-Z0-9_]{1,32}$/.test(failure.code) ? failure.code : undefined;
    throw new StorageError('storage_rejected', result.status, code);
  }
}

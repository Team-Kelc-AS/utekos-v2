import 'server-only';
import { isIP } from 'node:net';
import { getVercelOidcToken } from '@vercel/oidc';
import { geolocation, ipAddress } from '@vercel/functions/headers';
import type { NextRequest } from 'next/server';
import { FACEBOOK_SESSION_COOKIE, readSession } from '@/lib/facebook-login/session';
import { BRIDGE_URL, isBridgeOperation, isCallbackOperation } from './bridge-contract';
import { productionTrackingEnabled, isTrackingOrigin } from './environment';

const REQUEST_HEADERS = [
  'origin', 'referer', 'content-type', 'authorization', 'sec-fetch-site',
  'x-shopify-hmac-sha256', 'x-shopify-topic', 'x-shopify-shop-domain',
  'x-shopify-webhook-id', 'x-shopify-event-id', 'x-shopify-api-version',
  'x-shopify-triggered-at', 'x-utekos-synthetic-signature', 'x-utekos-synthetic-timestamp',
] as const;
const RESPONSE_HEADERS = [
  'content-type', 'retry-after', 'vary', 'access-control-allow-origin',
  'access-control-allow-methods', 'access-control-allow-headers', 'access-control-allow-credentials',
  'access-control-max-age', 'x-utekos-storefront-request-id',
  'access-control-expose-headers', 'cross-origin-resource-policy', 'x-shopify-checkout-observation-result',
  'x-shopify-checkout-canonical-result', 'x-utekos-traffic-classification', 'x-utekos-rejection',
  'x-utekos-storefront-deploy-sha', 'x-utekos-backend-deploy-sha',
] as const;
// Exclude v2 auth tokens and secret Shopify cart keys from analytics requests.
const IDENTITY_COOKIE = /^(?:_ga(?:_[A-Z0-9]+)?|_fbc|_fbp|_fbi|_uet(?:msclkid|sid|vid)|_scid|_sctr|_epik|_pin_unauth|_ttp|user_id|backup_msclkid|CookieConsent|utekos_external_id|utekos_consent|utekos_[a-z_]*(?:journey|experiment|campaign)[a-z_]*)$/;

export function identityCookieHeader(request: NextRequest) {
  return request.cookies.getAll().filter(cookie => IDENTITY_COOKIE.test(cookie.name))
    .map(cookie => `${cookie.name}=${encodeURIComponent(cookie.value)}`).join('; ');
}
export function verifiedFacebookLoginId(request: NextRequest) {
  return readSession(request.cookies.get(FACEBOOK_SESSION_COOKIE)?.value, 'session')?.userId;
}
export async function readBoundedBody(request: Request, limit: number) {
  if (Number(request.headers.get('content-length')) > limit) throw new RangeError('body_limit');
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw new RangeError('body_limit'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}
function failure(status: number, code: string, requestId: string) {
  return Response.json({ error: code }, { status, headers: {
    'Cache-Control': 'private, no-store', 'x-utekos-storefront-request-id': requestId,
  } });
}
export async function forwardTrackingRequest(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname: operation, search, origin } = new URL(request.url);
  if (!isBridgeOperation(operation)) return failure(404, 'unknown_operation', requestId);
  const callback = isCallbackOperation(operation);
  // Payment/webhook continuity is independent of the browser marketing switch.
  const enabled = callback ? process.env.VERCEL_ENV === 'production' : productionTrackingEnabled();
  if (!enabled || !isTrackingOrigin(origin)) return failure(403, 'tracking_environment_disabled', requestId);
  if (!callback && request.headers.get('origin') !== origin) return failure(403, 'origin_mismatch', requestId);
  if (request.method !== 'POST' && !(request.method === 'OPTIONS' && ['/api/shopify/checkout-observations', '/api/shopify/checkout-recovery-evidence'].includes(operation))) {
    return failure(405, 'method_not_allowed', requestId);
  }
  try {
    const raw = await readBoundedBody(request, callback ? 2 * 1024 * 1024 : 64 * 1024);
    if (operation === '/api/events/generate-lead' || operation === '/api/events/form-submit') {
      let payload;
      try { payload = JSON.parse(Buffer.from(raw).toString('utf8')); } catch { /* Backend validates malformed payloads. */ }
      // Dealer acceptance is authoritative only through the receipt-bound server action.
      if (payload?.custom_data?.form_id === 'dealer_inquiry') return failure(403, 'server_receipt_required', requestId);
    }
    const headers: Record<string, string> = {};
    for (const key of REQUEST_HEADERS) {
      const value = request.headers.get(key);
      if (value !== null) headers[key] = value;
    }
    const cookies = identityCookieHeader(request);
    if (cookies) headers.cookie = cookies;
    const geo = geolocation(request);
    const ip = ipAddress(request);
    const facebookLoginId = verifiedFacebookLoginId(request);
    const deploySha = process.env.VERCEL_GIT_COMMIT_SHA;
    const context = {
      publicOrigin: origin, environment: 'production', requestId,
      ...(deploySha && /^[a-f0-9]{40}$/.test(deploySha) ? { deploySha } : {}),
      ...(ip && isIP(ip) ? { clientIpAddress: ip } : {}),
      ...(request.headers.get('user-agent') ? { userAgent: request.headers.get('user-agent')!.slice(0, 2048) } : {}),
      ...(geo.city ? { city: geo.city } : {}),
      ...(geo.country ? { countryCode: geo.country } : {}),
      ...(geo.postalCode ? { postalCode: geo.postalCode } : {}),
      ...(geo.countryRegion ? { regionCode: geo.countryRegion } : {}),
      ...(facebookLoginId ? { facebookLoginId } : {}),
    };
    const token = await getVercelOidcToken({ audience: BRIDGE_URL });
    const upstream = await fetch(BRIDGE_URL, {
      method: 'POST', redirect: 'manual', cache: 'no-store',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ version: 1, operation, method: request.method,
        ...(search ? { search } : {}), bodyBase64: Buffer.from(raw).toString('base64'), context, headers }),
      signal: AbortSignal.timeout(8000),
    });
    const responseHeaders = new Headers({ 'cache-control': 'private, no-store' });
    for (const name of RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value !== null) responseHeaders.set(name, value);
    }
    for (const value of upstream.headers.getSetCookie()) responseHeaders.append('set-cookie', value);
    responseHeaders.set('x-utekos-storefront-request-id', requestId);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    // Never include payload, full URL, credentials, or personal data in logs.
    console.error('storefront_tracking_bridge_failed', { requestId, operation,
      category: error instanceof RangeError ? 'body_limit' : 'transport' });
    return failure(error instanceof RangeError ? 413 : 502, error instanceof RangeError ? 'body_limit' : 'backend_unavailable', requestId);
  }
}

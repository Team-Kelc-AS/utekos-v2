import 'server-only';
import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { isIP } from 'node:net';
import { getVercelOidcToken } from '@vercel/oidc';
import { geolocation, ipAddress } from '@vercel/functions/headers';
import type { NextRequest } from 'next/server';
import { BRIDGE_URL } from '@/lib/tracking/bridge-contract';
import { verifiedFacebookLoginId } from '@/lib/tracking/backend';
import { isTrackingOrigin } from '@/lib/tracking/environment';

// Resolve authentication before submitting a payment. A failure here has a
// known not-submitted outcome; a lost response after send does not.
export async function prepareKlarnaOrderForwarder(request: NextRequest | undefined, fullCartId: string) {
  if (!request || process.env.VERCEL_ENV !== 'production' || !isTrackingOrigin(request.nextUrl.origin) || request.headers.get('origin') !== request.nextUrl.origin) throw new Error('Klarna bridge environment unavailable');
  const token = await getVercelOidcToken({ audience: BRIDGE_URL });
  const geo = geolocation(request);
  const ip = ipAddress(request);
  const facebookLoginId = verifiedFacebookLoginId(request);
  const deploySha = process.env.VERCEL_GIT_COMMIT_SHA;
  const context = {
    publicOrigin: request.nextUrl.origin, environment: 'production', requestId: randomUUID(),
    ...(deploySha && /^[a-f0-9]{40}$/.test(deploySha) ? { deploySha } : {}),
    ...(ip && isIP(ip) ? { clientIpAddress: ip } : {}),
    ...(request.headers.get('user-agent') ? { userAgent: request.headers.get('user-agent')!.slice(0, 2048) } : {}),
    ...(geo.city ? { city: geo.city } : {}),
    ...(geo.country ? { countryCode: geo.country } : {}),
    ...(geo.postalCode ? { postalCode: geo.postalCode } : {}),
    ...(geo.countryRegion ? { regionCode: geo.countryRegion } : {}),
    ...(facebookLoginId ? { facebookLoginId } : {}),
  };
  const cookie = `cartId=${encodeURIComponent(fullCartId)}`;
  return (body: string) => fetch(BRIDGE_URL, {
    method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(30_000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ version: 1, operation: '/api/klarna/orders', method: 'POST',
      headers: { 'content-type': 'application/json', origin: request.nextUrl.origin, cookie },
      context, bodyBase64: Buffer.from(body).toString('base64') }),
  });
}

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { privateHeaders, sameOrigin } from '@/lib/cart/request';
import {
  KLARNA_IDENTITY_STATE_COOKIE,
  createKlarnaState, klarnaIdentityConfig, klarnaStateMaxAge, safeReturnTo,
} from '@/lib/klarna/identity';

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 403, headers: privateHeaders });
  const config = klarnaIdentityConfig();
  if (!config) return NextResponse.json({ error: 'Klarna-innlogging er ikke tilgjengelig.' }, { status: 503, headers: privateHeaders });
  if (Number(request.headers.get('content-length')) > 4096) return NextResponse.json({ error: 'Forespørselen er for stor.' }, { status: 413, headers: privateHeaders });
  const body = await request.text();
  if (Buffer.byteLength(body) > 4096) return NextResponse.json({ error: 'Forespørselen er for stor.' }, { status: 413, headers: privateHeaders });
  let input: unknown;
  try { input = JSON.parse(body); } catch { input = null; }
  const returnTo = safeReturnTo(input && typeof input === 'object' && 'returnTo' in input ? input.returnTo : null);
  const response = NextResponse.json({
    clientId: config.clientId,
    scope: config.scope,
    redirectUri: `${request.nextUrl.origin}/klarna/identity/callback`,
  }, { headers: privateHeaders });
  response.cookies.set(KLARNA_IDENTITY_STATE_COOKIE, createKlarnaState(returnTo, config.key), {
    httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'lax',
    path: '/api/identity/klarna', maxAge: klarnaStateMaxAge,
  });
  return response;
}

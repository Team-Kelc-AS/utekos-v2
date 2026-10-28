import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { privateHeaders, sameOrigin } from '@/lib/cart/request';
import {
  KLARNA_IDENTITY_SESSION_COOKIE, KLARNA_IDENTITY_STATE_COOKIE,
  createKlarnaSession, klarnaIdentityConfig, klarnaSessionMaxAge,
  readKlarnaState, verifyKlarnaIdToken,
} from '@/lib/klarna/identity';

const inputSchema = z.strictObject({ idToken: z.string().min(100).max(12000) });

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 403, headers: privateHeaders });
  const config = klarnaIdentityConfig();
  if (!config) return NextResponse.json({ error: 'Klarna-innlogging er ikke tilgjengelig.' }, { status: 503, headers: privateHeaders });
  if (Number(request.headers.get('content-length')) > 16384) return NextResponse.json({ error: 'Forespørselen er for stor.' }, { status: 413, headers: privateHeaders });
  const body = await request.text();
  if (Buffer.byteLength(body) > 16384) return NextResponse.json({ error: 'Forespørselen er for stor.' }, { status: 413, headers: privateHeaders });
  let value: unknown;
  try { value = JSON.parse(body); } catch { value = null; }
  const input = inputSchema.safeParse(value);
  if (!input.success) return NextResponse.json({ error: 'Ugyldig Klarna-svar.' }, { status: 400, headers: privateHeaders });
  const state = readKlarnaState(request.cookies.get(KLARNA_IDENTITY_STATE_COOKIE)?.value, config.key);
  if (!state) return NextResponse.json({ error: 'Innloggingen er utløpt. Prøv igjen.' }, { status: 403, headers: privateHeaders });
  try {
    const identity = await verifyKlarnaIdToken(input.data.idToken, config.clientId, config.issuer);
    const response = NextResponse.json({ returnTo: state.returnTo }, { headers: privateHeaders });
    response.cookies.set(KLARNA_IDENTITY_SESSION_COOKIE, createKlarnaSession(identity, config.key), {
      httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'lax',
      path: '/', maxAge: klarnaSessionMaxAge,
    });
    response.cookies.set(KLARNA_IDENTITY_STATE_COOKIE, '', {
      httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'lax',
      path: '/api/identity/klarna', maxAge: 0,
    });
    return response;
  } catch {
    const response = NextResponse.json({ error: 'Klarna-identiteten kunne ikke bekreftes. Prøv igjen.' }, { status: 401, headers: privateHeaders });
    response.cookies.set(KLARNA_IDENTITY_STATE_COOKIE, '', {
      httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'lax',
      path: '/api/identity/klarna', maxAge: 0,
    });
    return response;
  }
}

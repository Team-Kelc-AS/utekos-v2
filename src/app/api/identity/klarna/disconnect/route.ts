import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { privateHeaders, sameOrigin } from '@/lib/cart/request';
import { KLARNA_IDENTITY_SESSION_COOKIE, KLARNA_IDENTITY_STATE_COOKIE } from '@/lib/klarna/identity';

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 403, headers: privateHeaders });
  const response = NextResponse.json({ disconnected: true }, { headers: privateHeaders });
  response.cookies.delete(KLARNA_IDENTITY_SESSION_COOKIE);
  response.cookies.set(KLARNA_IDENTITY_STATE_COOKIE, '', {
    httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'lax',
    path: '/api/identity/klarna', maxAge: 0,
  });
  return response;
}

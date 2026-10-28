import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { privateHeaders } from '@/lib/cart/request';
import { KLARNA_IDENTITY_SESSION_COOKIE, klarnaIdentityConfig, readKlarnaSession } from '@/lib/klarna/identity';

export async function GET(request: NextRequest) {
  const config = klarnaIdentityConfig();
  if (!config) return NextResponse.json({ available: false, connected: false, originSupported: false }, { headers: privateHeaders });
  const originSupported = request.nextUrl.origin === config.redirectOrigin;
  const session = originSupported ? readKlarnaSession(request.cookies.get(KLARNA_IDENTITY_SESSION_COOKIE)?.value) : null;
  return NextResponse.json({
    available: true,
    ...(originSupported ? { clientId: config.clientId } : {}),
    originSupported,
    connected: !!session,
    ...(session ? { email: session.email, name: session.name } : {}),
  }, { headers: privateHeaders });
}

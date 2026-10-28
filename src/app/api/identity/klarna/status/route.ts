import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { privateHeaders } from '@/lib/cart/request';
import { KLARNA_IDENTITY_SESSION_COOKIE, klarnaIdentityConfig, readKlarnaSession } from '@/lib/klarna/identity';

export async function GET(request: NextRequest) {
  const config = klarnaIdentityConfig();
  if (!config) return NextResponse.json({ available: false, connected: false }, { headers: privateHeaders });
  const session = readKlarnaSession(request.cookies.get(KLARNA_IDENTITY_SESSION_COOKIE)?.value);
  return NextResponse.json({
    available: true,
    clientId: config.clientId,
    connected: !!session,
    ...(session ? { email: session.email, name: session.name } : {}),
  }, { headers: privateHeaders });
}

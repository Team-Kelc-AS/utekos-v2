import { NextRequest, NextResponse } from 'next/server';
import { FACEBOOK_SESSION_COOKIE } from '@/lib/facebook-login/session';
import { sameOrigin, privateHeaders } from '@/lib/cart/request';
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 403, headers: privateHeaders });
  const response = NextResponse.json({ connected: false }, { headers: privateHeaders });
  response.cookies.delete(FACEBOOK_SESSION_COOKIE); return response;
}

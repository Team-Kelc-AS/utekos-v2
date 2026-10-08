import { NextRequest, NextResponse } from 'next/server';
import { readSession, FACEBOOK_SESSION_COOKIE } from '@/lib/facebook-login/session';
import { privateHeaders } from '@/lib/cart/request';
export async function GET(request: NextRequest) {
  return NextResponse.json({ connected: !!readSession(request.cookies.get(FACEBOOK_SESSION_COOKIE)?.value, 'session')?.userId }, { headers: privateHeaders });
}

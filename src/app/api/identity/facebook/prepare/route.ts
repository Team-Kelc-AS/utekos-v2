import { NextRequest, NextResponse } from 'next/server';
import { facebookConfig, sealSession, FACEBOOK_STATE_COOKIE } from '@/lib/facebook-login/session';
import { sameOrigin, privateHeaders } from '@/lib/cart/request';
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 403, headers: privateHeaders });
  try {
    const config = facebookConfig();
    const response = NextResponse.json({ clientConfig: { appId: config.appId, apiVersion: config.apiVersion } }, { headers: privateHeaders });
    response.cookies.set(FACEBOOK_STATE_COOKIE, sealSession({ expiresAt: Date.now() + 600000 }, 'state'), { httpOnly: true, sameSite: 'lax', secure: request.nextUrl.protocol === 'https:', path: '/api/identity/facebook', maxAge: 600 });
    return response;
  } catch { return NextResponse.json({ error: 'Facebook er ikke tilgjengelig. Fortsett med e-post.' }, { status: 503, headers: privateHeaders }); }
}

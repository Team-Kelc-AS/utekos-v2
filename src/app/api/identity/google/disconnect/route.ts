import { NextRequest, NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/cart/request';
import { createGoogleAuthClient, googleAuthConfig, googleAuthHeaders } from '@/lib/customer-auth/google';

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 403, headers: googleAuthHeaders });
  const config = googleAuthConfig();
  if (!config || request.nextUrl.origin !== config.origin) {
    return NextResponse.json({ error: 'Innlogging er midlertidig utilgjengelig.' }, { status: 503, headers: googleAuthHeaders });
  }
  const auth = createGoogleAuthClient(request, config);
  const { error } = await auth.supabase.auth.signOut({ scope: 'local' });
  if (error) return NextResponse.json({ error: 'Kunne ikke logge ut. Prøv igjen.' }, { status: 503, headers: googleAuthHeaders });
  return auth.clearSession(auth.applyCookies(NextResponse.json({ authenticated: false }, { headers: googleAuthHeaders })));
}

import { NextRequest, NextResponse } from 'next/server';
import { createGoogleAuthClient, googleAuthConfig, googleAuthHeaders } from '@/lib/customer-auth/google';

export async function GET(request: NextRequest) {
  const config = googleAuthConfig();
  if (!config || request.nextUrl.origin !== config.origin) {
    return NextResponse.json({ authenticated: false }, { headers: googleAuthHeaders });
  }
  const auth = createGoogleAuthClient(request, config);
  const { data, error } = await auth.supabase.auth.getUser();
  const authenticated = !error && !!data.user?.email_confirmed_at && !!data.user.identities?.some(identity => identity.provider === 'google');
  return auth.applyCookies(NextResponse.json({ authenticated }, { headers: googleAuthHeaders }));
}

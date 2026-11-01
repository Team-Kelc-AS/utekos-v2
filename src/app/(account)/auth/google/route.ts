import { NextRequest, NextResponse } from 'next/server';
import { createGoogleAuthClient, googleAuthConfig, googleAuthHeaders, GOOGLE_RETURN_COOKIE, GOOGLE_VERIFIER_COOKIE, safeGoogleReturnTo } from '@/lib/customer-auth/google';

export async function GET(request: NextRequest) {
  const returnTo = safeGoogleReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const config = googleAuthConfig();
  const failure = (reason: string) => {
    const url = new URL('/auth/error', request.nextUrl.origin);
    url.search = new URLSearchParams({ reason, returnTo }).toString();
    return NextResponse.redirect(url, { headers: googleAuthHeaders });
  };
  if (!config || request.nextUrl.origin !== config.origin) return failure('unavailable');
  const auth = createGoogleAuthClient(request, config);
  const { data, error } = await auth.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${config.origin}/auth/callback`,
      skipBrowserRedirect: true,
      scopes: 'email profile',
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error || !data.url) return auth.applyCookies(failure('unavailable'));

  // Resolve the provider's redirect before navigating, so configuration errors
  // are shown on Utekos rather than as a raw Supabase JSON response.
  let providerResponse: Response;
  try {
    providerResponse = await fetch(data.url, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(15000) });
  } catch {
    return auth.applyCookies(failure('unavailable'));
  }
  const location = providerResponse.headers.get('location');
  const destination = location ? URL.parse(location) : null;
  if (![302, 303, 307].includes(providerResponse.status) || destination?.origin !== 'https://accounts.google.com') {
    const response = auth.applyCookies(failure('unavailable'));
    response.cookies.set(GOOGLE_VERIFIER_COOKIE, '', { ...auth.cookieOptions, maxAge: 0 });
    return response;
  }
  const response = auth.applyCookies(NextResponse.redirect(destination, { headers: googleAuthHeaders }));
  response.cookies.set(GOOGLE_RETURN_COOKIE, returnTo, { ...auth.cookieOptions, maxAge: 600 });
  return response;
}

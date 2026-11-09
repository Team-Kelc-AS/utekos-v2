import { NextRequest, NextResponse } from 'next/server';
import { createGoogleAuthClient, googleAuthConfig, googleAuthHeaders, GOOGLE_RETURN_COOKIE, GOOGLE_VERIFIER_COOKIE, safeGoogleReturnTo } from '@/lib/customer-auth/google';

export async function GET(request: NextRequest) {
  const returnTo = safeGoogleReturnTo(request.cookies.get(GOOGLE_RETURN_COOKIE)?.value);
  const config = googleAuthConfig();
  const finish = (response: NextResponse) => {
    const options = { path: '/', httpOnly: true, sameSite: 'lax', secure: request.nextUrl.protocol === 'https:', maxAge: 0 } as const;
    response.cookies.set(GOOGLE_RETURN_COOKIE, '', options);
    response.cookies.set(GOOGLE_VERIFIER_COOKIE, '', options);
    return response;
  };
  const failure = (reason: string) => {
    const url = new URL('/auth/error', request.nextUrl.origin);
    url.search = new URLSearchParams({ reason, returnTo }).toString();
    return finish(NextResponse.redirect(url, { headers: googleAuthHeaders }));
  };
  if (request.nextUrl.searchParams.has('error')) return failure('cancelled');
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return failure('expired');
  if (!config || request.nextUrl.origin !== config.origin) return failure('unavailable');

  const auth = createGoogleAuthClient(request, config);
  const flowId = request.nextUrl.searchParams.get('sb_flow_id');
  const { error } = await auth.supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
  if (error) return auth.clearSession(failure('expired'));
  // Verify with Auth; cookie contents alone are never authentication proof.
  const { data, error: userError } = await auth.supabase.auth.getUser();
  if (userError || !data.user?.email_confirmed_at || !data.user.identities?.some(identity => identity.provider === 'google')) {
    return auth.clearSession(failure('verification'));
  }
  return finish(auth.applyCookies(NextResponse.redirect(new URL(returnTo, config.origin), { headers: googleAuthHeaders })));
}

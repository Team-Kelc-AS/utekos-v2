import 'server-only';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

export const GOOGLE_RETURN_COOKIE = 'utekos_google_return';
export const CUSTOMER_AUTH_COOKIE = 'utekos_customer_auth_session';
export const GOOGLE_VERIFIER_COOKIE = `${CUSTOMER_AUTH_COOKIE}-code-verifier`;
export const googleAuthHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
};

export function safeGoogleReturnTo(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048 ||
      !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value)) return '/';
  const path = new URL(value, 'https://utekos.no').pathname;
  return path === '/auth' || path.startsWith('/auth/') ? '/' : value;
}

export function googleAuthConfig() {
  const url = process.env.CUSTOMER_AUTH_SUPABASE_URL;
  const key = process.env.CUSTOMER_AUTH_SUPABASE_PUBLISHABLE_KEY;
  const origin = process.env.CUSTOMER_ACCOUNT_ORIGIN ?? 'https://utekos.no';
  if (!url || !key?.startsWith('sb_publishable_') || url === '[SENSITIVE]') return null;
  const provider = URL.parse(url);
  const site = URL.parse(origin);
  if (!provider || provider.protocol !== 'https:' || !site || site.origin !== origin ||
      (site.protocol !== 'https:' && !(site.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(site.hostname)))) return null;
  return { url: provider.origin, key, origin: site.origin };
}

export function createGoogleAuthClient(request: NextRequest, config: NonNullable<ReturnType<typeof googleAuthConfig>>) {
  const pendingCookies = new Map<string, { name: string; value: string; options: CookieOptions }>();
  const cookieOptions = {
    path: '/', httpOnly: true, sameSite: 'lax', secure: config.origin.startsWith('https:'),
  } as const;
  const supabase = createServerClient(config.url, config.key, {
    cookieOptions: { ...cookieOptions, name: CUSTOMER_AUTH_COOKIE, maxAge: 30 * 86400 },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: cookies => {
        for (const cookie of cookies) {
          pendingCookies.set(cookie.name, cookie);
          request.cookies.set(cookie.name, cookie.value);
        }
      },
    },
    global: {
      fetch: (input, init) => fetch(input, {
        ...init, cache: 'no-store',
        signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
      }),
    },
  });
  return {
    supabase,
    cookieOptions,
    applyCookies(response: NextResponse) {
      for (const { name, value, options } of pendingCookies.values()) {
        response.cookies.set(name, value, {
          ...options, ...cookieOptions,
          ...(name.startsWith(`${CUSTOMER_AUTH_COOKIE}-`) && name.endsWith('-code-verifier') && options.maxAge !== 0 ? { maxAge: 600 } : {}),
        });
      }
      return response;
    },
    clearSession(response: NextResponse) {
      const names = new Set([...request.cookies.getAll().map(cookie => cookie.name), ...pendingCookies.keys()]);
      for (const name of names) {
        if (name === CUSTOMER_AUTH_COOKIE || name.startsWith(`${CUSTOMER_AUTH_COOKIE}.`)) {
          response.cookies.set(name, '', { ...cookieOptions, maxAge: 0 });
        }
      }
      return response;
    },
  };
}

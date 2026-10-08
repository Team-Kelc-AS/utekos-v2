import type { NextRequest } from 'next/server';
export const privateHeaders = { 'Cache-Control': 'private, no-store, max-age=0' };
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return !!origin && origin === request.nextUrl.origin;
}
export function buyerIp(request: NextRequest) {
  // Vercel overwrites x-vercel-forwarded-for; do not trust a caller-supplied general XFF.
  return process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() : undefined;
}

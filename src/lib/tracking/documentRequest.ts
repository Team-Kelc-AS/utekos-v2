import type { NextRequest } from 'next/server'

const STATIC_ASSET_PATH_PATTERN =
  /\.(?:avif|bmp|css|csv|gif|ico|jpe?g|js|json|map|mp3|mp4|pdf|png|svg|txt|webmanifest|webp|woff2?|xml)$/i

/** Match full HTML navigations only, never prefetches or the RSC stream. */
export function isDocumentNavigation(request: NextRequest): boolean {
  if (request.method !== 'GET') return false
  if (STATIC_ASSET_PATH_PATTERN.test(request.nextUrl.pathname)) return false
  if (request.headers.get('rsc') === '1') return false
  if (request.headers.has('next-router-prefetch')) return false
  if (request.headers.get('purpose')?.toLowerCase() === 'prefetch') return false

  const destination = request.headers.get('sec-fetch-dest')
  if (destination) return destination === 'document'
  return request.headers.get('accept')?.includes('text/html') ?? false
}

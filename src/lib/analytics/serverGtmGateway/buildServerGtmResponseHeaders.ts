const RESPONSE_HEADERS_TO_REMOVE = [
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade'
] as const

type GatewayResponseContext = {
  method: string
  pathname: string
  status: number
}

function privateGoogleScriptCache(
  headers: Headers,
  context?: GatewayResponseContext
) {
  // Chromium uses the opaque path; Stape's Safari Cookie Keeper branch uses
  // /gtag/js. Both are distinct from event transport and Cookie Keeper itself.
  // Never enable shared/server-side caching.
  if (
    !context ||
    !['GET', 'HEAD'].includes(context.method) ||
    context.status !== 200 ||
    !(context.pathname === '/gtag/js' || /^\/fps\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]{16,}$/.test(context.pathname)) ||
    !/^(?:application|text)\/javascript(?:\s*;|$)/i.test(headers.get('content-type') ?? '') ||
    headers.has('set-cookie') ||
    headers.get('vary')?.split(',').some(value => value.trim() === '*')
  ) return null

  const cacheControl = headers.get('cache-control')
  const directives = cacheControl?.toLowerCase().split(',').map(value => value.trim()) ?? []
  const maxAges = directives.filter(value => value.startsWith('max-age'))
  const maxAge = maxAges.length === 1 ? /^max-age=(\d+)$/.exec(maxAges[0]) : null
  if (
    !directives.includes('private') ||
    directives.some(value => /^(?:public|no-store|no-cache)(?:=|$)/.test(value)) ||
    !maxAge || Number(maxAge[1]) < 1 || Number(maxAge[1]) > 900
  ) return null

  return cacheControl
}

export function buildServerGtmResponseHeaders(
  upstreamHeaders: Headers,
  context?: GatewayResponseContext
) {
  const headers = new Headers(upstreamHeaders)

  for (const name of RESPONSE_HEADERS_TO_REMOVE) {
    headers.delete(name)
  }

  headers.set('Cache-Control', privateGoogleScriptCache(upstreamHeaders, context) ?? 'no-store, max-age=0')
  headers.set('CDN-Cache-Control', 'no-store')
  headers.set('Vercel-CDN-Cache-Control', 'no-store')

  return headers
}

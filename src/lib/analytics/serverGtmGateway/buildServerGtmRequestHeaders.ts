const REQUEST_HEADERS_TO_REMOVE = [
  'authorization',
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authorization',
  'proxy-authenticate',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'x-vercel-protection-bypass',
  'x-vercel-oidc-token'
] as const

// Storefront authorization is never an input to Stape cookie restoration.
const PRIVATE_STOREFRONT_COOKIES = new Set([
  'utekos_cart',
  'cartId',
  'utekos_v2_fb_session',
  'utekos_v2_fb_state',
  'utekos_fb_login_oauth',
  'utekos_fb_login_identity'
])

export function buildServerGtmRequestHeaders(request: Request) {
  const headers = new Headers(request.headers)
  const host = headers.get('host')

  for (const name of REQUEST_HEADERS_TO_REMOVE) {
    headers.delete(name)
  }

  // Integration credentials/context belong only to the authenticated backend bridge.
  for (const name of [...headers.keys()]) {
    if (name.startsWith('x-utekos-')) headers.delete(name)
  }

  const cookies = headers.get('cookie')
  if (cookies) {
    const publicCookies = cookies.split(';').filter(part => {
      const separator = part.indexOf('=')
      return separator > 0 && !PRIVATE_STOREFRONT_COOKIES.has(part.slice(0, separator).trim())
    }).map(part => part.trim()).join('; ')
    if (publicCookies) headers.set('cookie', publicCookies)
    else headers.delete('cookie')
  }

  headers.set('accept-encoding', 'identity')
  if (host) headers.set('x-forwarded-host', host)
  if (!headers.has('x-forwarded-proto')) {
    headers.set(
      'x-forwarded-proto',
      new URL(request.url).protocol.replace(':', '')
    )
  }

  return headers
}

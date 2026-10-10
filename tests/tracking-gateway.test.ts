import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import { NextRequest, NextResponse } from 'next/server'
import { buildServerGtmUpstreamUrl } from '../src/lib/analytics/serverGtmGateway/buildServerGtmUpstreamUrl'
import { proxyServerGtmRequest } from '../src/lib/analytics/serverGtmGateway/proxyServerGtmRequest'
import { applyCookieKeeperUserIdCookie } from '../src/lib/analytics/server/stapeCookieKeeperUserId'
import { withoutTrackingQuery } from '../src/lib/analytics/withoutTrackingQuery'
import { isDocumentNavigation } from '../src/lib/tracking/documentRequest'
import { isTrackingOrigin, trackingEnvironmentAllowsProduction } from '../src/lib/tracking/environment'
import { GOOGLE_TAG_MANAGER_BOOTSTRAP } from '../src/lib/tracking/googleTagManagerBootstrap'
import { STAPE_CUSTOM_LOADER } from '../src/lib/tracking/stapeCustomLoader'
import { telemetryRewriteUrl } from '../src/lib/tracking/telemetryRoutes'
import { proxy } from '../src/proxy'
import { POST as gatewayPOST } from '../src/app/%5F_sgtm/[[...path]]/route'

test('Stape gateway preserves the body, query, visitor headers and independent cookies', async () => {
  let calls = 0
  const response = await proxyServerGtmRequest(new Request('https://utekos.no/__sgtm/data?v=2', {
    method: 'POST', body: 'fixture-payload', headers: {
      'Host': 'utekos.no', 'Cookie': 'user_id=fixture; _fbp=fixture-browser; utekos_cart=fixture-cart-secret; cartId=fixture-legacy-key; utekos_v2_fb_session=fixture-session; utekos_v2_fb_state=fixture-state',
      'X-Forwarded-For': '192.0.2.1', 'User-Agent': 'fixture-agent',
      'Authorization': 'Bearer fixture-secret', 'X-Vercel-Protection-Bypass': 'fixture-bypass',
      'X-Vercel-Oidc-Token': 'fixture-oidc', 'X-Utekos-Tracking-Context': 'fixture-context',
    },
  }), { params: Promise.resolve({ path: ['data'] }) }, async (url, init) => {
    calls++
    assert.equal(String(url), 'https://edge.utekos.no/data?v=2')
    assert.equal(init?.cache, 'no-store')
    assert.equal(init?.redirect, 'manual')
    assert.ok(init?.signal)
    assert.equal(new TextDecoder().decode(init?.body as ArrayBuffer), 'fixture-payload')
    const headers = new Headers(init?.headers)
    assert.equal(headers.get('cookie'), 'user_id=fixture; _fbp=fixture-browser')
    assert.equal(headers.get('x-forwarded-for'), '192.0.2.1')
    assert.equal(headers.get('user-agent'), 'fixture-agent')
    assert.equal(headers.get('x-forwarded-host'), 'utekos.no')
    for (const name of ['host', 'authorization', 'x-vercel-protection-bypass', 'x-vercel-oidc-token', 'x-utekos-tracking-context']) {
      assert.equal(headers.get(name), null, name)
    }
    const upstream = new Headers({ 'Cache-Control': 'public, max-age=86400', 'Content-Encoding': 'gzip', 'Content-Length': '123' })
    upstream.append('Set-Cookie', '_ga=fixture-ga; Path=/; Secure')
    upstream.append('Set-Cookie', '_fbp=fixture-fbp; Path=/; Secure')
    return new Response('fixture-response', { status: 202, headers: upstream })
  })
  assert.equal(calls, 1)
  assert.equal(response.status, 202)
  assert.equal(await response.text(), 'fixture-response')
  assert.equal(response.headers.getSetCookie().length, 2)
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0')
  assert.equal(response.headers.get('cdn-cache-control'), 'no-store')
  assert.equal(response.headers.get('vercel-cdn-cache-control'), 'no-store')
  assert.equal(response.headers.get('content-length'), null)
  assert.equal(response.headers.get('content-encoding'), null)
})

test('invalid Stape paths fail without fetch; provider errors have no private details and no retry', async () => {
  for (const path of [['..'], ['.'], ['a/b'], ['a\\b'], ['x'.repeat(257)], Array(33).fill('a')]) {
    assert.equal(buildServerGtmUpstreamUrl(path, ''), null)
  }
  let calls = 0
  const invalid = await proxyServerGtmRequest(new Request('https://utekos.no/__sgtm/x'), {
    params: Promise.resolve({ path: ['..'] }),
  }, async () => { calls++; throw new Error('fixture-private-detail') })
  assert.equal(invalid.status, 400)
  assert.equal(calls, 0)
  const failed = await proxyServerGtmRequest(new Request('https://utekos.no/__sgtm/data'), {
    params: Promise.resolve({ path: ['data'] }),
  }, async () => { calls++; throw new Error('fixture-private-detail') })
  assert.equal(failed.status, 502)
  assert.equal(calls, 1)
  assert.equal(await failed.text(), '')
  assert.equal(failed.headers.get('cache-control'), 'no-store, max-age=0')
})

test('Cookie Keeper retains valid identity and sets 400-day server cookie with no-store', () => {
  const id = '0123456789abcdef0123456789abcdef'
  const response = applyCookieKeeperUserIdCookie(NextResponse.next(), new NextRequest('https://www.utekos.no/produkter', {
    headers: { cookie: `user_id=${id}` },
  }))
  const cookie = response.cookies.get('user_id')
  assert.equal(cookie?.value, id)
  assert.equal(cookie?.maxAge, 400 * 86400)
  assert.equal(cookie?.domain, 'utekos.no')
  assert.equal(cookie?.httpOnly, false)
  assert.equal(cookie?.secure, true)
  assert.equal(cookie?.sameSite, 'lax')
  assert.match(response.headers.get('cache-control') ?? '', /private.*no-store/)
})

test('only real document navigation qualifies for Cookie Keeper writes', () => {
  const request = (headers: HeadersInit = {}, path = '/') => new NextRequest(`https://utekos.no${path}`, {
    headers: { accept: 'text/html', ...headers },
  })
  assert.equal(isDocumentNavigation(request()), true)
  const nonDocumentHeaders: Record<string, string>[] = [{ rsc: '1' }, { 'next-router-prefetch': '1' }, { purpose: 'prefetch' }, { 'sec-fetch-dest': 'script' }]
  for (const headers of nonDocumentHeaders) {
    assert.equal(isDocumentNavigation(request(headers)), false)
  }
  assert.equal(isDocumentNavigation(request({}, '/asset.js')), false)
})

test('production gate requires explicit opt-in and verified production environment', () => {
  const production = { NEXT_PUBLIC_TRACKING_ENABLED: 'true', NEXT_PUBLIC_VERCEL_ENV: 'production', VERCEL_ENV: 'production' }
  assert.equal(trackingEnvironmentAllowsProduction(production, true), true)
  assert.equal(trackingEnvironmentAllowsProduction(production, false), true)
  assert.equal(trackingEnvironmentAllowsProduction({}, true), false)
  assert.equal(trackingEnvironmentAllowsProduction({ ...production, VERCEL_ENV: 'preview' }, true), false)
  assert.equal(trackingEnvironmentAllowsProduction({ ...production, NEXT_PUBLIC_VERCEL_ENV: 'preview' }, false), false)
  assert.equal(trackingEnvironmentAllowsProduction({ ...production, NEXT_PUBLIC_TRACKING_ENABLED: 'false' }, false), false)
  for (const url of ['http://utekos.no', 'https://utekos.no:444', 'https://backend.utekos.no', 'https://utekos.no.evil.test', 'https://user@utekos.no', 'https://deployment.vercel.app']) {
    assert.equal(isTrackingOrigin(url), false, url)
  }
  assert.equal(isTrackingOrigin('https://utekos.no/produkter?fixture=1'), true)
  assert.equal(isTrackingOrigin('https://www.utekos.no'), true)
})

test('bootstrap sets granted defaults before any vendor starts without forging a user choice', () => {
  const window = { location: { href: 'https://utekos.no/produkter?variant=1#detail' }, dataLayer: [] as unknown[][] }
  vm.runInNewContext(GOOGLE_TAG_MANAGER_BOOTSTRAP, { window, URL })
  const first = Array.from(window.dataLayer[0])
  assert.deepEqual(first.slice(0, 2), ['consent', 'default'])
  assert.deepEqual(JSON.parse(JSON.stringify(first[2])), {
    ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted',
  })
  assert.equal(JSON.stringify(window.dataLayer).includes('cookiebot'), false)
})

test('unchanged Stape loader uses the first-party Cookie Keeper branch with a Safari master cookie', () => {
  const master = '0123456789abcdef0123456789abcdef'
  const load = (userAgent: string, cookie: string) => {
    let script = ''
    const parentNode = { insertBefore: (element: { src: string }) => { script = element.src } }
    const window = { dataLayer: [] }
    vm.runInNewContext(STAPE_CUSTOM_LOADER, {
      window, navigator: { userAgent }, console,
      document: { cookie, getElementsByTagName: () => [{ parentNode }], createElement: () => ({ src: '', async: false }) },
    })
    return new URL(script)
  }
  const safari = load('Version/17.0 Mobile Safari/605.1.15', `user_id=${master}`)
  assert.equal(safari.origin, 'https://utekos.no')
  assert.equal(safari.pathname, '/__sgtm/apkpgqnrnczg.js')
  assert.equal(safari.searchParams.get('bi'), master)
  const noMaster = load('Version/17.0 Mobile Safari/605.1.15', '')
  assert.equal(noMaster.origin, 'https://load.edge.utekos.no')
  assert.equal(noMaster.searchParams.get('bi'), null)
})

test('telemetry mapping is fixed and URL redaction removes query and fragment', () => {
  assert.equal(telemetryRewriteUrl(new URL('https://utekos.no/telemetry/v1/vitals'))?.href, 'https://utekos.no/_vercel/speed-insights/vitals')
  assert.equal(telemetryRewriteUrl(new URL('https://utekos.no/telemetry/v1/arbitrary')), null)
  assert.equal(withoutTrackingQuery('https://utekos.no/p?email=fixture@example.test&fbclid=fixture#secret'), 'https://utekos.no/p')
})

test('generated loader and reviewed contracts match their recorded provenance', () => {
  const manifest = JSON.parse(readFileSync(new URL('../docs/tracking/gateway-source-manifest.json', import.meta.url), 'utf8'))
  assert.equal(manifest.sourceCommit, 'e74e6cd8310c88f2777cbfdf5ad6b431647d7f77')
  for (const file of manifest.files as { target: string; sourceSha256: string; adapted: boolean; reviewedTargetSha256?: string; generatedScriptSha256?: string; reason?: string }[]) {
    if (file.adapted) continue
    const data = readFileSync(new URL(`../${file.target}`, import.meta.url))
    if (file.reviewedTargetSha256) assert.ok(file.reason, 'reviewed formatting requires an explanation')
    assert.equal(createHash('sha256').update(data).digest('hex'), file.reviewedTargetSha256 ?? file.sourceSha256, file.target)
    if (file.target === 'src/lib/tracking/stapeCustomLoader.ts') {
      assert.equal(createHash('sha256').update(STAPE_CUSTOM_LOADER).digest('hex'), file.generatedScriptSha256, 'generated executable Stape loader')
    }
  }
})

test('preview/local gateway rejects requests before fetch and the proxy writes no identities', async () => {
  const saved = { enabled: process.env.NEXT_PUBLIC_TRACKING_ENABLED, publicEnv: process.env.NEXT_PUBLIC_VERCEL_ENV, serverEnv: process.env.VERCEL_ENV }
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new Error('No network allowed') }
  try {
    process.env.NEXT_PUBLIC_TRACKING_ENABLED = 'true'
    process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview'
    process.env.VERCEL_ENV = 'preview'
    const response = await gatewayPOST(new Request('https://utekos.no/__sgtm/data', { method: 'POST', body: 'fixture' }), { params: Promise.resolve({ path: ['data'] }) })
    assert.equal(response.status, 404)
    assert.equal(calls, 0)
    const document = proxy(new NextRequest('https://utekos.no/?fbclid=fixture', { headers: { accept: 'text/html' } }))
    assert.equal(document.headers.getSetCookie().length, 0)
    const telemetry = proxy(new NextRequest('https://utekos.no/telemetry/v1/view', { method: 'POST' }))
    assert.equal(telemetry.status, 404)
    assert.equal(telemetry.headers.get('x-middleware-rewrite'), null)
    process.env.NEXT_PUBLIC_VERCEL_ENV = 'production'
    process.env.VERCEL_ENV = 'production'
    const alias = await gatewayPOST(new Request('https://fixture.vercel.app/__sgtm/data', { method: 'POST', body: 'fixture' }), { params: Promise.resolve({ path: ['data'] }) })
    assert.equal(alias.status, 404)
    assert.equal(calls, 0)
  } finally {
    globalThis.fetch = originalFetch
    for (const [key, value] of Object.entries({ NEXT_PUBLIC_TRACKING_ENABLED: saved.enabled, NEXT_PUBLIC_VERCEL_ENV: saved.publicEnv, VERCEL_ENV: saved.serverEnv })) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('production document proxy captures genuine URL click once and retains browser IDs on return', () => {
  const saved = { ...process.env }
  try {
    process.env.NEXT_PUBLIC_TRACKING_ENABLED = 'true'
    process.env.NEXT_PUBLIC_VERCEL_ENV = 'production'
    process.env.VERCEL_ENV = 'production'
    const response = proxy(new NextRequest('https://utekos.no/?fbclid=fixture-click-id', { headers: { accept: 'text/html' } }))
    const fbc = response.cookies.get('_fbc')?.value
    const fbp = response.cookies.get('_fbp')?.value
    const master = response.cookies.get('user_id')?.value
    assert.ok(fbc?.includes('fixture-click-id'))
    assert.ok(fbp)
    assert.match(master ?? '', /^[a-f0-9]{32}$/)
    assert.equal(response.headers.get('cdn-cache-control'), 'no-store')
    const returning = proxy(new NextRequest('https://utekos.no/produkter', { headers: {
      accept: 'text/html', cookie: `_fbc=${fbc}; _fbp=${fbp}; user_id=${master}`,
    } }))
    assert.equal(returning.cookies.get('user_id')?.value, master)
    assert.equal(returning.cookies.get('_fbc'), undefined)
    assert.equal(returning.cookies.get('_fbp'), undefined)
  } finally {
    for (const key of ['NEXT_PUBLIC_TRACKING_ENABLED', 'NEXT_PUBLIC_VERCEL_ENV', 'VERCEL_ENV']) {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    }
  }
})

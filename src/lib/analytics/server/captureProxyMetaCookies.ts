import type { NextRequest } from 'next/server'
import type { CookieSettings } from 'capi-param-builder-nodejs'
import * as z from '@/lib/validation/zodMini'
import { resolveTrackingAuthorization } from '@/lib/consent/resolveTrackingAuthorization'
import { ensureCanonicalMetaBrowserIds } from './ensureCanonicalMetaBrowserIds'
import { readObservedMetaFbclid } from '../metaFbclid'

const observedFbclidSchema = z.string().check(z.minLength(1), z.maxLength(500))
const observedCookieSchema = z.string().check(z.minLength(1), z.maxLength(3800))
const metaCookiePattern = /^fb\.\d+\.\d{13}\.[^;\s]+$/
const cookieSchema = z.strictObject({
  name: z.enum(['_fbp', '_fbc']),
  value: z.string().check(z.minLength(1), z.maxLength(3800)),
  maxAge: z
    .number()
    .check(z.int(), z.minimum(1), z.maximum(7776000))
})

export function captureProxyMetaCookies(
  request: NextRequest
): CookieSettings[] {
  const pageUrl = new URL(request.url)
  const observedFbclid = readObservedMetaFbclid(pageUrl.href).value
  if (pageUrl.searchParams.has('fbclid')) {
    // URLSearchParams also accepts encoded keys and later duplicates. Give the
    // server builder only the same first literal click seen by the client SDK.
    pageUrl.searchParams.delete('fbclid')
    if (observedFbclid && observedFbclidSchema.safeParse(observedFbclid).success) {
      pageUrl.searchParams.set('fbclid', observedFbclid)
    } else {
      console.warn('[tracking] proxy_meta_identifier_skipped', { field: 'fbclid' })
    }
  }
  const observedFbp = request.cookies.get('_fbp')?.value
  const observedFbc = request.cookies.get('_fbc')?.value
  const validCookie = (value: string | undefined) => Boolean(
    value && observedCookieSchema.safeParse(value).success &&
    metaCookiePattern.test(value) && encodeURIComponent(value).length <= 3800
  )
  const fbp = validCookie(observedFbp) ? observedFbp : undefined
  const fbc = validCookie(observedFbc) ? observedFbc : undefined
  if (observedFbp && !fbp) console.warn('[tracking] proxy_meta_identifier_skipped', { field: '_fbp' })
  if (observedFbc && !fbc) console.warn('[tracking] proxy_meta_identifier_skipped', { field: '_fbc' })

  try {
    const captured = ensureCanonicalMetaBrowserIds({
      browserId: {
        ...(fbp ? { fbp } : {}),
        ...(fbc ? { fbc } : {})
      },
      consent: resolveTrackingAuthorization(),
      pageUrl: pageUrl.href
    })
    const cookies: CookieSettings[] = []
    for (const cookie of captured.cookiesToSet) {
      const parsed = cookieSchema.safeParse({
        name: cookie.name,
        value: cookie.value,
        maxAge: cookie.maxAge
      })
      if (!parsed.success || encodeURIComponent(cookie.value).length > 3800) {
        console.warn('[tracking] proxy_meta_cookie_skipped', { field: cookie.name })
        continue
      }
      cookies.push({ ...cookie, ...parsed.data })
    }

    for (const cookie of cookies) {
      request.cookies.set(cookie.name, cookie.value)
    }
    return cookies
  } catch {
    console.error('[tracking] proxy_meta_capture_failed')
    return []
  }
}

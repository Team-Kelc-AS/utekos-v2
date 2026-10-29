import type { NextRequest } from 'next/server'
import type { CookieSettings } from 'capi-param-builder-nodejs'
import * as z from '@/lib/validation/zodMini'
import { resolveTrackingAuthorization } from '@/lib/consent/resolveTrackingAuthorization'
import { ensureCanonicalMetaBrowserIds } from './ensureCanonicalMetaBrowserIds'
import { readObservedMetaFbclid } from '../metaFbclid'
import { extractFbclidFromFbc } from '../extractFbclidFromFbc'

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

function readCookieValues(header: string | null, name: '_fbp' | '_fbc') {
  const values: string[] = []
  let count = 0
  for (const part of header?.split(';') ?? []) {
    const separator = part.indexOf('=')
    if (separator < 1 || part.slice(0, separator).trim() !== name) continue
    count++
    try {
      values.push(decodeURIComponent(part.slice(separator + 1).trim()))
    } catch {
      // A malformed duplicate cannot hide another usable cookie.
    }
  }
  return { values, count }
}

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
  const validCookie = (value: string | undefined) => Boolean(
    value && observedCookieSchema.safeParse(value).success &&
    metaCookiePattern.test(value) && encodeURIComponent(value).length <= 3800
  )
  const cookieHeader = request.headers.get('cookie')
  const selectCookie = (name: '_fbp' | '_fbc') => {
    const observed = readCookieValues(cookieHeader, name)
    const valid = [...new Set(observed.values.filter(validCookie))]
    const eligible = name === '_fbc' && observedFbclid ?
      valid.filter(value => extractFbclidFromFbc(value) === observedFbclid)
    : valid
    const selected = eligible.length === 1 ? eligible[0] : undefined
    // NextRequest.cookies collapses same-name entries before get/getAll. Use
    // the raw header, then pass only the unambiguous value to rendering.
    if (observed.count > 1 || (observed.count > 0 && !selected)) {
      if (selected) request.cookies.set(name, selected)
      else request.cookies.delete(name)
    }
    if (observed.count && !selected &&
      (valid.length === 0 || eligible.length > 1 || !observedFbclid)) {
      console.warn('[tracking] proxy_meta_identifier_skipped', { field: name })
    }
    return selected
  }
  const fbp = selectCookie('_fbp')
  const fbc = selectCookie('_fbc')

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

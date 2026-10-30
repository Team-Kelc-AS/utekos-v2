import type { ConsentSnapshot } from './pageViewEvent'
import { resolveClickIds } from './clickIdSessionStore'
import { resolveTrackingAuthorization } from '@/lib/consent/resolveTrackingAuthorization'
import { readObservedMetaFbclid } from './metaFbclid'
import { selectMetaFbcCookie } from './selectMetaFbcCookie'

const metaCookiePattern = /^fb\.\d+\.\d{13}\.[^;\s]+$/

function readMetaCookie(
  cookieHeader: string,
  name: '_fbc' | '_fbp',
  fbclid?: string
): string | undefined {
  const values: string[] = []
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 1 || part.slice(0, separator).trim() !== name) continue
    try {
      const value = decodeURIComponent(part.slice(separator + 1).trim())
      if (value.length <= 3800 && metaCookiePattern.test(value)) {
        values.push(value)
      }
    } catch {
      // A malformed duplicate does not hide an unambiguous valid value.
    }
  }
  if (name === '_fbc') return selectMetaFbcCookie(values, fbclid)
  const unique = [...new Set(values)]
  return unique.length === 1 ? unique[0] : undefined
}

function parseCookies(
  cookieHeader: string
): Map<string, string> {
  const cookies = new Map<string, string>()

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 1) continue

    const name = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    if (name && value) {
      try {
        cookies.set(name, decodeURIComponent(value))
      } catch {
        // Ignore this malformed cookie without discarding other identifiers.
      }
    }
  }

  return cookies
}

export function getConsentSnapshot(): ConsentSnapshot {
  return resolveTrackingAuthorization()
}

export function extractClickIds(
  pageUrl: string,
  cookieHeader: string = '',
  marketingConsentGranted: boolean = false
) {
  if (!marketingConsentGranted) return undefined
  const epik = parseCookies(cookieHeader).get('_epik')

  return resolveClickIds(
    pageUrl,
    undefined,
    undefined,
    undefined,
    epik ? { epik } : {},
    marketingConsentGranted
  )
}

export function extractBrowserIds(
  cookieHeader: string,
  consent: ConsentSnapshot,
  pageUrl?: string
) {
  const cookies = parseCookies(cookieHeader)
  const identifiers: Record<string, string> = {}

  if (consent.marketing === 'granted') {
    const fbclid = pageUrl ? readObservedMetaFbclid(pageUrl).value : undefined
    const fbp = readMetaCookie(cookieHeader, '_fbp')
    const fbc = readMetaCookie(cookieHeader, '_fbc', fbclid)
    const uetSession = cookies.get('_uetsid')
    const uetVisitor = cookies.get('_uetvid')
    const snapchatCookie = cookies.get('_scid')
    if (fbp) identifiers.fbp = fbp
    if (fbc) identifiers.fbc = fbc
    if (uetSession) identifiers.uet_session = uetSession
    if (uetVisitor) identifiers.uet_visitor = uetVisitor
    if (snapchatCookie) identifiers.sc_cookie1 = snapchatCookie
  }

  if (consent.analytics === 'granted') {
    const gaClient = cookies.get('_ga')
    if (gaClient) identifiers.ga_client = gaClient
  }

  return Object.keys(identifiers).length > 0 ?
      identifiers
    : undefined
}

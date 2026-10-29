'use client'

import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
import * as z from '@/lib/validation/zodMini'
import { buildMetaParameterContextRequestUrl } from './buildMetaParameterContextRequestUrl'
import type { ConsentSnapshot } from './canonicalEventEnvelope'
import type { CanonicalClickIds } from './canonicalSignalContract'
import { clearStoredClickIds, resolveClickIds } from './clickIdSessionStore'
import { extractFbclidFromFbc } from './extractFbclidFromFbc'
import { readObservedMetaFbclid } from './metaFbclid'
import { browserFirstPartyExternalIdStore } from './firstPartyExternalId'
import { metaParameterContextResponseSchema } from './metaParameterContextContract'
import { ensureMetaClientParameterContext, revokeMetaClientParameterContext } from './metaClientParameterBuilder'
import { withoutTrackingQuery } from './withoutTrackingQuery'

type MetaAttributionEvent = {
  browser_id?: Record<string, string> | undefined
  click_id?: CanonicalClickIds | undefined
  consent: ConsentSnapshot
  event_time?: string | undefined
  external_id?: string | undefined
  meta_audience?: unknown
  page_url?: string | undefined
  referrer_url?: string | undefined
}

function marketingAllowed() {
  return typeof window !== 'undefined'
}

const completedContextKeys = new Set<string>()
const META_PARAMETER_CONTEXT_TIMEOUT_MS = 2500
const META_COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60
const META_IDENTIFIER_MAX_AGE_MS = META_COOKIE_MAX_AGE_SECONDS * 1000
const META_IDENTIFIER_SESSION_KEY = 'utekos_meta_identifiers_v1'
const META_IDENTIFIER_LOCAL_KEY = 'utekos_meta_identifiers_v2'
const metaIdentifierSessionSchema = z.strictObject({
  fbc: z.optional(z.string().check(z.minLength(1), z.maxLength(3800))),
  fbp: z.optional(z.string().check(z.minLength(1), z.maxLength(3800))),
  // The old session record has savedAt. Identity age now comes from the
  // original Meta cookie timestamp, so later events cannot extend it.
  savedAt: z.optional(z.number().check(z.int(), z.minimum(1)))
})
let contextSequence: Promise<void> = Promise.resolve()
let firstFbc: string | undefined
let firstFbp: string | undefined
let continuityReported = false
let ambiguousCookieReported = false
let observedPageUrl: string | undefined
let observedPageAtMs = 0
let consentEpoch = 0
let metaConsentRevoked = false
const locallyObservedFbc = new Set<string>()

function readCookieValues(name: string): string[] {
  if (!marketingAllowed()) return []
  const prefix = `${name}=`
  const values: string[] = []
  for (const part of document.cookie.split(';')) {
    const candidate = part.trim()
    if (!candidate.startsWith(prefix)) continue
    try {
      const value = decodeURIComponent(candidate.slice(prefix.length))
      if (value) values.push(value)
    } catch {
      // Keep the conflict visible to readback and the Pixel identity guard.
      values.push('')
    }
  }
  return values
}

function readCookie(name: string): string | undefined {
  const values = [...new Set(readCookieValues(name))]
  return values.length === 1 ? values[0] : undefined
}

function writeMetaCookie(name: '_fbc' | '_fbp', value: string): boolean {
  const createdAt = metaIdentifierTimestamp(value)
  if (createdAt === undefined) return false
  const remainingSeconds = Math.min(
    META_COOKIE_MAX_AGE_SECONDS,
    Math.floor((createdAt + META_IDENTIFIER_MAX_AGE_MS - Date.now()) / 1000)
  )
  if (remainingSeconds < 1) return false
  const hostname = window.location.hostname
  const domain =
    hostname === 'utekos.no' || hostname.endsWith('.utekos.no') ?
      '; Domain=.utekos.no'
    : ''
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  try {
    const cookie = `${name}=${encodeURIComponent(value)}; Path=/; ` +
      `Max-Age=${remainingSeconds}; SameSite=Lax${secure}`
    document.cookie = `${cookie}${domain}`
    if (readCookie(name) === value) return true
    // A host-only cookie can coexist with the domain cookie. Align that
    // scope only for this already validated event identity.
    if (domain) document.cookie = cookie
    return readCookie(name) === value
  } catch {
    return false
  }
}

function metaIdentifierTimestamp(value: string | undefined): number | undefined {
  if (!value) return undefined
  const match = /^fb\.\d+\.(\d{13})\.[^;]+$/.exec(value)
  if (!match) return undefined
  const timestamp = Number(match[1])
  return Number.isSafeInteger(timestamp) && timestamp > 0 ? timestamp : undefined
}

function freshBackup(value: string | undefined, nowMs: number): string | undefined {
  const createdAt = metaIdentifierTimestamp(value)
  return createdAt !== undefined && createdAt <= nowMs + 5 * 60 * 1000 &&
    nowMs - createdAt <= META_IDENTIFIER_MAX_AGE_MS ? value : undefined
}

function observedIdentifier(value: string | undefined, nowMs: number): string | undefined {
  const createdAt = metaIdentifierTimestamp(value)
  // A browser cookie can still exist after its embedded creation time is
  // older than one cookie lifetime. Only storage backups expire by that age.
  return createdAt !== undefined && createdAt <= nowMs + 5 * 60 * 1000 ?
      value
    : undefined
}

function getMetaStorage(name: 'sessionStorage' | 'localStorage'): Storage | undefined {
  try {
    return window[name]
  } catch {
    return undefined
  }
}

function readMetaIdentifierStorage(
  name: 'sessionStorage' | 'localStorage', key: string, nowMs: number
): { fbc?: string; fbp?: string } {
  try {
    const raw = getMetaStorage(name)?.getItem(key)
    if (!raw) return {}
    const parsed = metaIdentifierSessionSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return {}
    const fbc = freshBackup(parsed.data.fbc, nowMs)
    const fbp = freshBackup(parsed.data.fbp, nowMs)
    return { ...(fbc ? { fbc } : {}), ...(fbp ? { fbp } : {}) }
  } catch {
    return {}
  }
}

function saveMetaIdentifierStorage(
  name: 'sessionStorage' | 'localStorage',
  key: string,
  fbc: string | undefined,
  fbp: string | undefined,
  nowMs: number
) {
  try {
    const storage = getMetaStorage(name)
    if (!storage) return
    const storedFbc = freshBackup(fbc, nowMs)
    const storedFbp = freshBackup(fbp, nowMs)
    if (!storedFbc && !storedFbp) {
      storage.removeItem(key)
      return
    }
    const value = JSON.stringify({
      ...(storedFbc ? { fbc: storedFbc } : {}),
      ...(storedFbp ? { fbp: storedFbp } : {})
    })
    if (storage.getItem(key) !== value) storage.setItem(key, value)
  } catch {
    // Cookies remain primary when browser storage is unavailable.
  }
}

function deleteMetaCookie(name: '_fbc' | '_fbp' | '_fbi') {
  const domain = window.location.hostname === 'utekos.no' ||
    window.location.hostname.endsWith('.utekos.no') ? '; Domain=.utekos.no' : ''
  try {
    document.cookie = `${name}=; Path=/; Max-Age=0`
    if (domain) document.cookie = `${name}=; Path=/; Max-Age=0${domain}`
  } catch { /* Cookie storage may be unavailable after consent withdrawal. */ }
}

function removeMetaIdentifiers() {
  firstFbc = undefined
  firstFbp = undefined
  locallyObservedFbc.clear()
  observedPageUrl = undefined
  observedPageAtMs = 0
  completedContextKeys.clear()
  for (const [name, key] of [
    ['sessionStorage', META_IDENTIFIER_SESSION_KEY],
    ['localStorage', META_IDENTIFIER_LOCAL_KEY]
  ] as const) {
    try { getMetaStorage(name)?.removeItem(key) } catch { /* Storage can be unavailable. */ }
  }
  for (const name of ['_fbc', '_fbp', '_fbi'] as const) deleteMetaCookie(name)
  clearStoredClickIds()
}

function reconcileRevokedMetaCollection() {
  if (metaConsentRevoked) {
    removeMetaIdentifiers()
    return
  }
  const nowMs = Date.now()
  const session = readMetaIdentifierStorage('sessionStorage', META_IDENTIFIER_SESSION_KEY, nowMs)
  const durable = readMetaIdentifierStorage('localStorage', META_IDENTIFIER_LOCAL_KEY, nowMs)
  const fbc = chooseFbc(session.fbc, durable.fbc, undefined)
  const fbp = chooseFbp(session.fbp, durable.fbp)
  if (!fbc || !writeMetaCookie('_fbc', fbc)) deleteMetaCookie('_fbc')
  if (!fbp || !writeMetaCookie('_fbp', fbp)) deleteMetaCookie('_fbp')
}

function clearMetaIdentifiers() {
  metaConsentRevoked = true
  consentEpoch++
  revokeMetaClientParameterContext(reconcileRevokedMetaCollection)
  removeMetaIdentifiers()
}

function preferEarlierValue(candidate: string, backup: string) {
  const candidateTime = metaIdentifierTimestamp(candidate)
  const backupTime = metaIdentifierTimestamp(backup)
  if (backupTime !== undefined && (candidateTime === undefined || backupTime <= candidateTime)) return backup
  return candidate
}

function chooseFbc(
  candidate: string | undefined,
  backup: string | undefined,
  urlFbclid: string | undefined
) {
  const candidateClick = extractFbclidFromFbc(candidate)
  const backupClick = extractFbclidFromFbc(backup)
  if (urlFbclid) {
    const current = candidateClick === urlFbclid ? candidate : undefined
    const saved = backupClick === urlFbclid ? backup : undefined
    return current && saved ? preferEarlierValue(current, saved) : current ?? saved
  }
  if (!candidate) return backup
  if (!backup) return candidate
  if (candidateClick && candidateClick === backupClick) return preferEarlierValue(candidate, backup)
  const candidateTime = metaIdentifierTimestamp(candidate) ?? 0
  const backupTime = metaIdentifierTimestamp(backup) ?? 0
  return backupTime > candidateTime ? backup : candidate
}

function chooseFbp(candidate: string | undefined, backup: string | undefined) {
  if (!candidate) return backup
  if (!backup) return candidate
  return preferEarlierValue(candidate, backup)
}

function withoutFbclid(value: string) {
  const url = new URL(value)
  url.searchParams.delete('fbclid')
  return url.href
}

function denyInFlightEvent<E extends MetaAttributionEvent>(event: E): E {
  return {
    ...event,
    consent: { ...event.consent, marketing: 'denied' },
    ...(event.page_url ? { page_url: withoutTrackingQuery(event.page_url) } : {}),
    ...(event.referrer_url ? { referrer_url: withoutTrackingQuery(event.referrer_url) } : {}),
    browser_id: undefined,
    click_id: undefined,
    external_id: undefined,
    meta_audience: undefined
  }
}

function preserveFirstMetaIdentifiers(input: {
  capturedFbc: string | undefined
  capturedFbp: string | undefined
  currentPage: boolean
  fbc: string | undefined
  fbp: string | undefined
  urlFbclid: string | undefined
}) {
  let { fbc, fbp } = input
  if (!input.currentPage) {
    const eventClick = extractFbclidFromFbc(fbc)
    if (eventClick && firstFbc && eventClick === extractFbclidFromFbc(firstFbc)) fbc = firstFbc
    return { fbc, fbp }
  }

  const nowMs = Date.now()
  const observedFbc = observedIdentifier(fbc, nowMs)
  const observedFbp = observedIdentifier(fbp, nowMs)
  fbc = observedFbc &&
    (observedFbc === readCookie('_fbc') || observedFbc === input.capturedFbc) ?
      observedFbc
    : freshBackup(observedFbc, nowMs)
  fbp = observedFbp &&
    (observedFbp === readCookie('_fbp') || observedFbp === input.capturedFbp) ?
      observedFbp
    : freshBackup(observedFbp, nowMs)
  const session = readMetaIdentifierStorage('sessionStorage', META_IDENTIFIER_SESSION_KEY, nowMs)
  const durable = readMetaIdentifierStorage('localStorage', META_IDENTIFIER_LOCAL_KEY, nowMs)
  // The same click retains its first full fbc value. A genuinely newer click
  // wins across tabs, while an explicit URL click always wins on this page.
  for (const backup of [freshBackup(firstFbc, nowMs), session.fbc, durable.fbc]) {
    fbc = chooseFbc(fbc, backup, input.urlFbclid)
  }
  for (const backup of [freshBackup(firstFbp, nowMs), session.fbp, durable.fbp]) {
    fbp = chooseFbp(fbp, backup)
  }

  // Another tab may have recorded a newer click while this event was waiting.
  const latest = readMetaIdentifierStorage('localStorage', META_IDENTIFIER_LOCAL_KEY, nowMs)
  fbc = chooseFbc(fbc, latest.fbc, input.urlFbclid)
  fbp = chooseFbp(fbp, latest.fbp)
  firstFbc = fbc
  firstFbp = fbp
  saveMetaIdentifierStorage('localStorage', META_IDENTIFIER_LOCAL_KEY, fbc, fbp, nowMs)
  saveMetaIdentifierStorage('sessionStorage', META_IDENTIFIER_SESSION_KEY, fbc, fbp, nowMs)
  const fbcNeedsRestore = Boolean(fbc && readCookie('_fbc') !== fbc)
  const fbpNeedsRestore = Boolean(fbp && readCookie('_fbp') !== fbp)
  const restoredFbc = !fbcNeedsRestore || (fbc !== undefined && writeMetaCookie('_fbc', fbc))
  const restoredFbp = !fbpNeedsRestore || (fbp !== undefined && writeMetaCookie('_fbp', fbp))
  if ((fbcNeedsRestore || fbpNeedsRestore) && !continuityReported) {
    continuityReported = true
    reportClientCaughtError(
      new Error(restoredFbc && restoredFbp ?
        'meta_cookie_continuity_repaired'
      : 'meta_cookie_continuity_restore_failed'),
      'meta.identifier_continuity'
    )
  }

  return { fbc, fbp }
}

function enqueueContextRequest<T>(task: () => Promise<T>) {
  const result = contextSequence.then(task)
  contextSequence = result.then(
    () => undefined,
    () => undefined
  )
  return result
}

function readPersistedMetaIdentifiers(
  fbclid: string | undefined
) {
  const fbc = readCookie('_fbc')
  const fbp = readCookie('_fbp')

  if (!fbp) return undefined

  const cookieFbclid = extractFbclidFromFbc(fbc)
  if (fbclid && cookieFbclid !== fbclid) {
    return undefined
  }

  return { ...(fbc ? { fbc } : {}), fbp }
}

async function fetchMetaParameterContext(
  event: MetaAttributionEvent,
  fbclid: string | undefined
) {
  if (!marketingAllowed()) throw new Error('consent_required')
  const pageUrl = event.page_url ?? window.location.href
  const contextPageUrl = readObservedMetaFbclid(pageUrl).invalid ? withoutFbclid(pageUrl) : pageUrl
  const contextReferrerUrl = event.referrer_url && readObservedMetaFbclid(event.referrer_url).invalid ?
    withoutFbclid(event.referrer_url) : event.referrer_url

  const response = await fetch(
    buildMetaParameterContextRequestUrl(fbclid),
    {
      body: JSON.stringify({
        consent: event.consent,
        ...(fbclid ? { fbclid } : {}),
        page_url: contextPageUrl,
        ...(contextReferrerUrl ?
          { referrer_url: contextReferrerUrl }
        : {})
      }),
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      keepalive: true,
      method: 'POST',
      signal: AbortSignal.timeout(
        META_PARAMETER_CONTEXT_TIMEOUT_MS
      )
    }
  )

  if (!response.ok) {
    throw new Error(
      `Meta parameter context returned ${response.status}`
    )
  }

  return metaParameterContextResponseSchema.parse(
    await response.json()
  )
}

async function requestMetaParameterContext(
  event: MetaAttributionEvent,
  fbclid: string | undefined
) {
  const contextKey = fbclid ? `fbclid:${fbclid}` : 'no-fbclid'

  const persisted = readPersistedMetaIdentifiers(fbclid)
  if (completedContextKeys.has(contextKey) && persisted) {
    return persisted
  }

  return enqueueContextRequest(async () => {
    const queuedPersisted = readPersistedMetaIdentifiers(fbclid)
    if (
      completedContextKeys.has(contextKey) &&
      queuedPersisted
    ) {
      return queuedPersisted
    }

    try {
      const identifiers = await fetchMetaParameterContext(event, fbclid)
      completedContextKeys.add(contextKey)
      return identifiers
    } catch (firstError) {
      // Landing race: retry once so first-party _fbp/_fbc can settle.
      if (!fbclid) throw firstError

      await new Promise(resolve => setTimeout(resolve, 150))
      const identifiers = await fetchMetaParameterContext(event, fbclid)
      completedContextKeys.add(contextKey)
      return identifiers
    }
  })
}

export async function enrichCanonicalEventWithMetaAttribution<
  E extends MetaAttributionEvent
>(event: E): Promise<E> {
  if (typeof window === 'undefined') return event
  if (event.consent.marketing !== 'granted') {
    clearMetaIdentifiers()
    return denyInFlightEvent(event)
  }
  metaConsentRevoked = false
  const eventConsentEpoch = consentEpoch

  let identifiers: {
    fbc?: string | undefined
    fbp?: string | undefined
  } = {}
  const pageUrl = event.page_url ?? window.location.href
  const observedUrlFbclid = readObservedMetaFbclid(pageUrl).value
  const liveFbcValues = [...new Set(readCookieValues('_fbc').filter(value =>
    observedIdentifier(value, Date.now()) !== undefined
  ))]
  if (window.location.href === pageUrl && !observedUrlFbclid &&
    !event.browser_id?.fbc && liveFbcValues.length > 1) {
    if (!ambiguousCookieReported) {
      ambiguousCookieReported = true
      reportClientCaughtError(new Error('meta_fbc_cookie_ambiguous'), 'meta.identifier_continuity')
    }
    const browserIds = { ...event.browser_id }
    const clickIds = { ...event.click_id }
    delete browserIds.fbc
    delete clickIds.fbclid
    return {
      ...event,
      browser_id: Object.keys(browserIds).length ? browserIds : undefined,
      click_id: Object.keys(clickIds).length ? clickIds : undefined
    }
  }
  let urlFbclid = observedUrlFbclid
  if (window.location.href === pageUrl && observedPageUrl !== pageUrl) {
    observedPageUrl = pageUrl
    const eventTime = Date.parse(event.event_time ?? '')
    observedPageAtMs = Number.isFinite(eventTime) ? eventTime : Date.now()
  }
  const pageObservedAtMs = observedPageAtMs
  const supersedingClick = () => {
    const durable = readMetaIdentifierStorage('localStorage', META_IDENTIFIER_LOCAL_KEY, Date.now())
    const durableClick = extractFbclidFromFbc(durable.fbc)
    const durableTime = metaIdentifierTimestamp(durable.fbc)
    const sameKnownClick = !observedUrlFbclid && durableClick === extractFbclidFromFbc(firstFbc)
    return durableClick && !sameKnownClick && durableClick !== observedUrlFbclid &&
      durableTime !== undefined && durableTime > pageObservedAtMs &&
      durable.fbc && !locallyObservedFbc.has(durable.fbc) ? durable : undefined
  }
  // The SDK can recover a new click from an in-app browser after the canonical
  // event captured an older raw click from storage. Keep both representations
  // aligned, while an explicit click on this event's URL remains authoritative.
  const matchingFbc = (value: string | undefined) => {
    const click = extractFbclidFromFbc(value)
    return click && (!urlFbclid || click === urlFbclid) ? value : undefined
  }

  if (window.location.href !== pageUrl) {
    // This event belongs to an earlier navigation. Running the SDK or the
    // server fallback with its old URL could roll back the current click cookie.
    const fbc = matchingFbc(event.browser_id?.fbc)
    const browserIds = { ...event.browser_id }
    delete browserIds.fbc
    if (fbc) browserIds.fbc = fbc
    const fbclid = urlFbclid ?? extractFbclidFromFbc(fbc)
    const clickIds = { ...event.click_id }
    delete clickIds.fbclid
    if (fbclid) clickIds.fbclid = fbclid
    return {
      ...event,
      click_id: Object.keys(clickIds).length ? clickIds : undefined,
      browser_id: Object.keys(browserIds).length ? browserIds : undefined
    }
  }

  const alreadySuperseded = supersedingClick()
  if (alreadySuperseded) {
    identifiers = alreadySuperseded
  } else try {
    const clientContext = await ensureMetaClientParameterContext(
      {
        consent: event.consent,
        pageUrl,
        onStaleCompletion: () => {
          if (metaConsentRevoked || supersedingClick()) {
            reconcileRevokedMetaCollection()
          }
        }
      }
    )
    if (eventConsentEpoch !== consentEpoch) return denyInFlightEvent(event)
    if (!marketingAllowed()) return event
    identifiers = {
      ...(matchingFbc(clientContext.fbc) ? { fbc: clientContext.fbc } : {}),
      ...(clientContext.fbp ? { fbp: clientContext.fbp } : {})
    }
    if (window.location.href === pageUrl && !supersedingClick() &&
      (!identifiers.fbp || (urlFbclid && !identifiers.fbc))) {
      // Only a click on this URL is a new observation. A historical raw click
      // without its original fbc timestamp must not be reminted by the server.
      identifiers = await requestMetaParameterContext(event, urlFbclid)
    }
  } catch (error) {
    if (eventConsentEpoch !== consentEpoch) return denyInFlightEvent(event)
    reportClientCaughtError(error, 'meta.parameter_context')

    if (window.location.href === pageUrl && !supersedingClick()) {
      try {
        identifiers = await requestMetaParameterContext(event, urlFbclid)
      } catch (fallbackError) {
        reportClientCaughtError(
          fallbackError,
          'meta.parameter_context_fallback'
        )
      }
    }
  }

  if (eventConsentEpoch !== consentEpoch) {
    if (metaConsentRevoked) removeMetaIdentifiers()
    return denyInFlightEvent(event)
  }

  // A second tab may have observed a new click during the SDK's async work.
  // The old address bar is not a new click on this page, even if the SDK just
  // rewrote its cookie from that stale URL.
  const newerClick = supersedingClick()
  const newerClickAtMs = metaIdentifierTimestamp(newerClick?.fbc)
  const eventCreatedAtMs = Date.parse(event.event_time ?? '')
  if (newerClickAtMs !== undefined && Number.isFinite(eventCreatedAtMs) &&
    eventCreatedAtMs < newerClickAtMs) {
    // Keep the earlier event on its own timeline. Its captured identifiers
    // can be sent, but a click observed afterward cannot be attached to it.
    const capturedFbc = matchingFbc(event.browser_id?.fbc)
    const browserIds = { ...event.browser_id }
    delete browserIds.fbc
    if (capturedFbc) browserIds.fbc = capturedFbc
    const clickIds = { ...event.click_id }
    delete clickIds.fbclid
    const capturedClick = urlFbclid ?? extractFbclidFromFbc(capturedFbc)
    if (capturedClick) clickIds.fbclid = capturedClick
    return {
      ...event,
      browser_id: Object.keys(browserIds).length ? browserIds : undefined,
      click_id: Object.keys(clickIds).length ? clickIds : undefined
    }
  }
  if (newerClick) {
    urlFbclid = undefined
    identifiers = { ...identifiers, ...newerClick }
  }

  const currentPage = window.location.href === pageUrl
  let fbc = matchingFbc(identifiers.fbc) ??
    (currentPage ? matchingFbc(readCookie('_fbc')) : undefined) ??
    matchingFbc(event.browser_id?.fbc)
  let fbp = identifiers.fbp ?? readCookie('_fbp')
  ;({ fbc, fbp } = preserveFirstMetaIdentifiers({
    capturedFbc: event.browser_id?.fbc,
    capturedFbp: event.browser_id?.fbp,
    currentPage,
    fbc,
    fbp,
    urlFbclid
  }))
  if (currentPage && !newerClick && fbc) {
    locallyObservedFbc.add(fbc)
    if (locallyObservedFbc.size > 16) locallyObservedFbc.delete(locallyObservedFbc.values().next().value!)
  }
  const fbclid = extractFbclidFromFbc(fbc)
  if (fbclid) {
    // A completed older event must never roll back a newer navigation's cache.
    // Persist only the SDK value still present on the same current page. URL
    // precedence and preservation of other providers' click IDs stay centralized.
    if (currentPage && readCookie('_fbc') === fbc &&
      freshBackup(fbc, Date.now())) {
      resolveClickIds(newerClick ? withoutFbclid(pageUrl) : pageUrl,
        undefined, undefined, undefined, { fbclid })
    }
  }
  const externalId =
    event.external_id ??
    browserFirstPartyExternalIdStore.getOrCreate(event.consent)
  const browserIds = { ...event.browser_id }
  // Do not leave a conflicting pre-enrichment cookie behind when recovery of
  // the URL click fails. Other browser identifiers remain intact.
  delete browserIds.fbc
  if (fbc) browserIds.fbc = fbc
  if (fbp) browserIds.fbp = fbp
  const selectedClick = urlFbclid ?? fbclid
  const clickIds = { ...event.click_id }
  delete clickIds.fbclid
  if (selectedClick) clickIds.fbclid = selectedClick

  return {
    ...event,
    ...(newerClick ? {
      page_url: withoutFbclid(pageUrl),
      ...(event.referrer_url ? { referrer_url: withoutFbclid(event.referrer_url) } : {})
    } : {}),
    click_id: Object.keys(clickIds).length ? clickIds : undefined,
    browser_id: Object.keys(browserIds).length ? browserIds : undefined,
    ...(externalId ? { external_id: externalId } : {})
  }
}

'use client'

import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
import * as z from '@/lib/validation/zodMini'
import { buildMetaParameterContextRequestUrl } from './buildMetaParameterContextRequestUrl'
import type { ConsentSnapshot } from './canonicalEventEnvelope'
import type { CanonicalClickIds } from './canonicalSignalContract'
import { resolveClickIds } from './clickIdSessionStore'
import { extractFbclidFromFbc } from './extractFbclidFromFbc'
import { browserFirstPartyExternalIdStore } from './firstPartyExternalId'
import { metaParameterContextResponseSchema } from './metaParameterContextContract'
import { ensureMetaClientParameterContext } from './metaClientParameterBuilder'

type MetaAttributionEvent = {
  browser_id?: Record<string, string> | undefined
  click_id?: CanonicalClickIds | undefined
  consent: ConsentSnapshot
  external_id?: string | undefined
  page_url?: string | undefined
  referrer_url?: string | undefined
}

function marketingAllowed() {
  return typeof window !== 'undefined'
}

const completedContextKeys = new Set<string>()
const META_PARAMETER_CONTEXT_TIMEOUT_MS = 2500
const META_COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60
const META_IDENTIFIER_SESSION_KEY = 'utekos_meta_identifiers_v1'
const metaIdentifierSessionSchema = z.strictObject({
  fbc: z.optional(z.string().check(z.minLength(1), z.maxLength(3800))),
  fbp: z.optional(z.string().check(z.minLength(1), z.maxLength(3800))),
  savedAt: z.number().check(z.int(), z.minimum(1))
})
let contextSequence: Promise<void> = Promise.resolve()
let firstFbc: string | undefined
let firstFbp: string | undefined
let sessionLoaded = false
let continuityReported = false

function readCookie(name: string): string | undefined {
  if (!marketingAllowed()) return undefined
  const prefix = `${name}=`
  const candidate = document.cookie
    .split('; ')
    .find(cookie => cookie.startsWith(prefix))
  const value = candidate?.slice(prefix.length)

  if (!value) return undefined

  try {
    return decodeURIComponent(value)
  } catch {
    return undefined
  }
}

function writeMetaCookie(name: '_fbc' | '_fbp', value: string): boolean {
  const hostname = window.location.hostname
  const domain =
    hostname === 'utekos.no' || hostname.endsWith('.utekos.no') ?
      '; Domain=.utekos.no'
    : ''
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  try {
    document.cookie =
      `${name}=${encodeURIComponent(value)}; Path=/; ` +
      `Max-Age=${META_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${domain}${secure}`
    return readCookie(name) === value
  } catch {
    return false
  }
}

function readMetaIdentifierSession() {
  try {
    const raw = sessionStorage.getItem(META_IDENTIFIER_SESSION_KEY)
    if (!raw) return undefined
    const parsed = metaIdentifierSessionSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return undefined
    const elapsedMs = Date.now() - parsed.data.savedAt
    if (elapsedMs < 0 || elapsedMs > META_COOKIE_MAX_AGE_SECONDS * 1000) return undefined
    return parsed.data
  } catch {
    return undefined
  }
}

function saveMetaIdentifierSession(fbc: string | undefined, fbp: string | undefined) {
  if (!fbc && !fbp) return
  try {
    sessionStorage.setItem(META_IDENTIFIER_SESSION_KEY, JSON.stringify({
      ...(fbc ? { fbc } : {}),
      ...(fbp ? { fbp } : {}),
      savedAt: Date.now()
    }))
  } catch {
    // Browser cookies remain the primary store when session storage is unavailable.
  }
}

function preserveFirstMetaIdentifiers(input: {
  currentPage: boolean
  fbc: string | undefined
  fbp: string | undefined
  urlFbclid: string | undefined
}) {
  let { fbc, fbp } = input
  const candidateClick = extractFbclidFromFbc(fbc)
  if (input.currentPage && !sessionLoaded) {
    sessionLoaded = true
    const saved = readMetaIdentifierSession()
    const savedClick = extractFbclidFromFbc(saved?.fbc)
    if (
      saved?.fbc && savedClick &&
      (!input.urlFbclid || input.urlFbclid === savedClick) &&
      (!candidateClick || candidateClick === savedClick)
    ) firstFbc = saved.fbc
    if (saved?.fbp) firstFbp = saved.fbp
  }
  const firstClick = extractFbclidFromFbc(firstFbc)

  // One click must retain its original fbc timestamp across Pixel, CAPI and
  // later events, even if another script removes or remints the browser cookie.
  if (firstFbc && firstClick && (
    candidateClick === firstClick ||
    (input.currentPage && !fbc && (!input.urlFbclid || input.urlFbclid === firstClick))
  )) {
    fbc = firstFbc
  } else if (fbc && candidateClick && input.currentPage) {
    firstFbc = fbc
  }

  if (firstFbp) fbp = firstFbp
  else if (fbp && input.currentPage) firstFbp = fbp

  if (input.currentPage) {
    saveMetaIdentifierSession(firstFbc, firstFbp)
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

  const response = await fetch(
    buildMetaParameterContextRequestUrl(fbclid),
    {
      body: JSON.stringify({
        consent: event.consent,
        ...(fbclid ? { fbclid } : {}),
        page_url: pageUrl,
        ...(event.referrer_url ?
          { referrer_url: event.referrer_url }
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
  if (
    typeof window === 'undefined' ||
    event.consent.marketing !== 'granted' ||
    !marketingAllowed()
  ) {
    return event
  }

  let identifiers: {
    fbc?: string | undefined
    fbp?: string | undefined
  } = {}
  const pageUrl = event.page_url ?? window.location.href
  const urlFbclid = new URL(pageUrl).searchParams.get('fbclid') || undefined
  // The SDK can recover a new click from an in-app browser after the canonical
  // event captured an older raw click from storage. Keep both representations
  // aligned, while an explicit click on this event's URL remains authoritative.
  const matchingFbc = (value: string | undefined) => {
    const click = extractFbclidFromFbc(value)
    return click && (!urlFbclid || click === urlFbclid) ? value : undefined
  }

  try {
    const clientContext = await ensureMetaClientParameterContext(
      {
        consent: event.consent,
        pageUrl
      }
    )
    if (!marketingAllowed()) return event
    identifiers = {
      ...(matchingFbc(clientContext.fbc) ? { fbc: clientContext.fbc } : {}),
      ...(clientContext.fbp ? { fbp: clientContext.fbp } : {})
    }
    if (
      !identifiers.fbp ||
      (urlFbclid && !identifiers.fbc)
    ) {
      // Only a click on this URL is a new observation. A historical raw click
      // without its original fbc timestamp must not be reminted by the server.
      identifiers = await requestMetaParameterContext(event, urlFbclid)
    }
  } catch (error) {
    reportClientCaughtError(error, 'meta.parameter_context')

    try {
      identifiers = await requestMetaParameterContext(event, urlFbclid)
    } catch (fallbackError) {
      reportClientCaughtError(
        fallbackError,
        'meta.parameter_context_fallback'
      )
    }
  }

  const currentPage = window.location.href === pageUrl
  let fbc = matchingFbc(identifiers.fbc) ??
    (currentPage ? matchingFbc(readCookie('_fbc')) : undefined) ??
    matchingFbc(event.browser_id?.fbc)
  let fbp = identifiers.fbp ?? readCookie('_fbp')
  ;({ fbc, fbp } = preserveFirstMetaIdentifiers({
    currentPage,
    fbc,
    fbp,
    urlFbclid
  }))
  const fbclid = extractFbclidFromFbc(fbc)
  if (fbclid) {
    // A completed older event must never roll back a newer navigation's cache.
    // Persist only the SDK value still present on the same current page. URL
    // precedence and preservation of other providers' click IDs stay centralized.
    if (currentPage && readCookie('_fbc') === fbc) {
      resolveClickIds(pageUrl, undefined, undefined, undefined, { fbclid })
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

  return {
    ...event,
    ...(selectedClick ? { click_id: { ...event.click_id, fbclid: selectedClick } } : {}),
    browser_id: Object.keys(browserIds).length ? browserIds : undefined,
    ...(externalId ? { external_id: externalId } : {})
  }
}

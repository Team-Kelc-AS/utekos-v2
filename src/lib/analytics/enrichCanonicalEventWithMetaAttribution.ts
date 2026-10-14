'use client'

import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
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
let contextSequence: Promise<void> = Promise.resolve()

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
  const fbc = matchingFbc(identifiers.fbc) ??
    (currentPage ? matchingFbc(readCookie('_fbc')) : undefined) ??
    matchingFbc(event.browser_id?.fbc)
  const fbp = identifiers.fbp ?? readCookie('_fbp')
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

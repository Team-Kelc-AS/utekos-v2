'use client'

import type { ClientParamBuilder } from 'meta-capi-param-builder-clientjs'
import type { ConsentSnapshot } from './canonicalEventEnvelope'
import { mapMetaClientParameterContext } from './mapMetaClientParameterContext'
import { metaClientIpResponseSchema } from './metaClientIpContract'
import { shouldCollectMetaClientIp } from './shouldCollectMetaClientIp'
import { extractFbclidFromFbc } from './extractFbclidFromFbc'
import { readObservedMetaFbclid } from './metaFbclid'
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'

function marketingAllowed() {
  return typeof window !== 'undefined'
}
const META_CLIENT_IP_TIMEOUT_MS = 2500
// Application liveness bound, not a Meta latency guarantee. The native in-app
// bridge has no SDK timeout. Keep one collection alive after this boundary so
// later events can use its result without starting overlapping collections.
const META_COLLECTION_TIMEOUT_MS = 5000
let completedPageUrl: string | undefined
let hasCollectedClientIpForDocument = false
let collectionEpoch = 0
let reconcileRevokedCollection: (() => void) | undefined
type Collection = {
  pageUrl: string
  pending: boolean
  ready: Promise<MetaClientParameterContext>
}
let collection: Collection | undefined

type EnsureMetaClientParameterContextInput = {
  consent: ConsentSnapshot
  pageUrl: string
  onStaleCompletion?: () => void
}

export type MetaClientParameterContext = {
  clientIpAddress?: string | undefined
  fbc?: string | undefined
  fbp?: string | undefined
}

async function loadClientParamBuilder(): Promise<ClientParamBuilder> {
  const imported =
    await import('meta-capi-param-builder-clientjs')
  return imported.default ?? (imported as unknown as ClientParamBuilder)
}

async function getConsentedClientIpAddress(
  consent: ConsentSnapshot
) {
  if (!marketingAllowed()) return ''

  try {
    const response = await fetch('/api/meta/client-ip', {
      body: JSON.stringify({ consent }),
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      keepalive: true,
      method: 'POST',
      signal: AbortSignal.timeout(META_CLIENT_IP_TIMEOUT_MS)
    })

    if (!response.ok) return ''

    const parsed = metaClientIpResponseSchema.safeParse(
      await response.json()
    )
    return parsed.success ? parsed.data.client_ip_address : ''
  } catch {
    return ''
  }
}

function readPersistedIdentifiers(): MetaClientParameterContext {
  const cookies: Record<string, string> = {}
  for (const entry of document.cookie.split(/;\s*/)) {
    const separator = entry.indexOf('=')
    if (separator < 0) continue
    const name = entry.slice(0, separator)
    if (!['_fbc', '_fbp', '_fbi'].includes(name)) continue
    try {
      cookies[name] = decodeURIComponent(entry.slice(separator + 1))
    } catch { /* Ignore malformed cookies; never synthesize an identifier. */ }
  }
  return mapMetaClientParameterContext(cookies)
}

function startCollection(input: EnsureMetaClientParameterContextInput): Collection {
  const startedAtEpoch = collectionEpoch
  const active: Collection = {
    pageUrl: input.pageUrl,
    pending: true,
    ready: Promise.resolve({})
  }
  active.ready = new Promise((resolve, reject) => {
    let released = false
    const release = (value: MetaClientParameterContext, error?: unknown) => {
      if (released) return
      released = true
      clearTimeout(timer)
      window.removeEventListener('pagehide', leave)
      if (error) reject(error)
      else resolve(value)
    }
    const leave = () => release(readPersistedIdentifiers())
    const timer = setTimeout(() => {
      reportClientCaughtError(
        new Error('meta_parameter_collection_timeout'),
        'meta.parameter_context'
      )
      release(readPersistedIdentifiers())
    }, META_COLLECTION_TIMEOUT_MS)
    window.addEventListener('pagehide', leave, { once: true })

    void (async () => {
      const builder = await loadClientParamBuilder()
      // An older event must not feed its URL to an SDK that writes cookies.
      if (startedAtEpoch !== collectionEpoch) return {}
      if (window.location.href !== input.pageUrl) return readPersistedIdentifiers()
      const shouldCollectClientIp =
        !hasCollectedClientIpForDocument &&
        shouldCollectMetaClientIp(input.pageUrl, process.env.NODE_ENV)
      // IP lookup and in-app click recovery are independent. Start the one IP
      // request alongside recovery, then let the SDK collect both results. A
      // healthy 3.5s native bridge plus 2.3s IP lookup must not hit our 5s bound.
      const clientIpAddress = shouldCollectClientIp
        ? getConsentedClientIpAddress(input.consent)
        : undefined
      let parameters: Awaited<ReturnType<ClientParamBuilder['processAndCollectAllParams']>>
      try {
        parameters = await builder.processAndCollectAllParams(
          input.pageUrl,
          clientIpAddress ? () => clientIpAddress : undefined
        )
      } finally {
        // Native click recovery can finish after consent was withdrawn. The
        // SDK writes cookies internally, so reconcile after its last write.
        if (startedAtEpoch !== collectionEpoch) reconcileRevokedCollection?.()
        else input.onStaleCompletion?.()
      }
      if (startedAtEpoch !== collectionEpoch) return {}
      if (parameters._fbi) hasCollectedClientIpForDocument = true
      completedPageUrl = input.pageUrl
      return mapMetaClientParameterContext(parameters)
    })().then(
      value => { active.pending = false; release(value) },
      error => { active.pending = false; release({}, error) }
    )
  })
  return active
}

export function revokeMetaClientParameterContext(reconcile: () => void) {
  collectionEpoch++
  reconcileRevokedCollection = reconcile
  completedPageUrl = undefined
  collection = undefined
}

export async function ensureMetaClientParameterContext(
  input: EnsureMetaClientParameterContextInput
): Promise<MetaClientParameterContext> {
  if (
    typeof window === 'undefined' ||
    input.consent.marketing !== 'granted' ||
    !marketingAllowed()
  ) {
    return {}
  }

  if (window.location.href !== input.pageUrl) return readPersistedIdentifiers()

  const observedClick = readObservedMetaFbclid(input.pageUrl)
  if (observedClick.invalid) return readPersistedIdentifiers()

  if (collection?.pending) {
    const active = collection
    const identifiers = await active.ready
    // A timed-out native bridge remains in flight, but cannot hold subsequent
    // events or checkout hostage. Read cookies again, not the earlier fallback.
    if (active.pending) return readPersistedIdentifiers()
    if (active.pageUrl === input.pageUrl) return identifiers
    return ensureMetaClientParameterContext(input)
  }

  const currentIdentifiers = readPersistedIdentifiers()
  const urlFbclid = observedClick.value
  if (
    completedPageUrl === input.pageUrl &&
    currentIdentifiers.fbp &&
    (!urlFbclid || urlFbclid === extractFbclidFromFbc(currentIdentifiers.fbc))
  ) return currentIdentifiers

  collection = startCollection(input)
  return collection.ready
}

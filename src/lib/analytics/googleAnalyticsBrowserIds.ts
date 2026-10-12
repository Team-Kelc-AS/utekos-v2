import { GA_MEASUREMENT_ID } from '../../api/constants/monitoring'
import type { CanonicalViewItem } from './viewItemEvent'
import type { ConsentSnapshot } from './canonicalEventEnvelope'

// Cold Stape -> web GTM -> Google tag initialization can exceed 500 ms.
// Wait for the documented get callbacks, with a finite failure/exit boundary.
const GOOGLE_TAG_TIMEOUT_MS = 5000
const GOOGLE_TAG_RETRY_MS = 250

export type GoogleAnalyticsField = 'client_id' | 'session_id'

type GoogleTagCallback = (value: unknown) => void

export type GoogleAnalyticsBrowserIdDependencies = {
  clearTimer: (timer: ReturnType<typeof setTimeout>) => void
  getGoogleTagValue: (
    field: GoogleAnalyticsField,
    callback: GoogleTagCallback
  ) => void
  setTimer: (
    callback: () => void,
    timeoutMs: number
  ) => ReturnType<typeof setTimeout>
  timeoutMs: number
  retryMs?: number
  onPageExit?: (callback: () => void) => () => void
}

type GoogleTagWindow = Window & { dataLayer?: unknown[] }

export function queueGoogleTagGet(
  dataLayer: unknown[],
  field: GoogleAnalyticsField,
  callback: GoogleTagCallback
) {
  function gtag(
    ...args: [
      command: 'get',
      target: string,
      field: GoogleAnalyticsField,
      callback: GoogleTagCallback
    ]
  ) {
    void args
    // Google documents gtag as pushing its arguments object.
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments)
  }

  gtag('get', GA_MEASUREMENT_ID, field, callback)
}

function getGoogleTagValue(
  field: GoogleAnalyticsField,
  callback: GoogleTagCallback
): void {
  if (typeof window === 'undefined') {
    callback(undefined)
    return
  }

  const currentWindow = window as GoogleTagWindow
  const dataLayer = currentWindow.dataLayer ?? []
  currentWindow.dataLayer = dataLayer
  queueGoogleTagGet(dataLayer, field, callback)
}

const defaultDependencies: GoogleAnalyticsBrowserIdDependencies =
  {
    clearTimer: timer => {
      clearTimeout(timer)
    },
    getGoogleTagValue,
    setTimer: (callback, timeoutMs) =>
      setTimeout(callback, timeoutMs),
    timeoutMs: GOOGLE_TAG_TIMEOUT_MS,
    retryMs: GOOGLE_TAG_RETRY_MS,
    onPageExit: callback => {
      window.addEventListener('pagehide', callback, { once: true })
      return () => window.removeEventListener('pagehide', callback)
    }
  }

function normalizeGoogleTagValue(
  value: unknown
): string | undefined {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized || undefined
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return undefined
}

function readGoogleTagValue(
  field: GoogleAnalyticsField,
  dependencies: GoogleAnalyticsBrowserIdDependencies
): Promise<string | undefined> {
  return new Promise(resolve => {
    let settled = false
    let retry: ReturnType<typeof setTimeout> | undefined

    const finish = (value?: string) => {
      if (settled) return

      settled = true
      dependencies.clearTimer(timer)
      if (retry !== undefined) dependencies.clearTimer(retry)
      stopExit?.()
      resolve(value)
    }

    const timer = dependencies.setTimer(
      () => finish(),
      dependencies.timeoutMs
    )

    const stopExit = dependencies.onPageExit?.(() => finish())

    const attempt = () => {
      if (settled) return
      try {
        dependencies.getGoogleTagValue(field, value => {
          const normalized = normalizeGoogleTagValue(value)
          // A get queued before GTM's config can return undefined. Retry after
          // initialization instead of treating that as a permanent absence.
          if (normalized) finish(normalized)
        })
      } catch { /* A blocked/unavailable tag must not discard the event. */ }
      if (!settled) {
        retry = dependencies.setTimer(attempt, dependencies.retryMs ?? GOOGLE_TAG_RETRY_MS)
      }
    }
    attempt()
  })
}

const pendingReads = new WeakMap<GoogleAnalyticsBrowserIdDependencies, Promise<(string | undefined)[]>>()

function readGoogleAnalyticsIds(dependencies: GoogleAnalyticsBrowserIdDependencies) {
  const pending = pendingReads.get(dependencies)
  if (pending) return pending
  const work = Promise.all([
    readGoogleTagValue('client_id', dependencies),
    readGoogleTagValue('session_id', dependencies)
  ]).finally(() => pendingReads.delete(dependencies))
  pendingReads.set(dependencies, work)
  return work
}

export async function enrichCanonicalEventWithGoogleAnalyticsIds<
  E extends {
    browser_id?: Record<string, string> | undefined
    consent: ConsentSnapshot
  }
>(
  event: E,
  dependencies: GoogleAnalyticsBrowserIdDependencies = defaultDependencies
): Promise<E> {
  if (event.consent.analytics !== 'granted') return event
  if (event.browser_id?.ga_client_id && event.browser_id?.ga_session_id) return event
  if (dependencies === defaultDependencies && typeof window === 'undefined') return event

  const [clientId, sessionId] = await readGoogleAnalyticsIds(dependencies)

  if (!clientId && !sessionId) return event

  return {
    ...event,
    browser_id: {
      ...event.browser_id,
      ...(clientId ? { ga_client_id: clientId } : {}),
      ...(sessionId ? { ga_session_id: sessionId } : {})
    }
  }
}

export function enrichCanonicalViewItemWithGoogleAnalyticsIds(
  event: CanonicalViewItem,
  dependencies: GoogleAnalyticsBrowserIdDependencies = defaultDependencies
) {
  return enrichCanonicalEventWithGoogleAnalyticsIds(
    event,
    dependencies
  )
}

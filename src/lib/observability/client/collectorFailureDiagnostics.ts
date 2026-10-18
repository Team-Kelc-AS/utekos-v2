// Diagnostic labels only; unknown endpoints never become log content.
export const COLLECTOR_TARGETS = [
  'page_view_capture', 'page_view', 'view_item', 'view_item_list', 'select_item',
  'variant_select', 'add_to_cart', 'remove_from_cart', 'view_cart', 'add_to_wishlist',
  'begin_checkout', 'view_promotion', 'select_promotion', 'view_category',
  'scroll_depth', 'hero_interact', 'interact_with_accordion', 'size_guide_view',
  'form_start', 'form_error', 'video_progress', 'other'
] as const
export const COLLECTOR_NATIVE_REASONS = [
  'failed_to_fetch', 'load_failed', 'network_error', 'abort', 'timeout', 'type_error', 'other'
] as const

export type CollectorFailureDiagnostics = Readonly<{
  target: typeof COLLECTOR_TARGETS[number]
  native_reason: typeof COLLECTOR_NATIVE_REASONS[number]
  body_bytes: number
  canonical_in_flight_keepalive_bytes: number
  keepalive: boolean
  attempts: 2
  signal_aborted: boolean
  visibility: 'visible' | 'hidden' | 'unknown'
  online: boolean | null
}>

const failures = new WeakMap<object, CollectorFailureDiagnostics>()

function nativeReason(error: object): CollectorFailureDiagnostics['native_reason'] {
  const name = 'name' in error ? error.name : undefined
  const message = 'message' in error ? error.message : undefined
  if (name === 'AbortError') return 'abort'
  if (name === 'TimeoutError') return 'timeout'
  if (name !== 'TypeError') return 'other'
  if (message === 'Failed to fetch') return 'failed_to_fetch'
  if (message === 'Load failed') return 'load_failed'
  if (message === 'NetworkError when attempting to fetch resource.') return 'network_error'
  return 'type_error'
}

export function recordCollectorFailureDiagnostics(
  error: unknown,
  endpoint: string,
  detail: Pick<CollectorFailureDiagnostics, 'body_bytes' | 'canonical_in_flight_keepalive_bytes' | 'keepalive' | 'signal_aborted'>
): void {
  if (typeof error !== 'object' || error === null) return
  try {
    const target = endpoint === '/api/events/page-view/capture' ? 'page_view_capture' :
      COLLECTOR_TARGETS.find(value => endpoint === `/api/events/${value.replaceAll('_', '-')}`) ?? 'other'
    const state = typeof document === 'undefined' ? undefined : document.visibilityState
    failures.set(error, Object.freeze({
      ...detail, target, native_reason: nativeReason(error), attempts: 2,
      visibility: state === 'visible' || state === 'hidden' ? state : 'unknown',
      online: typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : null
    }))
  } catch { /* Diagnostics must never replace the original transport error. */ }
}

export function getCollectorFailureDiagnostics(error: unknown): CollectorFailureDiagnostics | undefined {
  return typeof error === 'object' && error !== null ? failures.get(error) : undefined
}

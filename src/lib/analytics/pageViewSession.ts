export type PageViewContext = Readonly<{
  pageUrl: string
  pageViewId: string
  previousPageViewId?: string
  referrerUrl?: string
}>

type EnsurePageViewInput = {
  pageUrl: string
  documentReferrer?: string
}

type PageViewListener = (context: PageViewContext) => void

type ActivePageView = PageViewContext & { emitted: boolean }

export function createPageViewSession(
  createId: () => string = () => globalThis.crypto.randomUUID()
) {
  let activePageView: ActivePageView | null = null
  const pageViewsById = new Map<string, PageViewContext>()
  const listeners = new Set<PageViewListener>()

  function remember(pageView: ActivePageView) {
    const context = toPublicContext(pageView)
    pageViewsById.set(context.pageViewId, context)

    if (pageViewsById.size > 32) {
      const oldestPageViewId = pageViewsById.keys().next().value
      if (oldestPageViewId)
        pageViewsById.delete(oldestPageViewId)
    }

    return context
  }

  function ensure(input: EnsurePageViewInput): PageViewContext {
    const pageUrl = normalizeRequiredHttpUrl(input.pageUrl)

    if (activePageView?.pageUrl === pageUrl) {
      return toPublicContext(activePageView)
    }

    // A variant choice rewrites ?farge=/?storrelse= on the same product page.
    // It is not a new page view: keep the identity and only follow the URL.
    if (activePageView && isVariantOnlyChange(activePageView.pageUrl, pageUrl)) {
      activePageView = { ...activePageView, pageUrl }
      return remember(activePageView)
    }

    const referrerUrl =
      activePageView?.pageUrl ??
      normalizeOptionalHttpUrl(input.documentReferrer)

    activePageView = {
      pageUrl,
      pageViewId: createId(),
      ...(activePageView?.pageViewId ?
        { previousPageViewId: activePageView.pageViewId }
      : {}),
      ...(referrerUrl ? { referrerUrl } : {}),
      emitted: false
    }

    return remember(activePageView)
  }

  function get(
    pageViewId: string | undefined
  ): PageViewContext | undefined {
    if (!pageViewId) {
      return activePageView ?
          toPublicContext(activePageView)
        : undefined
    }

    return pageViewsById.get(pageViewId)
  }

  function hasEmitted(pageViewId: string): boolean {
    return (
      activePageView?.pageViewId === pageViewId &&
      activePageView.emitted
    )
  }

  function recordEmitted(context: PageViewContext): boolean {
    const pageUrl = normalizeRequiredHttpUrl(context.pageUrl)

    if (
      activePageView?.pageUrl === pageUrl &&
      activePageView.pageViewId === context.pageViewId &&
      activePageView.emitted
    ) {
      return false
    }

    const referrerUrl =
      normalizeOptionalHttpUrl(context.referrerUrl) ??
      (activePageView?.pageUrl === pageUrl ?
        activePageView.referrerUrl
      : undefined)
    const previousPageViewId =
      context.previousPageViewId ??
      pageViewsById.get(context.pageViewId)
        ?.previousPageViewId ??
      (activePageView?.pageUrl === pageUrl ?
        activePageView.previousPageViewId
      : activePageView?.pageViewId)

    activePageView = {
      pageUrl,
      pageViewId: context.pageViewId,
      ...(previousPageViewId ? { previousPageViewId } : {}),
      ...(referrerUrl ? { referrerUrl } : {}),
      emitted: true
    }

    const emittedContext = remember(activePageView)

    for (const listener of listeners) {
      listener(emittedContext)
    }

    return true
  }

  function subscribe(listener: PageViewListener): () => void {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  }

  function clear() {
    activePageView = null
    pageViewsById.clear()
  }

  return {
    clear,
    ensure,
    get,
    hasEmitted,
    recordEmitted,
    subscribe
  }
}

export const browserPageViewSession = createPageViewSession()

function toPublicContext(
  pageView: ActivePageView
): PageViewContext {
  return {
    pageUrl: pageView.pageUrl,
    pageViewId: pageView.pageViewId,
    ...(pageView.previousPageViewId ?
      { previousPageViewId: pageView.previousPageViewId }
    : {}),
    ...(pageView.referrerUrl ?
      { referrerUrl: pageView.referrerUrl }
    : {})
  }
}

function normalizeRequiredHttpUrl(value: string): string {
  const normalized = normalizeOptionalHttpUrl(value)

  if (!normalized) {
    throw new Error('pageUrl must be an absolute HTTP(S) URL')
  }

  return normalized
}

function normalizeOptionalHttpUrl(
  value: string | undefined
): string | undefined {
  if (!value) return undefined

  try {
    const url = new URL(value)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return undefined
    }

    return url.href
  } catch {
    return undefined
  }
}

const VARIANT_QUERY_KEYS = new Set(['variant', 'farge', 'storrelse', 'kjonn'])
const PRODUCT_PATH = /^\/produkter\/[^/]+\/?$/

/**
 * True when two URLs are the same product page and differ only in variant
 * selection parameters. Campaign or click parameters still start a new view.
 */
export function isVariantOnlyChange(previousUrl: string, nextUrl: string): boolean {
  let previous: URL
  let next: URL
  try {
    previous = new URL(previousUrl)
    next = new URL(nextUrl)
  } catch {
    return false
  }
  if (
    previous.origin !== next.origin ||
    previous.pathname !== next.pathname ||
    !PRODUCT_PATH.test(next.pathname) ||
    previous.hash !== next.hash
  ) {
    return false
  }
  const keys = new Set([...previous.searchParams.keys(), ...next.searchParams.keys()])
  let changed = false
  for (const key of keys) {
    const before = previous.searchParams.getAll(key).join('\u0000')
    const after = next.searchParams.getAll(key).join('\u0000')
    if (before === after) continue
    if (!VARIANT_QUERY_KEYS.has(key)) return false
    changed = true
  }
  return changed
}

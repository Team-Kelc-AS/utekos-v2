const keys = ['variant', 'farge', 'storrelse', 'kjonn'] as const;
/** Ignore advertising parameters while waiting for the actual RSC variant to arrive. */
export function selectionKey(params: URLSearchParams | Record<string, string | string[] | undefined>) {
  return keys.map(key => [key, params instanceof URLSearchParams ? params.get(key) : params[key]])
    .filter(([, value]) => typeof value === 'string' && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join('&');
}

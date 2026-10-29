export function isValidMetaFbclid(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 500
}

export function readObservedMetaFbclid(pageUrl: string): {
  value?: string
  invalid: boolean
} {
  const url = new URL(pageUrl)
  // The Meta Parameter Builder decodes the raw query value and rejects a
  // click longer than 500 characters. Match its first literal query key;
  // URLSearchParams also accepts encoded keys and repairs malformed escapes.
  const match = /[?&]fbclid(?:=([^&#]*)|(?=[&#]|$))/.exec(url.search)
  if (!match) return { invalid: false }
  try {
    const value = decodeURIComponent((match[1] ?? '').replace(/\+/g, ' '))
    return isValidMetaFbclid(value) ? { value, invalid: false } : { invalid: true }
  } catch {
    return { invalid: true }
  }
}

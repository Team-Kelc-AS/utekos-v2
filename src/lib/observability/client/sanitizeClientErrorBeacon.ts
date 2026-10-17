import { sanitizeClientErrorFilename as sanitizeFilename } from '../logging/sanitizeClientErrorDetails'

const KNOWN_ERROR =
  /\b(?:AbortError|TypeError|ReferenceError|SyntaxError|RangeError|TimeoutError|URIError|ZodError|Error)\b/

export function sanitizeClientErrorMessage(
  message: string
): string {
  // Keep only React's public numeric code, never decoder arguments or DOM text.
  // Accept our own output too: this runs in the browser and again on the server.
  const reactCode = message.match(/\b(?:Minified React error|ReactError) #([1-9]\d{0,3})(?!\d)/)?.[1]
  if (reactCode) return `ReactError #${reactCode}`
  // Preserve only the bounded HTTP status, never response bodies or URLs.
  const collectorStatus = message.match(/\b(?:collector_http_|CollectorHTTPError #)([1-5]\d{2})(?!\d)/)?.[1]
  if (collectorStatus) return `CollectorHTTPError #${collectorStatus}`
  // Keep the fixed collection deadline code across both sanitization layers.
  // The SDK may still be pending while canonical events continue via fallback.
  if (/\b(?:meta_parameter_collection_timeout|MetaParameterCollectionTimeout)\b/.test(message)) {
    return 'MetaParameterCollectionTimeout'
  }
  if (/\bSyntaxError\b/.test(message)) {
    // Fixed categories only: never retain the offending token, code or response body.
    const category = message.match(/^SyntaxError #(unexpected-less-than|unexpected-end|invalid-token|unexpected-token)$/)?.[1]
    if (category) return `SyntaxError #${category}`
    if (/\bUnexpected token\s+['"]<['"]/.test(message)) return 'SyntaxError #unexpected-less-than'
    if (/\bUnexpected (?:end of (?:input|script)|EOF)\b/i.test(message)) return 'SyntaxError #unexpected-end'
    if (/\b(?:Invalid or unexpected token|illegal character)\b/i.test(message)) return 'SyntaxError #invalid-token'
    if (/\bUnexpected token\b/i.test(message)) return 'SyntaxError #unexpected-token'
  }
  return message.match(KNOWN_ERROR)?.[0] ?? 'ClientError'
}

export function sanitizeClientErrorFilename(
  filename: string
): string {
  const fallback = sanitizeFilename(filename)
  if (fallback !== '/:script/site-proxy' || typeof document === 'undefined') return fallback
  try {
    const source = new URL(filename, document.baseURI)
    // Vercel rotates these public paths. Identify the SDK on the actual script
    // element, not a hard-coded hash, and emit only a fixed provider label.
    for (let index = 0; index < Math.min(document.scripts.length, 200); index++) {
      const script = document.scripts[index]
      if (!script?.src) continue
      const url = new URL(script.src, document.baseURI)
      if (url.origin !== source.origin || url.pathname !== source.pathname) continue
      if (script.dataset.sdkn === '@vercel/analytics/next') return '/:script/vercel-analytics'
      if (script.dataset.sdkn === '@vercel/speed-insights/next') return '/:script/vercel-speed-insights'
    }
  } catch { /* Diagnostics must not introduce another browser error. */ }
  return fallback
}

import { sanitizeOperationalPathname } from '@/lib/observability/logging/sanitizeOperationalPathname'

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
  return message.match(KNOWN_ERROR)?.[0] ?? 'ClientError'
}

export function sanitizeClientErrorFilename(
  filename: string
): string {
  return sanitizeOperationalPathname(filename)
}

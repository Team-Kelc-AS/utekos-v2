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
  return message.match(KNOWN_ERROR)?.[0] ?? 'ClientError'
}

export function sanitizeClientErrorFilename(
  filename: string
): string {
  return sanitizeOperationalPathname(filename)
}

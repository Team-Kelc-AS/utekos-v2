// Preserve build asset locations, never arbitrary URLs, query strings or error text.
export function sanitizeClientErrorFilename(value: string): string {
  try {
    const path = new URL(value, 'https://utekos.no').pathname
    if (/^\/_next\/static\/[A-Za-z0-9_./-]+\.m?js$/.test(path) && path.length <= 512) {
      return path
    }
  } catch { /* Unknown locations carry no trusted diagnostic information. */ }
  return '/:other'
}

export function sanitizeClientErrorStack(value: string): string {
  return value.slice(0, 16_384).split('\n').flatMap(line => {
    // Chrome/Edge: at fn (URL:line:column); Firefox/Safari: fn@URL:line:column.
    const match = line.match(/(?:https?:\/\/[^\s()]+|\/_next\/static\/[^\s()]+|\/:other):(\d+):(\d+)\)?$/)
    if (!match || !match[1] || !match[2]) return []
    const location = match[0].replace(/\)?$/, '')
    const filename = location.slice(0, -(match[1].length + match[2].length + 2))
    const lineNumber = Number(match[1])
    const column = Number(match[2])
    if (lineNumber > 10_000_000 || column > 10_000_000) return []
    return [`    at ${sanitizeClientErrorFilename(filename)}:${lineNumber}:${column}`]
  }).slice(0, 10).join('\n').slice(0, 6_000)
}

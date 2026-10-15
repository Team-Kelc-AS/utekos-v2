import { sanitizeOperationalPathname } from './sanitizeOperationalPathname'

// Fixed labels preserve source attribution without account IDs or arbitrary URLs.
const SCRIPT_SOURCES: Record<string, string> = {
  'www.googletagmanager.com': 'google-tag-manager',
  'connect.facebook.net': 'meta',
  'scripts.clarity.ms': 'clarity',
  'www.clarity.ms': 'clarity',
  'bat.bing.com': 'microsoft-uet',
  'stapecdn.com': 'stape',
  'load.edge.utekos.no': 'stape',
  'x.klarnacdn.net': 'klarna'
}
const SOURCE_LABELS = new Set([
  ...Object.values(SCRIPT_SOURCES), 'browser-extension', 'site-proxy',
  'server-tag-manager'
].map(source => `/:script/${source}`))

// Preserve build asset locations, never arbitrary URLs, query strings or error text.
export function sanitizeClientErrorFilename(value: string): string {
  try {
    const url = new URL(value, 'https://utekos.no')
    const path = url.pathname
    if (SOURCE_LABELS.has(value)) return value
    if (['chrome-extension:', 'moz-extension:', 'safari-web-extension:'].includes(url.protocol)) {
      return '/:script/browser-extension'
    }
    if (!['https:', 'http:'].includes(url.protocol)) return '/:other'
    const source = SCRIPT_SOURCES[url.hostname]
    if (source) return `/:script/${source}`
    if (!['utekos.no', 'www.utekos.no'].includes(url.hostname)) return '/:other'
    if (path.startsWith('/__sgtm/')) return '/:script/server-tag-manager'
    if (/^\/[a-f0-9]{16}\/script\.js$/.test(path)) return '/:script/site-proxy'
    if (path === '/analytics/meta-pixel-canonical-v1.js') return path
    if (/^\/_next\/static\/[A-Za-z0-9_./-]+\.m?js$/.test(path) && path.length <= 512) {
      return path
    }
    return sanitizeOperationalPathname(path)
  } catch { /* Unknown locations carry no trusted diagnostic information. */ }
  return '/:other'
}

export function sanitizeClientErrorStack(value: string): string {
  return value.slice(0, 16_384).split('\n').flatMap(line => {
    // Chrome/Edge: at fn (URL:line:column); Firefox/Safari: fn@URL:line:column.
    const match = line.match(/(?:https?:\/\/[^\s()]+|\/_next\/static\/[^\s()]+|\/:[^\s()]+|\/analytics\/[^\s()]+|\/produkter\/[^\s()]+):(\d+):(\d+)\)?$/)
    if (!match || !match[1] || !match[2]) return []
    const location = match[0].replace(/\)?$/, '')
    const filename = location.slice(0, -(match[1].length + match[2].length + 2))
    const lineNumber = Number(match[1])
    const column = Number(match[2])
    if (lineNumber > 10_000_000 || column > 10_000_000) return []
    return [`    at ${sanitizeClientErrorFilename(filename)}:${lineNumber}:${column}`]
  }).slice(0, 10).join('\n').slice(0, 6_000)
}

const VERCEL_TELEMETRY_ROUTES: Readonly<Record<string, string>> = {
  '/telemetry/v1/web.js': '/_vercel/insights/script.js',
  '/telemetry/v1/view': '/_vercel/insights/view',
  '/telemetry/v1/event': '/_vercel/insights/event',
  '/telemetry/v1/speed.js': '/_vercel/speed-insights/script.js',
  '/telemetry/v1/vitals': '/_vercel/speed-insights/vitals',
}

/** Exact existing endpoints; no arbitrary external proxy destination. */
export function telemetryRewriteUrl(requestUrl: URL): URL | null {
  const target = VERCEL_TELEMETRY_ROUTES[requestUrl.pathname]
  if (!target) return null
  const url = new URL(target, 'https://utekos.no')
  url.search = requestUrl.search
  return url
}

import { operationalRoute } from '../../../../supabase/functions/_shared/operational-route'

// Literal public routes only; never retain arbitrary slugs or query parameters.
const publicStorefrontRoutes = new Set([
  '/',
  '/bli-forhandler',
  '/bli-forhandler/pdf',
  '/forhandlere',
  '/frakt-og-retur',
  '/handlehjelp/funksjonalitet',
  '/handlehjelp/sammenlign-modeller',
  '/handlehjelp/storrelsesguide',
  '/handlehjelp/vask-og-vedlikehold',
  '/kontaktskjema',
  '/om-oss',
  '/personvern',
  '/produkter',
  '/produkter/camping-og-bobil',
  '/produkter/camping-og-bobil/nbcc',
  '/produkter/comfyrobe',
  '/produkter/glamping',
  '/produkter/hytte',
  '/produkter/terrasse',
  '/produkter/tilbehor',
  '/produkter/utekos-dun',
  '/produkter/utekos-mikrofiber',
  '/produkter/utekos-stapper',
  '/produkter/utekos-techdown',
  '/produkter/varmeplagg',
  '/uteguiden',
  '/uteguiden/cloudweave',
  '/uteguiden/glamping-i-norge',
  '/uteguiden/hva-er-glamping',
  '/uteguiden/hva-skal-man-ha-innerst',
  '/uteguiden/hvordan-forlenge-terassesesongen',
  '/uteguiden/hvordan-holde-varmen-ute',
  '/uteguiden/hvorfor-blir-man-kald',
  '/uteguiden/julegaven-til-den-som-har-alt',
  '/uteguiden/vinterlagring-av-campingvogn-og-bobil',
  '/uteguiden/ykk',
  '/vilkar-betingelser',
])

export function sanitizeOperationalPathname(
  value: string
): string {
  try {
    const pathname = new URL(value, 'https://utekos.no').pathname
    if (publicStorefrontRoutes.has(pathname)) return pathname
    return operationalRoute(pathname)
  } catch {
    return '/:other'
  }
}

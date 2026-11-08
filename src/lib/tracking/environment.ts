import { isWebCrawler } from './webCrawler'

type TrackingEnvironment = {
  NEXT_PUBLIC_TRACKING_ENABLED?: string
  NEXT_PUBLIC_VERCEL_ENV?: string
  VERCEL_ENV?: string
  NEXT_PUBLIC_TRACKING_QA_ENABLED?: string
}

/** Production conversion traffic is opt-in, including on a production build. */
export function trackingEnvironmentAllowsProduction(
  env: TrackingEnvironment,
  server: boolean
): boolean {
  return (
    env.NEXT_PUBLIC_TRACKING_ENABLED === 'true' &&
    env.NEXT_PUBLIC_VERCEL_ENV === 'production' &&
    (!server || env.VERCEL_ENV === 'production')
  )
}

/** Opt-in QA collection only: Vercel Preview branch and public QA switch. */
export function previewTrackingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_TRACKING_QA_ENABLED === 'true' &&
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' &&
    (typeof window !== 'undefined' || process.env.VERCEL_ENV === 'preview')
}

export function productionTrackingEnabled(): boolean {
  if (typeof window !== 'undefined' && isWebCrawler(window.navigator?.userAgent)) return false
  // Keep public lookups literal so Next.js can inline them in browser bundles.
  return previewTrackingEnabled() || trackingEnvironmentAllowsProduction(
    {
      NEXT_PUBLIC_TRACKING_ENABLED: process.env.NEXT_PUBLIC_TRACKING_ENABLED,
      NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    typeof window === 'undefined'
  )
}

export function isTrackingOrigin(value: string | URL): boolean {
  try {
    const url = new URL(value)
    if (url.username || url.password) return false
    if (previewTrackingEnabled()) return url.origin === 'https://preview.utekos.no'
    return url.origin === 'https://utekos.no' ||
      url.origin === 'https://www.utekos.no'
  } catch {
    return false
  }
}

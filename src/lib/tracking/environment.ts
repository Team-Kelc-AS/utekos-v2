type TrackingEnvironment = {
  NEXT_PUBLIC_TRACKING_ENABLED?: string
  NEXT_PUBLIC_VERCEL_ENV?: string
  VERCEL_ENV?: string
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

export function productionTrackingEnabled(): boolean {
  // Keep public lookups literal so Next.js can inline them in browser bundles.
  return trackingEnvironmentAllowsProduction(
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
    return !url.username && !url.password && (
      url.origin === 'https://utekos.no' ||
      url.origin === 'https://www.utekos.no'
    )
  } catch {
    return false
  }
}

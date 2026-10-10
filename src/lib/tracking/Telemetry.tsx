'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { withoutTrackingQuery } from '@/lib/analytics/withoutTrackingQuery'
import { isTrackingOrigin, productionTrackingEnabled } from './environment'

function beforeSend<T extends { url: string }>(event: T): T | null {
  if (!productionTrackingEnabled() || !isTrackingOrigin(event.url)) return null
  return { ...event, url: withoutTrackingQuery(event.url) }
}

export function Telemetry() {
  if (!productionTrackingEnabled()) return null
  if (typeof window !== 'undefined' && !isTrackingOrigin(window.location.href)) return null

  return (
    <>
      <Analytics
        mode="production"
        beforeSend={beforeSend}
      />
      <SpeedInsights
        beforeSend={beforeSend}
      />
    </>
  )
}

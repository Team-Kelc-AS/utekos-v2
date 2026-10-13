'use client'

import { useSyncExternalStore } from 'react'
import { isTrackingOrigin, productionTrackingEnabled } from './environment'

const subscribe = () => () => {}
const serverSnapshot = () => false
const browserSnapshot = () => productionTrackingEnabled() && isTrackingOrigin(window.location.href)

// The UA is browser-only. Keep SSR and the first hydration render identical;
// mount tracking after hydration only for eligible visitors.
export function useBrowserTrackingEnabled(): boolean {
  return useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot)
}

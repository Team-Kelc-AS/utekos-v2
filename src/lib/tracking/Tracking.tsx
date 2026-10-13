'use client';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { useBrowserTrackingEnabled } from './useBrowserTrackingEnabled';
const Runtime = dynamic(() => import('./TrackingRuntime'), { ssr: false });
export function Tracking() {
  const enabled = useBrowserTrackingEnabled();
  if (!enabled) return null;
  return <><Script src="/analytics/meta-pixel-canonical-v1.js" strategy="afterInteractive" /><Runtime /></>;
}

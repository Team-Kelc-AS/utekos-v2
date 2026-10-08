'use client';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { isTrackingOrigin, productionTrackingEnabled } from './environment';
const Runtime = dynamic(() => import('./TrackingRuntime'), { ssr: false });
export function Tracking() {
  if (!productionTrackingEnabled()) return null;
  if (typeof window !== 'undefined' && !isTrackingOrigin(window.location.href)) return null;
  return <><Script src="/analytics/meta-pixel-canonical-v1.js" strategy="afterInteractive" /><Runtime /></>;
}

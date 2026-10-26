'use client';

import Script from 'next/script';
import { useRef, useSyncExternalStore } from 'react';
import { isWebCrawler } from '@/lib/tracking/webCrawler';

declare global {
  interface Window {
    merchantwidget?: {
      start(options: {
        merchant_id: number;
        position: 'LEFT_BOTTOM';
        region: string;
        sideMargin: number;
        bottomMargin: number;
        mobileSideMargin: number;
        mobileBottomMargin: number;
      }): void;
    };
  }
}

const subscribe = () => () => {};
const serverSnapshot = () => false;
const browserSnapshot = () =>
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' &&
  ['https://utekos.no', 'https://www.utekos.no'].includes(window.location.origin) &&
  !isWebCrawler(window.navigator.userAgent);

export function GoogleMerchantWidget() {
  const enabled = useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);
  const started = useRef(false);

  if (!enabled) return null;

  return (
    <Script
      id="merchantWidgetScript"
      src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
      strategy="lazyOnload"
      onReady={() => {
        if (started.current) return;
        if (!window.merchantwidget) {
          console.error('Google Merchant widget API was unavailable after loading.');
          return;
        }
        window.merchantwidget.start({
          merchant_id: 5806691920,
          position: 'LEFT_BOTTOM',
          region: 'NO',
          sideMargin: 24,
          bottomMargin: 24,
          mobileSideMargin: 16,
          mobileBottomMargin: 120,
        });
        started.current = true;
      }}
      onError={() => console.error('Google Merchant widget could not be loaded.')}
    />
  );
}

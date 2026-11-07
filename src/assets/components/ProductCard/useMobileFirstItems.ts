'use client';

import { useSyncExternalStore } from 'react';

const mobileQuery = '(max-width: 767px)';
function subscribe(callback: () => void) {
  const viewport = matchMedia(mobileQuery);
  viewport.addEventListener('change', callback);
  return () => viewport.removeEventListener('change', callback);
}
const isMobile = () => matchMedia(mobileQuery).matches;
// Prioritize the stocked variant in the mobile server-rendered fallback too.
const serverIsMobile = () => true;

export function useMobileFirstItems<T>(items: T[], mobileFirstIndex?: number): T[] {
  const mobile = useSyncExternalStore(subscribe, isMobile, serverIsMobile);
  if (!mobile || mobileFirstIndex === undefined || mobileFirstIndex <= 0 || mobileFirstIndex >= items.length) return items;
  return [items[mobileFirstIndex], ...items.slice(0, mobileFirstIndex), ...items.slice(mobileFirstIndex + 1)];
}

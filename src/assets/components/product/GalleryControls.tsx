'use client';
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { CaretLeftIcon } from '@/components/utekos-icons/CaretLeftIcon';
import { CaretRightIcon } from '@/components/utekos-icons/CaretRightIcon';
import styles from './product.module.css';
const desktopQuery = '(min-width: 768px)';
function subscribeToViewport(callback: () => void) {
  const query = matchMedia(desktopQuery);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
const isDesktop = () => matchMedia(desktopQuery).matches;
const serverIsDesktop = () => false;

export function GalleryControls({ children, desktopCount, mobileCount, showMobileControls = true }: { children: ReactNode; desktopCount: number; mobileCount: number; showMobileControls?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const currentIndex = useRef(0);
  const railId = useId();
  const [index, setIndex] = useState(0);
  const desktop = useSyncExternalStore(subscribeToViewport, isDesktop, serverIsDesktop);
  const count = desktop ? desktopCount : mobileCount;

  useEffect(() => {
    const rail = ref.current;
    if (!rail) return;
    // Keep the same image when the width changes; clamp when switching to a shorter gallery.
    const observer = new ResizeObserver(() => {
      const next = Math.min(currentIndex.current, count - 1);
      currentIndex.current = next;
      setIndex(next);
      rail.scrollTo({ left: next * rail.clientWidth, behavior: 'instant' });
    });
    observer.observe(rail);
    return () => observer.disconnect();
  }, [count]);

  function goTo(nextIndex: number) {
    const rail = ref.current;
    if (!rail) return;
    const next = Math.max(0, Math.min(count - 1, nextIndex));
    rail.scrollTo({ left: next * rail.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  function move(direction: number) {
    goTo(index + direction);
  }
  const controlsViewport = !showMobileControls || mobileCount <= 1 ? 'desktop' : desktopCount <= 1 ? 'mobile' : undefined;
  return <div className={styles.gallery}>
    <div id={railId} ref={ref} className={styles.slides} role="region" aria-roledescription="bildekarusell" aria-label="Produktbilder" tabIndex={count > 1 ? 0 : undefined}
      onKeyDown={e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); move(e.key === 'ArrowRight' ? 1 : -1); }
        if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); goTo(e.key === 'Home' ? 0 : count - 1); }
      }}
      onScroll={() => {
        const rail = ref.current;
        if (rail?.clientWidth) {
          const next = Math.max(0, Math.min(count - 1, Math.round(rail.scrollLeft / rail.clientWidth)));
          currentIndex.current = next;
          setIndex(next);
        }
      }}>
      {children}
    </div>
    {(desktopCount > 1 || (showMobileControls && mobileCount > 1)) && <div className={styles.galleryControls} data-gallery-viewport={controlsViewport}>
      <button type="button" onClick={() => move(-1)} disabled={index === 0} aria-label="Forrige bilde" aria-controls={railId}><CaretLeftIcon /></button>
      <span aria-live="polite" aria-atomic="true">
        <span data-gallery-viewport="desktop">{Math.min(index + 1, desktopCount)} / {desktopCount}</span>
        <span data-gallery-viewport="mobile">{Math.min(index + 1, mobileCount)} / {mobileCount}</span>
      </span>
      <button type="button" onClick={() => move(1)} disabled={index >= count - 1} aria-label="Neste bilde" aria-controls={railId}><CaretRightIcon /></button>
    </div>}
  </div>;
}

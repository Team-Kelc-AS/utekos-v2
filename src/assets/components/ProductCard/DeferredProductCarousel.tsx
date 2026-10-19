'use client';

import { Children, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ProductCarousel.module.css';

type CarouselComponent = typeof import('./ProductCarousel').ProductCarousel;

export function DeferredProductCarousel({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);
  const id = useId();
  const [Carousel, setCarousel] = useState<CarouselComponent | null>(null);
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      void import('./ProductCarousel').then(module => {
        if (!disposed) {
          setCarousel(() => module.ProductCarousel);
          if (!interacted.current && !element.contains(document.activeElement)) setActive(true);
        }
      }).catch(() => {
        if (!disposed) setFailed(true);
      });
    }, { rootMargin: '400px' });
    observer.observe(element);
    return () => { disposed = true; observer.disconnect(); };
  }, []);

  function scroll(direction: number) {
    const element = rail.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  // Keep the server-rendered cards usable while loading or if the chunk fails.
  // Do not replace a fallback that currently contains keyboard focus.
  return <div ref={host} onPointerDownCapture={() => { if (!active) interacted.current = true; }} onWheelCapture={() => { if (!active) interacted.current = true; }} onBlurCapture={event => {
    if (Carousel && !interacted.current && !event.currentTarget.contains(event.relatedTarget)) setActive(true);
  }}>
    {Carousel && active ? <Carousel>{children}</Carousel> : <div className={styles.carousel} role="region" aria-roledescription="carousel" aria-label="Produktvarianter på lager" tabIndex={0}
      onKeyDown={event => {
        if (event.target instanceof Element && event.target.closest('video')) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          interacted.current = true;
          event.preventDefault(); scroll(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}>
      <div className={styles.navigation} aria-label="Bla gjennom produktvarianter">
        <button type="button" aria-label="Forrige produktvariant" aria-controls={id} onClick={() => scroll(-1)}><ChevronLeft aria-hidden="true" /></button>
        <button type="button" aria-label="Neste produktvariant" aria-controls={id} onClick={() => scroll(1)}><ChevronRight aria-hidden="true" /></button>
      </div>
      <div ref={rail} id={id} className={`${styles.rail} ${styles.fallbackRail}`}>
        {Children.map(children, (child, index) => <div className={styles.fallbackItem} role="group" aria-roledescription="slide" aria-label={`${index + 1} av ${Children.count(children)}`}>{child}</div>)}
      </div>
      {failed && <p role="status" className="sr-only">Utvidet karusell kunne ikke lastes. Du kan fortsatt bla med pilene.</p>}
    </div>}
  </div>;
}

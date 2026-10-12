'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './hytte-carousel.module.css';

/** The cards remain server-rendered; only scrolling needs client JavaScript. */
export function HytteProductCarousel({ heading, children }: { heading: string; children: ReactNode }) {
  const gallery = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });

  useEffect(() => {
    const element = gallery.current;
    if (!element) return;
    const update = () => {
      const previous = element.scrollLeft > 1;
      const next = element.scrollLeft < element.scrollWidth - element.clientWidth - 1;
      setEdges(current => current.previous === previous && current.next === next ? current : { previous, next });
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    element.addEventListener('scroll', update, { passive: true });
    const frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, [children]);

  function scroll(direction: -1 | 1) {
    const element = gallery.current;
    if (!element) return;
    const cardWidth = element.firstElementChild?.getBoundingClientRect().width ?? element.clientWidth;
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    element.scrollBy({ left: direction * (cardWidth + gap), behavior: scrollBehavior() });
  }

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    // Leave links, purchase buttons and review dialogs their own keyboard behavior.
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      scroll(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      event.currentTarget.scrollTo({ left: event.key === 'Home' ? 0 : event.currentTarget.scrollWidth, behavior: scrollBehavior() });
    }
  }

  return <div className={styles.carousel}>
    <div className={styles.header}>
      <div>
        <h2 id="hytte-products" className={styles.heading}>{heading}</h2>
        <p className={styles.intro}>Velg modell, farge og størrelse til hytteturen.</p>
      </div>
      <div className={styles.controls} hidden={!edges.previous && !edges.next}>
        <button type="button" aria-label="Scroll venstre" aria-controls="hytte-product-gallery" disabled={!edges.previous} onClick={() => scroll(-1)}><ChevronLeft size={24} strokeWidth={2.5} aria-hidden="true" /></button>
        <button type="button" aria-label="Scroll høyre" aria-controls="hytte-product-gallery" disabled={!edges.next} onClick={() => scroll(1)}><ChevronRight size={24} strokeWidth={2.5} aria-hidden="true" /></button>
      </div>
    </div>
    <div className={styles.viewport} data-previous={edges.previous} data-next={edges.next}>
      <ul id="hytte-product-gallery" ref={gallery} className={styles.gallery} tabIndex={0} aria-labelledby="hytte-products" onKeyDown={onKeyDown}>
        {children}
      </ul>
    </div>
  </div>;
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
}

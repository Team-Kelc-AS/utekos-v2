'use client';

import { Children, useEffect, useId, useState, type ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, useCarousel } from '@/components/ui/carousel';
import styles from './PromiseSection.module.css';

function Controls({ id }: { id: string }) {
  const { api } = useCarousel();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!api) return;
    const viewport = api.rootNode();
    const mobile = window.matchMedia('(max-width: 767px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const updateHeight = () => {
      const slide = api.slideNodes()[api.selectedScrollSnap()];
      if (slide) viewport.style.setProperty('--slide-height', `${slide.getBoundingClientRect().height}px`);
    };
    const stop = () => clearInterval(timer);
    const start = () => {
      stop();
      if (!paused && mobile.matches && !reducedMotion.matches && visible && !document.hidden) {
        timer = setInterval(() => api.scrollNext(), 3000);
      }
    };
    const stopOnInteraction = () => {
      stop();
      setPaused(true);
    };
    const stopOnFocus = (event: FocusEvent) => {
      // Let the pause button toggle playback without its own focus reversing it.
      if (event.target instanceof Element && event.target.closest('[data-promise-playback]')) return;
      stopOnInteraction();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    }, { threshold: 0.5 });
    const resizeObserver = new ResizeObserver(updateHeight);
    api.slideNodes().forEach(slide => resizeObserver.observe(slide));
    observer.observe(viewport);
    api.on('select', updateHeight).on('reInit', updateHeight).on('pointerDown', stopOnInteraction);
    viewport.parentElement?.addEventListener('focusin', stopOnFocus);
    viewport.parentElement?.addEventListener('mouseenter', stop);
    viewport.parentElement?.addEventListener('mouseleave', start);
    mobile.addEventListener('change', start);
    reducedMotion.addEventListener('change', start);
    document.addEventListener('visibilitychange', start);
    updateHeight();

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      api.off('select', updateHeight).off('reInit', updateHeight).off('pointerDown', stopOnInteraction);
      viewport.parentElement?.removeEventListener('focusin', stopOnFocus);
      viewport.parentElement?.removeEventListener('mouseenter', stop);
      viewport.parentElement?.removeEventListener('mouseleave', start);
      mobile.removeEventListener('change', start);
      reducedMotion.removeEventListener('change', start);
      document.removeEventListener('visibilitychange', start);
    };
  }, [api, paused]);

  return (
    <div className={styles.controls}>
      <CarouselPrevious className={styles.previous} aria-label="Forrige bilde" aria-controls={id} />
      <CarouselNext className={styles.next} aria-label="Neste bilde" aria-controls={id} />
      <button type="button" data-promise-playback className={styles.pause} onClick={() => setPaused(value => !value)} aria-label={paused ? 'Start automatisk bildebytte' : 'Pause automatisk bildebytte'} aria-controls={id}>
        {paused ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
      </button>
    </div>
  );
}

export function PromiseCarousel({ children }: { children: ReactNode }) {
  const id = useId();
  const count = Children.count(children);

  return (
    <Carousel className={styles.carousel} aria-label="Juster. Form. Nyt. – bildekarusell" tabIndex={0} opts={{ loop: true, breakpoints: { '(min-width: 768px)': { active: false }, '(prefers-reduced-motion: reduce)': { duration: 0 } } }}>
      <CarouselContent id={id} className={`ml-0 items-start ${styles.rail}`}>
        {Children.map(children, (child, index) => (
          <CarouselItem className={`pl-0 ${styles.slide}`} aria-label={`${index + 1} av ${count}`}>
            {child}
          </CarouselItem>
        ))}
      </CarouselContent>
      <Controls id={id} />
    </Carousel>
  );
}

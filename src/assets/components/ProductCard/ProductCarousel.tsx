'use client';

import { Children, useId, type ReactNode } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import styles from './ProductCarousel.module.css';

export function ProductCarousel({ children }: { children: ReactNode }) {
  const id = useId();
  const count = Children.count(children);

  return <Carousel
    className={styles.carousel}
    aria-label="Produktvarianter på lager"
    tabIndex={0}
    opts={{ align: 'start', loop: false, watchDrag: (_api, event) => !(event.target instanceof Element && event.target.closest('video')), breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } } }}
  >
    <div className={styles.navigation} aria-label="Bla gjennom produktvarianter">
      <CarouselPrevious className="static inset-auto m-0" aria-label="Forrige produktvariant" aria-controls={id} />
      <CarouselNext className="static inset-auto m-0" aria-label="Neste produktvariant" aria-controls={id} />
    </div>
    <CarouselContent id={id} className={`ml-0 ${styles.rail}`}>
      {Children.map(children, (child, index) => <CarouselItem className="basis-(--card-basis) pl-0" aria-label={`${index + 1} av ${count}`}>
        {child}
      </CarouselItem>)}
    </CarouselContent>
  </Carousel>;
}

import Image from 'next/image';
import { promiseImages } from '@/lib/frontpage/promiseImages';
import { PromiseCarousel } from './PromiseCarousel';
import styles from './PromiseSection.module.css';

export function PromiseSection() {
  return (
    <section className={styles.section} aria-label="Juster. Form. Nyt.">
      <div className={styles.panel}>
        <PromiseCarousel>
          {promiseImages.map(({ src, alt }) => (
            <Image key={src} src={src} alt={alt} width={1080} height={1080}
              sizes="(min-width: 1376px) 427px, (min-width: 1024px) 31vw, (min-width: 768px) 46vw, calc(100vw - 32px)"
              className={styles.image} />
          ))}
        </PromiseCarousel>
      </div>
    </section>
  );
}

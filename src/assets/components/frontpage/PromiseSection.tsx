import Image, { getImageProps } from 'next/image';
import { PromiseCarousel } from './PromiseCarousel';
import styles from './PromiseSection.module.css';

const images = [
  ['techdown-kate-kikkert-1080.webp', 'Kvinne i blå Utekos TechDown™ med kikkert på terrassen.'],
  ['kaffe-med-tilpasset-utekos-mikrofiber-vinter-terrasse-.webp', 'Kvinne med Utekos Mikrofiber™ rundt beina og en kopp på en snødekt terrasse.'],
  ['techdown-monica-1080.webp', 'Kvinne i blå Utekos TechDown™ ved bålpannen.'],
  ['techdown-kristoffer-1080.webp', 'Mann i blå Utekos TechDown™ på terrassen.'],
] as const;

export function PromiseSection() {
  const { props: desktop } = getImageProps({
    src: '/JUSTER.png', width: 1920, height: 1080,
    alt: 'Juster. Form. Nyt. Utekos til hytteliv, camping, båtliv og andre stunder ute.',
    sizes: '(min-width: 1376px) 1280px, calc(100vw - 96px)',
  });
  const { props: mobile } = getImageProps({
    src: '/JUSTER_1440x1800.png', width: 1440, height: 1800,
    alt: 'Juster. Form. Nyt.', sizes: 'calc(100vw - 32px)',
  });

  return (
    <section className={styles.section} aria-label="Juster. Form. Nyt.">
      <div className={styles.panel}>
        <PromiseCarousel>
          <picture>
            <source media="(min-width: 768px)" srcSet={desktop.srcSet} sizes={desktop.sizes} width={1920} height={1080} />
            {/* getImageProps provides Next.js optimization for this art-directed image. */}
            <img {...mobile} className={styles.image} alt="Juster. Form. Nyt." />
          </picture>
          {images.map(([src, alt]) => (
            <Image key={src} src={`/images/promise/${src}`} alt={alt} width={1080} height={1080} sizes="calc(100vw - 32px)" className={styles.image} />
          ))}
        </PromiseCarousel>
      </div>
    </section>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { googleSansFlex } from '@/lib/fonts';
import { retailers, retailerPath } from '@/lib/retailers';
import { IntersportAnimation } from './IntersportAnimation';
import styles from './IntersportSection.module.css';

export function IntersportSection() {
  return (
    <section aria-labelledby="dealer-store-heading" className={`${googleSansFlex.variable} ${styles.section}`}>
      <IntersportAnimation>
        <div className={styles.glow} aria-hidden />
        <div className={styles.inner}>
          <div className={styles.logoStage}>
            <div className={styles.particles} aria-hidden>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={`smoke-${index}`} data-intersport-smoke className={styles.smoke} style={{ left: index * 5, top: index * 2 }} />
              ))}
              {Array.from({ length: 8 }, (_, index) => (
                <div key={`spark-${index}`} data-intersport-spark className={styles.spark} style={{ left: index * 2, top: index * 2 }} />
              ))}
            </div>
            {retailers.map((retailer) => (
              <Link key={retailer.slug} href={retailerPath(retailer)} prefetch={false} data-intersport-logo className={styles.logoBox}>
                <Image src={retailer.logo.src} alt={retailer.name} width={retailer.logo.width} height={retailer.logo.height} className={styles.logo} />
              </Link>
            ))}
          </div>
          <div data-intersport-content className={styles.content}>
            <h2 id="dealer-store-heading">Sjekk ut Utekos i butikk!</h2>
            <p>
              Nå kan du se, prøve og kjenne på <strong>Utekos TechDown™</strong> hos en av våre dyktige forhandlere. Ta turen innom og bli blant de første som opplever neste generasjon Utekos!
            </p>
            <Link href="/forhandlere" prefetch={false} className={styles.directions}>
              Se alle forhandlere
              <span className={styles.arrow} aria-hidden><ArrowRight size={16} /></span>
            </Link>
          </div>
        </div>
      </IntersportAnimation>
    </section>
  );
}

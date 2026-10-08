import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { googleSansFlex } from '@/lib/fonts';
import { IntersportAnimation } from './IntersportAnimation';
import styles from './IntersportSection.module.css';

const mapsUrl = 'https://www.google.com/maps/place/INTERSPORT/@60.389279,5.2774875,16z/data=!4m6!3m5!1s0x463cfc74b2fdcbe3:0x610e4e94951a1998!8m2!3d60.389279!4d5.2864997!16s%2Fg%2F1ttdlkr4?entry=ttu&g_ep=EgoyMDI1MTAyNi4wIKXMDSoASAFQAw%3D%3D';

export function IntersportSection() {
  return (
    <section aria-labelledby="intersport-laksevag-heading" className={`${googleSansFlex.variable} ${styles.section}`}>
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
            <div data-intersport-logo className={styles.logoBox}>
              <Image src="/Intersport_logo.svg" alt="Intersport logo" width={1024} height={112} className={styles.logo} />
            </div>
          </div>
          <div data-intersport-content className={styles.content}>
            <h2 id="intersport-laksevag-heading">Sjekk ut Utekos på Intersport Laksevåg!</h2>
            <p>
              Se, prøve og kjenne på <strong>Utekos TechDown™</strong> hos våre gode venner på Intersport Laksevåg. Ta turen innom for å bli en av de første som får oppleve den neste generasjonen av Utekos!
            </p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.directions}>
              Vis vei til butikken
              <span className={styles.arrow} aria-hidden><ArrowRight size={16} /></span>
            </a>
          </div>
        </div>
      </IntersportAnimation>
    </section>
  );
}

import "server-only";

import Link from "next/link";
import desktopImage from "../../../../public/TechDown_32.jpg";
import { getImageProps } from "next/image";
import { googleSansFlex } from "@/lib/fonts";
import mobileImage from "../../../../public/TechDown_1.webp";
import styles from "./HeroSection.module.css";
import tabletImage from "../../../../public/Hero-iPad.webp";

// All three originals show TechDown; the mobile/tablet scene differs from desktop.
const imageOptions = {
  alt: "To personer slapper av ute i Utekos TechDown™.",
  sizes: "(min-width: 1024px) 100vw, (min-width: 640px) calc(100vw - 26px), (min-width: 424px) 382px, calc(100vw - 42px)",
  loading: "eager",
  fetchPriority: "high",
} as const;

function HeroImage() {
  const { props: desktop } = getImageProps({ ...imageOptions, src: desktopImage });
  const { props: tablet } = getImageProps({ ...imageOptions, src: tabletImage });
  const { props: mobile } = getImageProps({ ...imageOptions, src: mobileImage });

  return (
    <div className={styles.visual}>
      <picture>
        <source
          media="(min-width: 1024px)"
          srcSet={desktop.srcSet}
          sizes={desktop.sizes}
          width={desktop.width}
          height={desktop.height}
        />
        <source
          media="(min-width: 640px)"
          srcSet={tablet.srcSet}
          sizes={tablet.sizes}
          width={tablet.width}
          height={tablet.height}
        />
        {/* Next optimizes the sources on the server; picture needs no hydration. */}
        <img {...mobile} alt={imageOptions.alt} className={styles.image} />
      </picture>

      <div className={styles.overlay}>
        <p className={styles.tagline}>
          <span>JUSTER.</span>
          <span>FORM.</span>
          <span className={styles.accent}>NYT.</span>
        </p>
        <Link href="/produkter/varmeplagg" data-tracking-hero-cta="home-explore" className={styles.explore}>
          Utforsk
          <svg className={styles.arrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// Pure content is automatically prerendered with cacheComponents enabled.
export function HeroSection() {
  return (
    <section aria-labelledby="hero-h1" data-journey-section="hero" data-tracking-route="/" data-tracking-promotion="home-hero" data-tracking-creative="Skreddersy varmen" data-tracking-slot="hero" className={`${googleSansFlex.variable} ${styles.hero}`}>
      <HeroImage />
      <div className={styles.content}>
        <h1 id="hero-h1" className={styles.heading}>Skreddersy varmen</h1>
        <p className={styles.subheading}>
          Opplev kompromissløs komfort og overlegen allsidighet.
        </p>
      </div>
    </section>
  );
}

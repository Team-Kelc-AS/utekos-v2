import "server-only";

import Link from "next/link";
import { KlarnaLogo } from "@/components/payments/KlarnaLogo";
import { VippsLogo } from "@/components/payments/VippsLogo";
import { CheckMarkIcon } from "@/components/utekos-icons/CheckMarkIcon";
import { ArrowRightIcon } from "@/components/utekos-icons/ArrowRightIcon";
import styles from "./about.module.css";

export function AboutCta() {
  return (
    <section aria-labelledby="produktene-heading" className={styles.closing}>
      <div className={styles.closingCard}>
        <span className={styles.closingPill}>Oppdag vår kolleksjon</span>
        <h2 id="produktene-heading">Klar til å skreddersy varmen?</h2>
        <p className={styles.closingIntro}>
          Opplev hvordan gjennomtenkt funksjon og tidløs komfort kan forvandle en kjølig kveld til ditt favorittøyeblikk.
        </p>
        <Link className={`${styles.primaryLink} ${styles.closingLink}`} href="/produkter" prefetch={false} data-track="AboutUsShopAllProductsClick">
          Se alle produkter <ArrowRightIcon size={20} />
        </Link>
        <div className={styles.reassurance}>
          <span><CheckMarkIcon size={16} />Skapt for norske forhold</span>
          <span><CheckMarkIcon size={16} />Fri frakt over 999,-</span>
          <span className={styles.paymentReassurance}>
            Trygg handel med
            <VippsLogo role="img" aria-label="Vipps" />
            <KlarnaLogo role="img" aria-label="Klarna" />
          </span>
        </div>
      </div>
    </section>
  );
}

import "server-only";

import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { NBCC_LOGIN_URL, NBCC_PATH } from "@/lib/nbcc/content";
import { NbccMembershipDialog } from "./NbccMembershipDialog";
import styles from "./NbccMembership.module.css";

export function NbccMembershipSection() {
  return (
    <section className={styles.section} aria-labelledby="overview-nbcc-heading" data-nbcc-membership>
      <div className={styles.partnerLogos} aria-label="Utekos og Norsk Bobil og Caravan Club">
        <Image src="/assets/logo/utekos-badge.svg" alt="Utekos" width={354} height={354} className={styles.utekosLogo} unoptimized />
        <Image src="/images/partnere/nbcc-logo.svg" alt="Norsk Bobil og Caravan Club" width={286} height={203} className={styles.clubLogo} unoptimized />
      </div>
      <h2 id="overview-nbcc-heading" className={styles.heading}>
        Medlem av Norsk Bobil og Caravan Club?
      </h2>
      <p className={styles.intro}>
        Utekos er samarbeidspartner med Norsk Bobil og Caravan Club (NBCC).
        <br />Som medlem får du 100 kr rabatt på hele vårt sortiment.
      </p>
      <div className={styles.body}>
        <Image src="/images/partnere/nbcc-banner.svg" alt="NBCCs klubbmerke med rødt bånd" width={286} height={321} className={styles.banner} unoptimized />
        <div className={styles.instructions}>
          <ol className={styles.steps}>
            <li>Logg inn i Gnist-appen</li>
            <li>Hent rabattkoden din</li>
            <li>Velg din favoritt hos Utekos</li>
            <li>Bruk rabattkoden i kassen</li>
          </ol>
          <div className={styles.actions}>
            <Link href={NBCC_PATH} prefetch={false} className={cn(buttonVariants({ variant: "outline" }), styles.secondary)}>
              Finn ut mer
            </Link>
            <a href={NBCC_LOGIN_URL} className={cn(buttonVariants(), styles.primary)}>
              Til Gnist-app
            </a>
          </div>
          <NbccMembershipDialog />
        </div>
      </div>
    </section>
  );
}

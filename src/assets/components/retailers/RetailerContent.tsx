import "server-only";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { dealerHeading, dealerIntro, retailerAvailability, retailerDirectionsUrl, retailerPath, type Retailer } from "@/lib/retailers";
import styles from "./retailers.module.css";

export function RetailerLogo({ retailer }: { retailer: Retailer }) {
  return (
    <div className={`${styles.logoStage} ${retailer.logo.lightSurface ? styles.lightLogoStage : ""}`}>
      <Image src={retailer.logo.src} width={retailer.logo.width} height={retailer.logo.height} alt="" className={styles.logo} />
    </div>
  );
}

export function RetailerActions({ retailer }: { retailer: Retailer }) {
  return (
    <div className={styles.actions}>
      <a href={retailerDirectionsUrl(retailer)} className={styles.primaryLink}>
        <MapPin size={18} aria-hidden="true" />Se veibeskrivelse
      </a>
      <a href={`tel:${retailer.telephone}`} className={styles.secondaryLink}>
        <Phone size={18} aria-hidden="true" />Ring butikken
      </a>
    </div>
  );
}

export function RetailerContact({ retailer }: { retailer: Retailer }) {
  return (
    <dl className={styles.contactList}>
      <div><dt>Adresse</dt><dd>{retailer.street}<br />{retailer.postalCode} {retailer.locality}</dd></div>
      <div><dt>Telefon</dt><dd><a href={`tel:${retailer.telephone}`}>{retailer.phone}</a></dd></div>
    </dl>
  );
}

export function RetailerCard({ retailer }: { retailer: Retailer }) {
  return (
    <article className={styles.card} aria-labelledby={`${retailer.slug}-heading`}>
      <Image {...retailer.image} alt={retailer.image.alt} sizes="(min-width: 1024px) 30vw, 90vw" className={styles.entranceImage} />
      <RetailerLogo retailer={retailer} />
      <div className={styles.cardBody}>
        <p className={styles.place}>{retailer.place}</p>
        <h2 id={`${retailer.slug}-heading`}>{retailer.name}</h2>
        <p className={styles.assortment}>Fører Utekos TechDown™</p>
        <RetailerContact retailer={retailer} />
        <a href={retailer.hoursUrl} className={styles.hoursLink}>Se oppdaterte åpningstider</a>
        <p className={styles.availability}>{retailerAvailability}</p>
        <div className={styles.cardActions}>
          <RetailerActions retailer={retailer} />
          <Link href={retailerPath(retailer)} prefetch={false} className={styles.detailsLink}>
            Se butikkdetaljer <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function DealerCallout() {
  return (
    <section className={styles.dealerCallout} aria-labelledby="dealer-heading">
      <div><h2 id="dealer-heading">{dealerHeading}</h2><p>{dealerIntro}</p></div>
      <Link href="/bli-forhandler" prefetch={false} className={styles.primaryLink}>Bli forhandler <ArrowRight size={18} aria-hidden="true" /></Link>
    </section>
  );
}

export function RetailerJsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

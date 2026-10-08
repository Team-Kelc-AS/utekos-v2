import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { RetailerActions, RetailerContact, RetailerJsonLd, RetailerLogo } from "@/components/retailers/RetailerContent";
import RetailerOpeningHours, { OpeningHoursFallback } from "@/components/retailers/RetailerOpeningHours";
import { getRetailer, retailers, retailerAvailability, retailerPath } from "@/lib/retailers";
import { retailerStructuredData } from "@/lib/retailers/structured-data";
import { googleSansFlex } from "@/lib/fonts";
import styles from "@/components/retailers/retailers.module.css";

// Unknown slugs must finish validation before an instant shell can return 200.
export const instant = false;
export function generateStaticParams() { return retailers.map(({ slug }) => ({ slug })); }

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const retailer = getRetailer((await params).slug);
  if (!retailer) notFound();
  const title = `Utekos hos ${retailer.name} – ${retailer.locality}`;
  return {
    title, description: retailer.description, alternates: { canonical: retailerPath(retailer) },
    openGraph: { title, description: retailer.description, url: retailerPath(retailer), type: "website", locale: "nb_NO", images: [{ url: retailer.image.src, alt: retailer.image.alt }] },
  };
}

export default async function RetailerPage({ params }: Props) {
  const retailer = getRetailer((await params).slug);
  if (!retailer) notFound();
  return (
    <main className={`${googleSansFlex.variable} ${styles.page}`}>
      <RetailerJsonLd data={retailerStructuredData(retailer)} />
      <div className={styles.container}>
        <div className={styles.breadcrumbs}><Breadcrumbs items={[{ label: "Forsiden", href: "/" }, { label: "Forhandlere", href: "/forhandlere" }, { label: retailer.name }]} /></div>
        <header className={styles.header}>
          <p className={styles.place}>{retailer.place}</p>
          <h1>Utekos hos {retailer.name}</h1>
          <p className={styles.intro}>{retailer.description}</p>
        </header>
        <div className={styles.detailLayout}>
          <div className={styles.detailImage}>
            <Image {...retailer.image} alt={retailer.image.alt} sizes="(min-width: 1024px) 40vw, 90vw" className={styles.entranceImage} />
            <RetailerLogo retailer={retailer} />
          </div>
          <div className={styles.detailBody}>
            <section aria-labelledby="visit-heading">
              <h2 id="visit-heading">Besøk {retailer.name}</h2>
              <RetailerContact retailer={retailer} />
              <RetailerActions retailer={retailer} />
            </section>
            <section aria-labelledby="assortment-heading" className={styles.section}>
              <h2 id="assortment-heading">Utekos i butikken</h2>
              <p>Butikken fører <Link href="/produkter/utekos-techdown" prefetch={false}>Utekos TechDown™</Link>.</p>
              <p>{retailerAvailability}</p>
            </section>
            <section aria-labelledby="hours-heading" className={styles.section}>
              <h2 id="hours-heading">Åpningstider</h2>
              <Suspense fallback={<OpeningHoursFallback retailer={retailer} />}>
                <RetailerOpeningHours retailer={retailer} />
              </Suspense>
              <p><a href={retailer.hoursUrl}>Se oppdaterte åpningstider hos butikken</a></p>
            </section>
          </div>
        </div>
        <p className={styles.subtleLink}><Link href="/bli-forhandler" prefetch={false}>Driver du butikk? Bli Utekos-forhandler</Link></p>
      </div>
    </main>
  );
}

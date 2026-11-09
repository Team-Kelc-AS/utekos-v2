import type { Metadata } from "next";
import { buildWebsiteSocialMetadata } from "@/lib/seo/siteMetadata";
import Breadcrumbs from "@/components/Breadcrumbs";
import { DealerCallout, RetailerCard, RetailerJsonLd } from "@/components/retailers/RetailerContent";
import { retailers, retailerHeading, retailerIntro } from "@/lib/retailers";
import { retailerOverviewStructuredData } from "@/lib/retailers/structured-data";
import { googleSansFlex } from "@/lib/fonts";
import styles from "@/components/retailers/retailers.module.css";

export const metadata: Metadata = {
  title: "Forhandlere – kjøp Utekos i butikk", description: retailerIntro,
  alternates: { canonical: "/forhandlere" },
  ...buildWebsiteSocialMetadata(retailerHeading, retailerIntro, "/forhandlere", {
    url: retailers[0].image.src, width: retailers[0].image.width,
    height: retailers[0].image.height, alt: retailers[0].image.alt, type: "image/webp",
  }),
};

export default function RetailersPage() {
  return (
    <main className={`${googleSansFlex.variable} ${styles.page}`}>
      <RetailerJsonLd data={retailerOverviewStructuredData()} />
      <div className={styles.container}>
        <div className={styles.breadcrumbs}><Breadcrumbs items={[{ label: "Forsiden", href: "/" }, { label: "Forhandlere" }]} /></div>
        <header className={styles.header}><h1>{retailerHeading}</h1><p className={styles.intro}>{retailerIntro}</p></header>
        <div className={styles.grid}>{retailers.map((retailer) => <RetailerCard key={retailer.slug} retailer={retailer} />)}</div>
        <DealerCallout />
      </div>
    </main>
  );
}

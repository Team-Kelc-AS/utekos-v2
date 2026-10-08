import Breadcrumbs from "@/components/Breadcrumbs";
import DealerInquiryForm from "./DealerInquiryForm";
import Link from "next/link";
import type { Metadata } from "next";
import { RetailerJsonLd } from "@/components/retailers/RetailerContent";
import { dealerHeading } from "@/lib/retailers";
import { dealerStructuredData } from "@/lib/retailers/structured-data";
import { getContactEmailConfig } from "@/lib/contact";
import { googleSansFlex } from "@/lib/fonts";
import styles from "@/components/retailers/retailers.module.css";

const dealerIntro = "Vi er alltid på utkikk etter gode forhandlere. Fyll ut skjemaet, så tar vi en uforpliktende prat om produktene og muligheten for et samarbeid.";

export const metadata: Metadata = {
  title: "Bli forhandler – selg Utekos i din butikk", description: dealerIntro,
  alternates: { canonical: "/bli-forhandler" },
  openGraph: { title: dealerHeading, description: dealerIntro, url: "/bli-forhandler", type: "website", locale: "nb_NO" },
};

export default function BecomeDealerPage() {
  return (
    <main className={`${googleSansFlex.variable} ${styles.page}`}>
      <RetailerJsonLd data={dealerStructuredData()} />
      <div className={styles.container}>
        <div className={styles.breadcrumbs}><Breadcrumbs items={[{ label: "Forsiden", href: "/" }, { label: "Bli forhandler" }]} /></div>
        <header className={styles.header}>
          <h1>{dealerHeading}</h1><p className={styles.intro}>{dealerIntro}</p>
        </header>
        <div className={styles.recruitLayout}>
          <div className={styles.recruitIntro}>
            <section aria-labelledby="product-heading">
              <h2 id="product-heading">La kundene oppleve Utekos</h2>
              <p>I butikken kan kundene se, prøve og kjenne på Utekos TechDown™ eller Utekos Svale™ før de velger størrelse og farge.</p>
            </section>
            <section aria-labelledby="collaboration-heading">
              <h2 id="collaboration-heading">Et samarbeid for din butikk</h2>
              <p>Vi tilbyr trygge betingelser og god oppfølging på sortiment, bestilling og levering. Fortell oss gjerne hvem kundene deres er, og hvilke produkter dere ønsker i hyllene.</p>
              <p><Link href="/forhandlere" prefetch={false}>Se dagens Utekos-forhandlere</Link></p>
            </section>
            <section aria-labelledby="erling-heading" className={styles.directContact}>
              <h2 id="erling-heading">Snakk med Erling Holthe</h2>
              <p>Grunnlegger av Utekos</p>
              <a href="tel:+4740216343">40 21 63 43</a>
              <a href="mailto:erling@utekos.no">erling@utekos.no</a>
            </section>
          </div>
          <section id="forhandlerskjema" aria-labelledby="form-heading" className={styles.formPanel}>
            <h2 id="form-heading">Fortell oss om butikken din</h2>
            <p className={styles.formIntro}>Alle felt er påkrevd.</p>
            {getContactEmailConfig("erling@utekos.no") ? <DealerInquiryForm /> : <p role="status">Skjemaet er midlertidig utilgjengelig. Send henvendelsen til <a href="mailto:erling@utekos.no">erling@utekos.no</a>, eller ring <a href="tel:+4740216343">40 21 63 43</a>.</p>}
            <section aria-labelledby="dealer-pdf-heading" className={styles.pdfAttachment}>
              <h3 id="dealer-pdf-heading">Forhandlerinformasjon og skjema som PDF</h3>
              <p>Les om samarbeidet og fyll ut skjemaet i PDF-visningen. Når du trykker «Send henvendelsen», sendes opplysningene og den utfylte PDF-en automatisk til Erling Holthe.</p>
              <div className={styles.actions}>
                <a className={styles.primaryLink} href="/bli-forhandler/pdf" data-tracking-cta="dealer_pdf_open" target="_blank" rel="noopener">Åpne og fyll ut PDF<span className="sr-only"> (åpnes i ny fane)</span></a>
                <a className={styles.secondaryLink} href="/images/kunnskap/forhandler-utfyllbar.pdf" data-tracking-cta="dealer_pdf_download" download="Utekos-forhandler.pdf">Last ned PDF</a>
              </div>
              <p className={styles.pdfDetails}>PDF · 8 sider · 7 MB</p>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

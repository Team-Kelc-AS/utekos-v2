import "server-only";

import Link from "next/link";
import type { ReactNode } from "react";
import { googleSansFlex } from "@/lib/fonts";
import Newsletter from "./footer/Newsletter";
import PaymentMethods from "./footer/PaymentMethods";
import styles from "./Footer.module.css";

type FooterLink = Readonly<{
  label: ReactNode;
  href: string;
}>;

type FooterSection = Readonly<{
  id: string;
  title: string;
  links: readonly FooterLink[];
}>;

// Keep navigation as plain data; never import the destination pages here.
// Only link to migrated routes.
const sections: readonly FooterSection[] = [
  {
    id: "footer-handlehjelp",
    title: "Handlehjelp",
    links: [
      { label: "Kontakt oss", href: "/kontaktskjema" },
      { label: "Vask og vedlikehold", href: "/handlehjelp/vask-og-vedlikehold" },
      { label: "Størrelsesguide", href: "/handlehjelp/storrelsesguide" },
      { label: "Uteguiden", href: "/uteguiden" },
    ],
  },
  {
    id: "footer-kundeservice",
    title: "Kundeservice",
    links: [
      { label: "Kundeservice", href: "/kontaktskjema" },
      { label: "Tlf: +47 40 21 63 43", href: "tel:+4740216343" },
      {
        label: <span>E-post: <wbr />kundeservice@<wbr />utekos.no</span>,
        href: "mailto:kundeservice@utekos.no",
      },
    ],
  },
  {
    id: "footer-informasjon",
    title: "Informasjon",
    links: [
      { label: "Om oss", href: "/om-oss" },
      { label: "Forhandlere", href: "/forhandlere" },
      { label: "Bli forhandler", href: "/bli-forhandler" },
      { label: "Frakt og retur", href: "/frakt-og-retur" },
      { label: "Personvern", href: "/personvern" },
      { label: "Vilkår og betingelser", href: "/vilkar-betingelser" },
    ],
  },
];

const shopLinks: readonly FooterLink[] = [
  { label: "Forsiden", href: "/" },
  { label: "Alle produkter", href: "/produkter" },
  { label: "Varmeplagg", href: "/produkter/varmeplagg" },
  { label: "Tilbehør", href: "/produkter/tilbehor" },
  { label: "NBCC-medlemsfordel", href: "/produkter/camping-og-bobil/nbcc" },
];

function FooterLinks({ links }: { links: readonly FooterLink[] }) {
  return links.map(({ label, href }) => (
    <li key={href}>
      {href.startsWith("/") ? (
        // Keep Next's navigation link at the leaf.
        // No viewport/hover prefetch for this site-wide navigation.
        <Link href={href} prefetch={false} className={styles.link}>
          {label}
        </Link>
      ) : (
        <a href={href} className={styles.link}>
          {label}
        </a>
      )}
    </li>
  ));
}

export default function Footer() {
  return (
    <footer className={`${googleSansFlex.variable} ${styles.footer}`}>
      <div className={styles.container}>
        <div className={styles.columns}>
          {sections.map(({ id, title, links }) => (
            <nav key={id} aria-labelledby={id}>
              <h2 id={id} className={styles.heading}>{title}</h2>
              <ul className={styles.links}>
                <FooterLinks links={links} />
              </ul>
            </nav>
          ))}

          <section aria-labelledby="footer-bedrift">
            <h2 id="footer-bedrift" className={styles.heading}>Bedrifts<wbr />informasjon</h2>
            <address className={styles.address}>
              <p>KELC AS</p>
              <p>Lille Damsgårdsveien 25<br />5162 Laksevåg</p>
              <p>Org.nr. 925 820 393</p>
            </address>
          </section>
        </div>

        <nav aria-label="Utforsk Utekos" className={styles.shop}>
          <ul className={styles.shopLinks}>
            <FooterLinks links={shopLinks} />
          </ul>
        </nav>
        <Newsletter />
        <PaymentMethods />
        <p className={styles.copyright}>
          © 2026 Kelc AS. Alle rettigheter forbeholdt. Utekos® er et registrert varemerke i Norge.
        </p>
      </div>
    </footer>
  );
}

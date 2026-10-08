import "server-only";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { googleSansFlex } from "@/lib/fonts";
import styles from "./terms.module.css";

const description =
  "Les vilkår og betingelser for bruk av Utekos-nettstedet og kjøp av produkter, med lenker til personvern, frakt og retur.";

export const metadata: Metadata = {
  title: "Vilkår og betingelser",
  description,
  alternates: { canonical: "/vilkar-betingelser" },
  openGraph: {
    title: "Vilkår og betingelser | Utekos",
    description,
    url: "/vilkar-betingelser",
    siteName: "Utekos",
    locale: "nb_NO",
    type: "website",
  },
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return (
    <main className={`${googleSansFlex.variable} ${styles.page}`}>
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <Breadcrumbs items={[{ label: "Forsiden", href: "/" }, { label: "Vilkår og betingelser" }]} />
        </div>
        {children}
      </div>
    </main>
  );
}

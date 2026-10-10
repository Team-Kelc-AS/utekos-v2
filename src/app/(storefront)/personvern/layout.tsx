import "server-only";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { googleSansFlex } from "@/lib/fonts";
import styles from "./privacy.module.css";

const description =
  "Se hvilke personopplysninger KELC AS behandler for Utekos, hvorfor de brukes, hvem de deles med, lagringstidene og rettighetene dine.";

export const metadata: Metadata = {
  title: "Personvernerklæring",
  description,
  alternates: { canonical: "/personvern" },
  openGraph: {
    title: "Personvernerklæring | Utekos",
    description,
    url: "/personvern",
    siteName: "Utekos",
    locale: "nb_NO",
    type: "website",
  },
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return (
    <main className={`${googleSansFlex.variable} ${styles.page}`}>
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <Breadcrumbs items={[{ label: "Forsiden", href: "/" }, { label: "Personvern" }]} />
        </div>
        {children}
      </div>
    </main>
  );
}

import "server-only";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { googleSansFlex } from "@/lib/fonts";
import { buildWebsiteSocialMetadata } from "@/lib/seo/siteMetadata";
import styles from "./privacy.module.css";

const description =
  "Se hvilke personopplysninger KELC AS behandler for Utekos, hvorfor de brukes, hvem de deles med, lagringstidene og rettighetene dine.";

export const metadata: Metadata = {
  title: "Personvernerklæring",
  description,
  alternates: { canonical: "/personvern" },
  ...buildWebsiteSocialMetadata("Personvernerklæring | Utekos", description, "/personvern"),
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

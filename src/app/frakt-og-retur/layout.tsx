import "server-only";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { googleSansFlex } from "@/lib/fonts";
import styles from "./shipping-returns.module.css";

const description =
  "Frakt og retur hos Utekos: se fraktpris, leveringstid, 14 dagers angrerett, gratis størrelsesbytte, returadresse og hvordan du får pengene tilbake.";

export const metadata: Metadata = {
  title: "Frakt og retur – levering, angrerett og størrelsesbytte",
  description,
  alternates: { canonical: "/frakt-og-retur" },
  openGraph: {
    title: "Frakt og retur hos Utekos",
    description,
    url: "/frakt-og-retur",
    siteName: "Utekos",
    locale: "nb_NO",
    type: "website",
  },
};

export default function ShippingReturnsLayout({ children }: { children: ReactNode }) {
  return (
    <main className={`${googleSansFlex.variable} ${styles.page}`}>
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <Breadcrumbs items={[{ label: "Forsiden", href: "/" }, { label: "Frakt og retur" }]} />
        </div>
        {children}
      </div>
    </main>
  );
}

import "server-only";

import Breadcrumbs from "@/components/Breadcrumbs";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { googleSansFlex } from "@/lib/fonts";
import styles from "./about.module.css";

const title = "Utekos sin historie og løfte til deg";
const description =
  "Drevet av kalde kvelder og et løfte om å aldri la været stoppe de gode øyeblikkene.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/om-oss" },
  openGraph: {
    title,
    description,
    url: "/om-oss",
    siteName: "Utekos",
    locale: "nb_NO",
    type: "website",
  },
  twitter: { card: "summary", title, description },
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <main className={`${googleSansFlex.variable} ${styles.page}`}>
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <Breadcrumbs
            items={[{ label: "Forsiden", href: "/" }, { label: "Om oss" }]}
          />
        </div>
      </div>
      {children}
    </main>
  );
}

import "server-only";

import type { ReactNode } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import SupportJsonLd from "@/components/SupportJsonLd";
import { googleSansFlex } from "@/lib/fonts";
import { buildSupportMetadata } from "@/lib/seo/buildSupportMetadata";
import { supportPages } from "@/lib/seo/supportPages";
import styles from "./shipping-returns.module.css";

export const metadata = buildSupportMetadata("shippingReturns");

export default function ShippingReturnsLayout({ children }: { children: ReactNode }) {
  return (
    <main className={`${googleSansFlex.variable} ${styles.page}`}>
      <SupportJsonLd page="shippingReturns" />
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <Breadcrumbs items={supportPages.shippingReturns.breadcrumbs} />
        </div>
        {children}
      </div>
    </main>
  );
}

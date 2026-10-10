import "server-only";

import Breadcrumbs from "@/components/Breadcrumbs";
import type { ReactNode } from "react";
import SupportJsonLd from "@/components/SupportJsonLd";
import { buildSupportMetadata } from "@/lib/seo/buildSupportMetadata";
import { supportPages } from "@/lib/seo/supportPages";
import { googleSansFlex } from "@/lib/fonts";
import styles from "./about.module.css";

export const metadata = buildSupportMetadata("about");

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SupportJsonLd page="about" />
      <main className={`${googleSansFlex.variable} ${styles.page}`}>
        <div className={styles.container}>
          <div className={styles.breadcrumbs}>
            <Breadcrumbs
              items={supportPages.about.breadcrumbs}
            />
          </div>
        </div>
        {children}
      </main>
    </>
  );
}

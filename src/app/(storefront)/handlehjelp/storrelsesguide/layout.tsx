import "server-only";

import type { ReactNode } from "react";
import SupportJsonLd from "@/components/SupportJsonLd";
import { buildSupportMetadata } from "@/lib/seo/buildSupportMetadata";
import { supportPages } from "@/lib/seo/supportPages";
import Breadcrumbs from "@/components/Breadcrumbs";
import styles from "./sizeGuide.module.css";

export const metadata = buildSupportMetadata("sizeGuide");

export default function SizeGuideLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SupportJsonLd page="sizeGuide" />
      <main id="size-guide-hero" className={styles.page}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <Breadcrumbs items={supportPages.sizeGuide.breadcrumbs} />
          </div>
          <article id="storrelsesguide">{children}</article>
        </div>
      </main>
    </>
  );
}

import "server-only";

import type { ReactNode } from "react";
import SupportJsonLd from "@/components/SupportJsonLd";
import { buildSupportMetadata } from "@/lib/seo/buildSupportMetadata";
import { supportPages } from "@/lib/seo/supportPages";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata = buildSupportMetadata("maintenance");

export default function MaintenanceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SupportJsonLd page="maintenance" />
      <main className="flex-1 bg-background px-4 py-8 text-foreground [--background:var(--evening)] [--foreground:var(--cloud-dancer)] [--card:var(--jungle)] [--card-foreground:var(--foreground)] [--muted:var(--jungle)] [--muted-foreground:var(--foreground)] sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <Breadcrumbs items={supportPages.maintenance.breadcrumbs} />
          </div>
          <article id="vedlikehold-av-utekos" className="scroll-mt-28">{children}</article>
        </div>
      </main>
    </>
  );
}

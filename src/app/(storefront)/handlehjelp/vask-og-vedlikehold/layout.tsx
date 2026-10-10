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
      <main className="flex-1 bg-[#001a18] px-4 py-8 text-[#f0eee9] [--knowledge-ink:#f0eee9] [--knowledge-ink-muted:#f0eee9] [--knowledge-link:#f0eee9] [--knowledge-surface:#012622] [--knowledge-border:#f0eee9] [--primary:#b44701] sm:px-6 sm:py-12">
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

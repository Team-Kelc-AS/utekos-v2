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
      <main className="flex-1 bg-[#001211] bg-(image:--background-gradient) px-4 py-8 text-[#f0eee9] [--background:#001211] [--border:#18504a] [--card:#001a18] [--card-foreground:#f0eee9] [--foreground:#f0eee9] [--muted:#012622] [--muted-foreground:#c9d6d1] [--primary:#b94700] [--ring:#b94700] sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <Breadcrumbs items={supportPages.maintenance.breadcrumbs} />
          </div>
          <article id="vedlikehold-av-utekos" className="scroll-mt-28">{children}</article>
        </div>
      </main>
    </>
  );
}

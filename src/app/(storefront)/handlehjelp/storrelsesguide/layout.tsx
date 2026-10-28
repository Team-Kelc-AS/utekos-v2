import "server-only";

import type { ReactNode } from "react";
import SupportJsonLd from "@/components/SupportJsonLd";
import { buildSupportMetadata } from "@/lib/seo/buildSupportMetadata";
import { supportPages } from "@/lib/seo/supportPages";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata = buildSupportMetadata("sizeGuide");

export default function SizeGuideLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SupportJsonLd page="sizeGuide" />
      <main
        id="size-guide-hero"
        className="flex-1 bg-[#001211] bg-(image:--background-gradient) px-4 pt-8 pb-16 text-foreground [--foreground:#f0eee9] [--card:#001211] [--card-foreground:#f0eee9] [--knowledge-border:#ffffff40] [--knowledge-ink:#f0eee9] [--knowledge-ink-muted:#f0eee9] [--knowledge-link:#f0eee9] [--knowledge-surface:#18546a] [--primary:#012a2e] sm:px-6 sm:pt-12 sm:pb-20 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-foreground"
      >
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

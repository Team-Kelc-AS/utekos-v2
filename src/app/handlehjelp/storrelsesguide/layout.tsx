import "server-only";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

const description =
  "Finn riktig størrelse i Utekos TechDown, Dun, Mikrofiber og Comfyrobe. Se plaggmål, måleveiledning, råd om passform og vilkår for gratis størrelsesbytte.";

export const metadata: Metadata = {
  title: "Størrelsesguide – finn din perfekte passform",
  description,
  alternates: { canonical: "/handlehjelp/storrelsesguide" },
  openGraph: {
    title: "Størrelsesguide for Utekos",
    description,
    url: "/handlehjelp/storrelsesguide",
    siteName: "Utekos",
    locale: "nb_NO",
    type: "website",
  },
};

export default function SizeGuideLayout({ children }: { children: ReactNode }) {
  return (
    <main id="size-guide-hero" className="flex-1 bg-[#001a18] px-4 py-8 text-[#f0eee9] [--knowledge-ink:#f0eee9] [--knowledge-ink-muted:#f0eee9] [--knowledge-link:#f0eee9] [--knowledge-surface:#012622] [--knowledge-border:#f0eee9] [--primary:#b44701] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: "Forsiden", href: "/" }, { label: "Størrelsesguide" }]} />
        </div>
        <article id="storrelsesguide">{children}</article>
      </div>
    </main>
  );
}

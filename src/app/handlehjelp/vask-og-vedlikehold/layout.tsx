import "server-only";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

const title = "Vedlikehold av Utekos | Slik bevarer du varmen i mange år";
const description =
  "En tydelig vedlikeholdsguide for Utekos Dun, Mikrofiber, TechDown og Comfyrobe. Riktig vask, tørking og oppbevaring bevarer varmen, formen og kvaliteten – sesong etter sesong.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/handlehjelp/vask-og-vedlikehold" },
  openGraph: {
    title,
    description:
      "Slik vasker, tørker og oppbevarer du Utekos-plagget ditt for å bevare varmen og kvaliteten i mange år.",
    url: "/handlehjelp/vask-og-vedlikehold",
    siteName: "Utekos",
    locale: "nb_NO",
    type: "article",
    images: [
      {
        url: "/og-image-utekos-produkter.jpg",
        width: 1200,
        height: 630,
        alt: "To personer i mørkeblå Utekos-plagg sitter på en terrasse.",
      },
    ],
  },
};

export default function MaintenanceLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 bg-[#001a18] px-4 py-8 text-[#f0eee9] [--knowledge-ink:#f0eee9] [--knowledge-ink-muted:#f0eee9] [--knowledge-link:#f0eee9] [--knowledge-surface:#012622] [--knowledge-border:#f0eee9] [--primary:#b44701] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: "Forsiden", href: "/" }, { label: "Vask og vedlikehold" }]} />
        </div>
        <article id="vedlikehold-av-utekos" className="scroll-mt-28">{children}</article>
      </div>
    </main>
  );
}

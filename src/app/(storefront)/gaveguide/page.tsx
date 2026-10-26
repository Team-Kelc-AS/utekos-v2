import type { Metadata } from "next";
import { KlarnaInfoPagePlacement } from "../handlehjelp/klarna/components/KlarnaInfoPagePlacementComponent";
import { KlarnaOnSiteMessagingScript } from "../handlehjelp/klarna/components/KlarnaOnSiteMessagingScript";

export const metadata: Metadata = {
  metadataBase: new URL("https://utekos.no"),
  title: "Gavekort",
  description: "Finn oppdatert informasjon om betaling med Klarna hos Utekos.",
  alternates: { canonical: "/handlehjelp/klarna" },
  openGraph: {
    title: "Betaling med Klarna | Utekos",
    description:
      "Finn oppdatert informasjon om betaling med Klarna hos Utekos.",
    url: "/handlehjelp/klarna",
    siteName: "Utekos",
    locale: "no_NO",
    type: "website",
  },
};

export default function KlarnaHelpPage() {
  return (
    <article className="w-full max-w-full! min-w-full bg-foreground text-background">
      <KlarnaOnSiteMessagingScript />
      <article
        aria-label="Betalingsinformasjon fra Klarna"
        className="container mx-auto px-4 py-16 sm:py-24"
      >
        <KlarnaInfoPagePlacement />
      </article>
    </article>
  );
}

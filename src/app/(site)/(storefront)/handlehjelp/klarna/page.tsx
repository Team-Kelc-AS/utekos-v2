import { KlarnaInfoPagePlacement } from "./components/KlarnaInfoPagePlacementComponent";
import { KlarnaOnSiteMessagingScript } from "./components/KlarnaOnSiteMessagingScript";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://utekos.no"),
  title: "Betaling med Klarna",
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
    <article className="w-full min-h-[calc(100svh-72px)] flex-1 bg-foreground text-background md:min-h-[calc(100svh-112px)]">
      <KlarnaOnSiteMessagingScript />
      <article
        aria-label="Betalingsinformasjon fra Klarna"
        className="w-full"
      >
        <KlarnaInfoPagePlacement />
      </article>
    </article>
  );
}

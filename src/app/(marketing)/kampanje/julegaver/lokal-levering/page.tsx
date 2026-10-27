import { ArrowRight, Calendar, Car, Gift, ShieldCheck } from "lucide-react";
import {
  MerchantTruckIcon,
  PaymentOutlineIcon,
} from "@/components/utekos-icons";

import Image from "next/image";
import { ChristmasCampaignBreadcrumbs } from "../components/ChristmasCampaignBreadcrumbs";
import Link from "next/link";
import type { Metadata } from "next";
import { SantaHat } from "../components/SantaHat";
import { ChristmasCampaignPrice } from "../components/ChristmasCampaignPrice";
import comfyFrontUBakgrunn1080 from "@public/images/campaigns/julegaver/comfy-front-u-bakgrunn-1080.png";
import dunFrontHvitBakgrunn1080 from "@public/images/campaigns/julegaver/dun-front-hvit-bakgrunn-1080.png";
import mikroFront1080 from "@public/images/campaigns/julegaver/mikro-front-1080.png";
import techdown1080 from "@public/images/campaigns/julegaver/techdown-1080.png";
import { siteSocialImage } from "@/lib/seo/siteIdentity";

export const metadata: Metadata = {
  title: "Årets varmeste julegave levert hjem | Ferdig innpakket 🎁 !",

  description:
    "Finn de varmeste julegavene hos Utekos. TechDown, Comfyrobe, Dun og Mikrofiber. Utvidet bytterett og levering på dagen.",

  openGraph: {
    title: "Få årets varmeste julegave levert hjem – ferdig innpakket 🎁 !",
    description:
      "Den perfekte gaven til livsnyteren som har alt. Gi bort genial funksjonalitet som revolusjonerer opplevelsen av å være ute. Vi kjører ut bestillinger hver dag frem til julaften. Utvidet bytterett frem til 15. januar",
    url: "https://utekos.no/kampanje/julegaver/lokal-levering",
    siteName: "Utekos",
    locale: "nb_NO",
    type: "website",
    images: [siteSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Julegaver | Utekos",
    description:
      "Finn de varmeste julegavene hos Utekos. TechDown, Comfyrobe, Dun og Mikrofiber.",
    images: [siteSocialImage],
  },
};
export default function ChristmasLocalDelivery() {
  return (
    <div className="bg-background pb-20">
      <article className="relative overflow-hidden bg-card pt-24 pb-16 text-center text-card-foreground md:pt-32">
        <div className="relative z-10 container mx-auto px-4">
          <ChristmasCampaignBreadcrumbs
            currentLabel="Lokal levering"
            parentHref="/kampanje/julegaver"
            parentLabel="Julegaver"
          />
          {/* Badge for lokal tilhørighet */}
          <div className="bg-secondary text-secondary-foreground inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 backdrop-blur-sm">
            <Gift className="h-4 w-4" />
            <span className="text-sm font-medium">
              Gi bort funksjonell varme
            </span>
          </div>

          <h1 className="font-google-sans mt-8 text-4xl font-extrabold text-card-foreground sm:text-6xl">
            <span className="relative inline-block">
              Utekos leverer julegavene
              <SantaHat className="absolute -top-8 -left-6 h-16 w-16 -rotate-12 drop-shadow-xl md:-top-10 md:-left-8 md:h-20 md:w-20" />
            </span>
            <span className="block text-card-foreground">
              rett hjem til deg
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Klikk og hent eller få levert bestillingen hjem. Vi kjører ut
            julegaver helt frem til julaften! <br className="hidden sm:block" />
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="#bestselgere"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary"
            >
              Se gavene vi kan levere
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="h-4 w-4" />
              <span>Utkjøring til 24. desember</span>
            </div>
          </div>
        </div>
      </article>
      <article className="border-y border-border bg-card py-8 text-card-foreground">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background ring-1 ring-white/10">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-foreground">
                  Lokal hjemlevering
                </h3>
                <p className="text-sm text-muted-foreground">
                  Daglig utkjøring av julegaver i Bergens-området.
                </p>
              </div>
            </div>

            {/* 2. Bytterett (Viktig trygghet) */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background ring-1 ring-white/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-foreground">
                  Utvidet bytterett
                </h3>
                <p className="text-sm text-muted-foreground">
                  Bytt gaver frem til 15. januar.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background ring-1 ring-white/10">
                <PaymentOutlineIcon
                  tone="orange"
                  className="h-6 w-6 text-primary"
                />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-foreground">
                  Sikker betaling
                </h3>
                <p className="text-sm text-muted-foreground">
                  Betal trygt med Vipps eller Klarna.
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* --- SLIK GJØR DU DET (Instruksjon) --- */}
      <article className="container mx-auto mt-12 px-4">
        <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground md:p-10">
          <div className="text-center">
            <h3 className="font-google-sans text-2xl font-extrabold text-card-foreground">
              Slik fungerer julegave-ekspressen:
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Vi kjører ut gaver helt frem til julaften 🎅
            </p>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {/* Steg 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="font-google-sans mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white shadow-lg shadow-primary/50">
                1
              </div>
              <h4 className="font-sans font-semibold text-card-foreground">
                Fyll handlekurven
              </h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Finn dine favoritter. Vi har gavene på lokalt lager i Bergen.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="font-google-sans mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white shadow-lg shadow-primary/50">
                2
              </div>
              <h4 className="font-sans font-semibold text-card-foreground">
                Fyll inn adressen din
              </h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Valget{" "}
                <strong className="text-card-foreground">Lokal levering</strong>{" "}
                dukker opp automatisk <em>etter</em> at du har skrevet inn
                adressen din i kassen.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="font-google-sans mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white shadow-lg shadow-primary/50">
                3
              </div>
              <h4 className="font-sans font-semibold text-card-foreground">
                Skreddersydd levering?
              </h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Legg ved leveringsinstruksjon i kassen. Vi tar kontakt før
                utkjøring.
              </p>
            </div>
          </div>
        </div>
      </article>

      <article id="bestselgere" className="container mx-auto mt-16 px-4">
        <div className="mb-12 text-center">
          <h2 className="font-google-sans text-3xl font-extrabold">
            Våre mest populære gaver
          </h2>
          <p className="mt-2 text-muted-foreground">
            Fire gavetips for varmere opplevelser ute.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          <div className="group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all hover:border-primary/40">
            <div className="font-google-sans absolute top-4 right-4 z-10 rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-white shadow-lg">
              Nyhet
            </div>

            <div className="relative w-full overflow-hidden bg-night">
              <Image
                src={techdown1080}
                alt="Utekos TechDown - Vår varmeste dunponcho"
                className="h-auto w-full"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="p-6">
              <h3 className="font-google-sans text-2xl font-extrabold">
                Utekos TechDown™
              </h3>
              <p className="mt-2 text-muted-foreground">
                Nyhet: Vår varmeste mest allsidige modell. Optimalisert etter
                erfaringer og tilbakemeldinger.
              </p>
              <div className="mt-4 flex items-baseline gap-3">
                <ChristmasCampaignPrice productHandle="utekos-techdown" />
              </div>
              <Link
                href="/produkter/utekos-techdown"
                className="mt-6 block w-full rounded-lg bg-primary py-3 text-center font-sans font-semibold text-primary-foreground transition-colors hover:bg-primary-hover hover:text-primary-foreground"
              >
                Kjøp TechDown™
              </Link>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all hover:border-primary/40">
            <div className="font-google-sans absolute top-4 right-4 z-10 rounded-full bg-havdyp px-3 py-1 text-xs font-extrabold text-white shadow-lg">
              Bestselger
            </div>

            <div className="relative w-full overflow-hidden bg-night">
              <Image
                src={mikroFront1080}
                alt="Utekos Mikrofiber - Den originale skifteroben"
                className="h-auto w-full"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="p-6">
              <h3 className="font-google-sans text-2xl font-extrabold">
                Utekos Mikrofiber™
              </h3>
              <p className="mt-2 text-muted-foreground">
                Lettvekt møter varme og allsidighet. Gir deg følelsen av dun med
                ekstra fordeler.
              </p>
              <div className="mt-4 flex items-baseline gap-3">
                <ChristmasCampaignPrice productHandle="utekos-mikrofiber" />
              </div>
              <Link
                href="/produkter/utekos-mikrofiber"
                className="mt-6 block w-full rounded-lg bg-primary py-3 text-center font-sans font-semibold text-primary-foreground transition-colors hover:bg-primary-hover hover:text-primary-foreground"
              >
                Kjøp Mikrofiber
              </Link>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all hover:border-primary/40">
            <div className="font-google-sans absolute top-4 right-4 z-10 rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-white shadow-lg">
              Klassiker
            </div>

            <div className="relative w-full overflow-hidden bg-night">
              <Image
                src={dunFrontHvitBakgrunn1080}
                alt="Utekos Dun - Premium kvalitet"
                className="h-auto w-full"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="p-6">
              <h3 className="font-google-sans text-2xl font-extrabold">
                Utekos Dun™
              </h3>
              <p className="mt-2 text-muted-foreground">
                Klassisk dun-kvalitet for de kaldeste dagene.
              </p>
              <div className="mt-4 flex items-baseline gap-3">
                <ChristmasCampaignPrice productHandle="utekos-dun" />
              </div>
              <Link
                href="/produkter/utekos-dun"
                className="mt-6 block w-full rounded-lg bg-primary py-3 text-center font-sans font-semibold text-primary-foreground transition-colors hover:bg-primary-hover hover:text-primary-foreground"
              >
                Se Dun
              </Link>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all hover:border-primary/40">
            <div className="font-google-sans absolute top-4 right-4 z-10 rounded-full bg-card px-3 py-1 text-xs font-extrabold text-card-foreground shadow-lg">
              Allrounder
            </div>

            <div className="relative w-full overflow-hidden bg-night">
              <Image
                src={comfyFrontUBakgrunn1080}
                alt="Utekos Comfyrobe"
                className="h-auto w-full"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="p-6">
              <h3 className="font-google-sans text-2xl font-extrabold">
                Comfyrobe™
              </h3>
              <p className="mt-2 text-muted-foreground">
                Den ultimate skifteroben. Vindtett, vanntett og foret.
              </p>
              <div className="mt-4 flex items-baseline gap-3">
                <ChristmasCampaignPrice productHandle="comfyrobe" />
              </div>
              <Link
                href="/produkter/comfyrobe"
                className="mt-6 block w-full rounded-lg bg-primary py-3 text-center font-sans font-semibold text-primary-foreground transition-colors hover:bg-primary-hover hover:text-primary-foreground"
              >
                Kjøp Comfyrobe™
              </Link>
            </div>
          </div>
        </div>
      </article>

      <article className="container mx-auto mt-24 mb-6 px-4">
        <div className="mb-12 text-center">
          <h2 className="font-google-sans text-3xl font-extrabold">
            Sjekk om du kan få levering på døren
          </h2>
          <p className="mt-2 text-muted-foreground">
            Fyll inn adressen din i kassen. Dukker valget{" "}
            <em>Lokal levering</em> opp? Da kan du lene deg tilbake – vi fikser
            resten!
          </p>
          {/* Ny linje for henting lagt til her */}
          <p className="mt-1 text-muted-foreground">
            Vi tilbyr også <strong>henting hver dag mellom kl. 08-21</strong>{" "}
            frem til lille julaften.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/handlehjelp/funksjonalitet"
            className="group hover:bg-muted flex flex-col items-center rounded-xl bg-card p-8 text-center text-card-foreground transition-colors"
          >
            <div className="mb-4 rounded-full bg-primary/20 p-4 transition-transform group-hover:scale-110">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-sans font-semibold text-lg">Lær mer</h3>
            <p className="text-sm text-muted-foreground">
              Lær mer om funksjonaliteten.
            </p>
          </Link>

          <Link
            href="/kontaktskjema"
            className="group hover:bg-muted flex flex-col items-center rounded-xl bg-card p-8 text-center text-card-foreground transition-colors"
          >
            <div className="mb-4 rounded-full bg-havdyp/20 p-4 transition-transform group-hover:scale-110">
              <MerchantTruckIcon
                tone="orange"
                className="h-8 w-8 text-secondary-foreground"
              />
            </div>
            <h3 className="font-sans font-semibold text-lg">
              Spørsmål om levering?
            </h3>
            <p className="text-sm text-muted-foreground">Ta kontakt med oss.</p>
          </Link>

          <Link
            href="/handlehjelp/storrelsesguide"
            className="group hover:bg-muted flex flex-col items-center rounded-xl bg-card p-8 text-center text-card-foreground transition-colors"
          >
            <div className="mb-4 rounded-full bg-jungle/20 p-4 transition-transform group-hover:scale-110">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-sans font-semibold text-lg">
              Usikker på størrelse?
            </h3>
            <p className="text-sm text-muted-foreground">
              Se vår størrelsesguide og tips.
            </p>
          </Link>
        </div>
      </article>
    </div>
  );
}

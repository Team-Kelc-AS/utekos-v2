import { Calendar, Gift, ShieldCheck } from "lucide-react";
import { LocationIcon, PaymentOutlineIcon } from "@/components/utekos-icons";

import { ChristmasCampaignPrice } from "../components/ChristmasCampaignPrice";
import { Hero } from "../components/Hero";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import comfyFrontUBakgrunn1080 from "@public/images/campaigns/julegaver/comfy-front-u-bakgrunn-1080.png";
import dunFrontHvitBakgrunn1080 from "@public/images/campaigns/julegaver/dun-front-hvit-bakgrunn-1080.png";
import mikroFront1080 from "@public/images/campaigns/julegaver/mikro-front-1080.png";
import { siteSocialImage } from "@/lib/seo/siteIdentity";
import techdown1080 from "@public/images/campaigns/julegaver/techdown-1080.png";

export const metadata: Metadata = {
  title: "Julegavetips",
  description:
    "Finn de varmeste julegavene hos Utekos. TechDown, Comfyrobe, Dun og Mikrofiber. Utvidet bytterett og rask levering.",
  openGraph: {
    title: "Gi bort funksjonell varme | Julegavetips fra Utekos",
    description:
      "Den perfekte gaven til livsnyteren som har alt. Sikre deg høstens store trend med utvidet bytterett frem til 15. januar.",
    url: "https://utekos.no/kampanje/julegaver",
    siteName: "Utekos",
    locale: "nb_NO",
    type: "website",
    images: [siteSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Julegavetips | Utekos",
    description:
      "Finn de varmeste julegavene hos Utekos. TechDown, Comfyrobe, Dun og Mikrofiber.",
    images: [siteSocialImage],
  },
};
export default function ChristmasCampaign() {
  // Activity keeps inactive pages mounted; only theme the header for a visible page.
  return (
    <div
      className="bg-background pb-20 [body:has(>&:not([style*='display:_none']))>header]:bg-[#b22222]! [body:has(>&:not([style*='display:_none']))>header]:bg-[radial-gradient(ellipse_at_center,#ff0000_0%,#f90b0b_18%,#eb3300_34%,#e40a2d_50%,#e10600_66%,#dc011c_82%,#b22222_100%)]!"
    >
      <Hero />
      <article className="border-y border-border bg-card py-8 text-card-foreground">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-background ring-1 ring-white/10">
                <LocationIcon
                  tone="orange"
                  className="size-6 text-primary"
                />{" "}
              </div>
              <div>
                <h3 className="font-sans font-semibold text-foreground">
                  Sendes samme dag
                </h3>
                <p className="text-sm text-muted-foreground">
                  Bestill før 17. des – vi garanterer levering til jul!
                </p>
              </div>
            </div>

            {/* 2. Bytterett (Beholdes) */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-background ring-1 ring-white/10">
                <ShieldCheck className="size-6 text-primary" />
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
              <div className="flex size-12 items-center justify-center rounded-full bg-background ring-1 ring-white/10">
                <PaymentOutlineIcon
                  tone="orange"
                  className="size-6 text-primary"
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

      <article id="bestselgere" className="container mx-auto mt-20 px-4">
        <div className="mb-12 text-center">
          <h2 className="font-google-sans text-3xl font-extrabold">
            Våre mest populære gaver
          </h2>
          <p className="mt-2 text-muted-foreground">
            Fire gavetips for varmere opplevelser ute.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* Produkt 1: TechDown */}
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
                Kjøp TechDown
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
                Kjøp Comfyrobe
              </Link>
            </div>
          </div>
        </div>
      </article>

      <article className="container mx-auto mt-24 mb-6 px-4">
        <div className="mb-12 text-center">
          <h2 className="font-google-sans text-3xl font-extrabold">
            Bor du i Bergen?
          </h2>
          <Link
            href="/kampanje/julegaver/lokal-levering"
            className="mt-6 block w-full rounded-lg bg-primary py-3 text-center font-sans font-semibold text-primary-foreground transition-colors hover:bg-primary-hover hover:text-primary-foreground"
          >
            Trykk for å se eksklusivt lokal-tilbud!
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/produkter"
            className="group hover:bg-muted flex flex-col items-center rounded-xl bg-card p-8 text-center text-card-foreground transition-colors"
          >
            <div className="mb-4 rounded-full bg-primary/20 p-4 transition-transform group-hover:scale-110">
              <Gift className="size-8 text-primary" />
            </div>
            <h3 className="font-sans font-semibold text-lg">
              Hele kolleksjonen
            </h3>
            <p className="text-sm text-muted-foreground">
              Utforsk alle våre produkter
            </p>
          </Link>

          <Link
            href="/handlehjelp/funksjonalitet"
            className="group hover:bg-muted flex flex-col items-center rounded-xl bg-card p-8 text-center text-card-foreground transition-colors"
          >
            <div className="mb-4 rounded-full bg-havdyp/20 p-4 transition-transform group-hover:scale-110">
              <ShieldCheck className="size-8 text-secondary-foreground" />
            </div>
            <h3 className="font-sans font-semibold text-lg">Lær mer</h3>
            <p className="text-sm text-muted-foreground">
              Lær mer om funksjonaliteten.
            </p>
          </Link>

          <Link
            href="/handlehjelp/storrelsesguide"
            className="group hover:bg-muted flex flex-col items-center rounded-xl bg-card p-8 text-center text-card-foreground transition-colors"
          >
            <div className="mb-4 rounded-full bg-jungle/20 p-4 transition-transform group-hover:scale-110">
              <Calendar className="size-8 text-primary" />
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

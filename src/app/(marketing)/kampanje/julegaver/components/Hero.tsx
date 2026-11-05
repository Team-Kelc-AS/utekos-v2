import { ArrowRight, Gift } from "lucide-react";

import { ChristmasCampaignBreadcrumbs } from "./ChristmasCampaignBreadcrumbs";
import Link from "next/link";
import { MerchantTruckIcon } from "@/components/utekos-icons";
import { SantaHat } from "./SantaHat";

export function Hero() {
  return (
    <article
      className="relative overflow-hidden bg-utekos-gradient pt-12 pb-16 text-center text-card-foreground [--card:#012622] [--card-foreground:#f0eee9] [--muted-foreground:#f0eee9b3] md:pt-32"
    >
      <div className="relative z-10 container mx-auto px-4">
        <ChristmasCampaignBreadcrumbs currentLabel="Julegaver" />
        <div className="bg-secondary text-secondary-foreground inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 backdrop-blur-sm">
          <Gift className="size-4" />
          <span className="text-sm font-medium">Julegaver fra Utekos®</span>
        </div>
        <h1 className="font-google-sans mt-8 text-4xl font-extrabold text-card-foreground sm:text-6xl">
          <span className="relative inline-block">
            Gi bort
            <SantaHat className="absolute -top-8 -left-6 size-16 -rotate-12 drop-shadow-xl md:-top-10 md:-left-8 md:size-20" />
          </span>
          <span className="block text-card-foreground">funksjonell varme</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Den perfekte gaven til livsnyteren som har alt – unntatt varmen. Sikre
          deg høstens store trend.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="#bestselgere"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary"
          >
            Se gavetipsene
            <ArrowRight className="ml-2 size-4" />
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MerchantTruckIcon tone="orange" className="size-4" />
            <span>Fri frakt over 999kr</span>
          </div>
        </div>
      </div>
    </article>
  );
}

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import toKolonner from "@public/images/kunnskap/to_kolonner.webp";
import treIEn from "@public/images/kunnskap/tre_i_en_1500x1000.webp";
import vinterdagVedFjellhytta from "@public/images/kunnskap/Vinterdag ved fjellhytta.webp";

export default function SmartAlternativeSelection() {
  return (
    <section className="my-16 w-full max-w-312.75 mx-auto px-3">
      <div className="flex items-center justify-between mb-8">
        <h2
          id="hytte-varmedress"
          className="text-3xl md:text-4xl font-bold tracking-tight text-night"
        >
          Et smartere alternativ til en tradisjonell varmedress
        </h2>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        <Card className="flex aspect-6/7 w-full max-w-96.25 shrink-0 min-h-0 flex-col gap-0 py-0 overflow-hidden rounded-xl border-jungle/20 transition-all duration-300 hover:shadow-lg bg-jungle text-primary-foreground">
          <div className="relative w-full aspect-3/2 shrink-0 bg-lightgrey">
            <Image
              src={vinterdagVedFjellhytta}
              alt="Mann med ved i armene utenfor en fjellhytte om vinteren"
              fill
              sizes="(min-width: 768px) 385px, calc(100vw - 64px)"
              className="object-cover"
              priority
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <CardHeader className="items-center gap-3 pb-4 pt-3">
              <CardTitle className="text-xl text-primary-foreground font-extrabold">
                Kulden på hytten
              </CardTitle>
              <CardAction className="row-span-1 self-center flex items-center">
                <Badge variant="default">Utfordringen</Badge>
              </CardAction>
            </CardHeader>

            <CardContent className="text-base leading-relaxed text-primary-foreground pb-3">
              Tradisjonell varmedress varmer godt, men blir lett klam når du
              beveger deg.
            </CardContent>
          </div>

          <CardFooter className="shrink-0 pt-3 pb-3 border-t border-primary-foreground/15 bg-jungle mt-auto flex items-center justify-between group cursor-pointer">
            <Link
              href="/produkter/utekos-mikrofiber"
              prefetch={false}
              className="text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all w-full text-primary-foreground"
            >
              Utforsk Utekos Mikrofiber™
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </CardFooter>
        </Card>

        {/* Kort 2: Behovet */}

        <Card className="flex aspect-6/7 w-full max-w-96.25 shrink-0 min-h-0 flex-col gap-0 py-0 overflow-hidden rounded-xl border-jungle/20 transition-all duration-300 hover:shadow-lg bg-jungle text-primary-foreground">
          <div className="relative w-full aspect-3/2 shrink-0 bg-night">
            <Image
              src={toKolonner}
              alt="Utekos brukt som fulldekkende plagg i stolen og som parkas på tur ute"
              fill
              sizes="(min-width: 768px) 385px, calc(100vw - 64px)"
              className="object-cover"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <CardHeader className="items-center gap-3 pb-4 pt-3">
              <CardTitle className="text-xl text-primary-foreground font-extrabold">
                Fra godstolen til uteliv
              </CardTitle>
              <CardAction className="row-span-1 self-center flex items-center">
                <Badge variant="default">Behovet</Badge>
              </CardAction>
            </CardHeader>

            <CardContent className="text-base leading-relaxed text-primary-foreground pb-3">
              Regulér temperaturen med et fleksibelt plagg.
            </CardContent>
          </div>

          <CardFooter className="shrink-0 pt-3 pb-3 border-t border-primary-foreground/15 bg-jungle mt-auto flex items-center justify-between group cursor-pointer">
            <Link
              href="/handlehjelp/funksjonalitet"
              prefetch={false}
              className="text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all w-full text-primary-foreground"
            >
              Finn ut mer om funksjonaliteten
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </CardFooter>
        </Card>

        {/* Kort 3: Løsningen */}

        <Card className="flex aspect-6/7 w-full max-w-96.25 shrink-0 min-h-0 flex-col gap-0 py-0 overflow-hidden rounded-xl border-jungle/20 transition-all duration-300 hover:shadow-xl bg-jungle text-primary-foreground ring-1 ring-transparent hover:ring-jungle/20">
          <div className="relative w-full aspect-3/2 shrink-0 bg-lightgrey">
            <Image
              src={treIEn}
              alt="Utekos i tre brukssituasjoner: i godstolen, ved hyttedøren og på tur ute"
              fill
              sizes="(min-width: 768px) 385px, calc(100vw - 64px)"
              className="object-cover"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <CardHeader className="items-center gap-3 pb-4 pt-3">
              <CardTitle className="text-xl text-primary-foreground font-extrabold">
                3-i-1 løsningen
              </CardTitle>
              <CardAction className="row-span-1 self-center flex items-center">
                <Badge variant="default">Løsningen</Badge>
              </CardAction>
            </CardHeader>

            <CardContent className="text-base leading-relaxed text-primary-foreground pb-3">
              Forvandle{" "}
              <Link
                href="/produkter/utekos-techdown"
                prefetch={false}
                className="font-semibold no-underline text-primary-foreground"
              >
                Utekos
              </Link>{" "}
              fra fulldekkende til parkas på sekunder. Bruk i godstolen og når
              du skal hente ved.
            </CardContent>
          </div>

          <CardFooter className="shrink-0 pt-3 pb-3 border-t border-primary-foreground/15 bg-jungle mt-auto flex items-center justify-between group cursor-pointer">
            <Link
              href="/produkter/utekos-techdown"
              prefetch={false}
              className="text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all w-full text-primary-foreground"
            >
              Utforsk TechDown™
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}

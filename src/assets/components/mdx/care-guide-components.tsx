"use client";

import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Flame,
  Info,
  Layers,
  ShieldCheck,
  Shirt,
  Sparkles,
  Sun,
  Thermometer,
  Wind,
  XCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* 1. HABIT GRID (Fire raske vaner i toppen)                                  */
/* -------------------------------------------------------------------------- */

const habits = [
  {
    icon: Wind,
    title: "Luft før du vasker",
    description:
      "Frisk luft fjerner lukt og sparer fibrene for unødvendig slitasje.",
  },
  {
    icon: Sparkles,
    title: "Velg skånsomt program",
    description:
      "Lav sentrifugering og riktig temperatur beskytter ytterstoffet.",
  },
  {
    icon: Sun,
    title: "Tørk helt og rolig",
    description:
      "Plagget må være 100 % gjennomtørt før det pakkes eller henges bort.",
  },
  {
    icon: Shirt,
    title: "Oppbevar luftig",
    description: "Heng fritt på en bred henger fremfor langvarig kompresjon.",
  },
];

export function HabitGrid() {
  return (
    <section className="my-10">
      <h2 className="mb-4 text-xl font-extrabold tracking-tight text-[#f0eee9]">
        Fire vaner som bevarer plagget
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {habits.map((habit, index) => {
          const Icon = habit.icon;
          return (
            <div
              key={index}
              className="group relative flex flex-col justify-between rounded-xl border border-[#f0eee9]/10 bg-[#012622] p-5 transition-colors hover:border-[#b44701]/60"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#001a18] text-[#b44701] ring-1 ring-[#f0eee9]/10">
                  <Icon className="size-5" />
                </div>
                <span className="text-xs font-medium text-[#f0eee9]/40">
                  0{index + 1}
                </span>
              </div>
              <div>
                <h3 className="mb-1.5 text-base font-extrabold text-[#f0eee9]">
                  {habit.title}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-[#f0eee9]/75">
                  {habit.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. CARE CALLOUT (Erstatter flat advarselstekst)                            */
/* -------------------------------------------------------------------------- */

interface CareCalloutProps {
  title: string;
  variant?: "brand" | "dark";
  children: React.ReactNode;
}

export function CareCallout({
  title,
  variant = "brand",
  children,
}: CareCalloutProps) {
  return (
    <aside
      aria-label={title}
      className={cn(
        "my-10 rounded-xl border p-6 sm:p-8",
        variant === "brand"
          ? "border-[#b44701]/50 bg-[#012622] border-l-4 border-l-[#b44701]"
          : "border-[#f0eee9]/15 bg-[#010b0a] border-l-4 border-l-[#f0eee9]",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#b44701]/15 text-[#b44701]">
          <AlertTriangle className="size-5" />
        </div>
        <div className="space-y-3 text-left">
          <h3 className="text-lg font-extrabold text-[#f0eee9]">{title}</h3>
          <div className="space-y-2 text-sm font-medium leading-relaxed text-[#f0eee9]/85 [&_ul]:mt-3 [&_ul]:space-y-2">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. CARE STEPS (Visuell tidslinje for "Slik tar du vare på plagget")        */
/* -------------------------------------------------------------------------- */

interface CareStepProps {
  number: string;
  title: string;
  summary: string;
  highlight?: string;
  children: React.ReactNode;
}

export function CareSteps({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="my-14 rounded-2xl border border-[#f0eee9]/10 bg-[#010b0a] p-6 sm:p-10">
      <div className="mb-10 max-w-2xl text-left">
        <Badge className="mb-3 bg-[#b44701] text-[#f0eee9] hover:bg-[#b44701]/90">
          Steg-for-steg
        </Badge>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#f0eee9] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 text-base font-medium text-[#f0eee9]/75">
          {subtitle}
        </p>
      </div>
      <div className="relative space-y-6 before:absolute before:top-4 before:bottom-4 before:left-4.75 before:w-px before:bg-linear-to-b before:from-[#b44701] before:via-[#f0eee9]/20 before:to-transparent sm:before:left-5.75">
        {children}
      </div>
    </section>
  );
}

export function CareStep({
  number,
  title,
  summary,
  highlight,
  children,
}: CareStepProps) {
  return (
    <div className="relative pl-12 sm:pl-16">
      {/* Tidslinje-node */}
      <div className="absolute top-0 left-0 flex size-10 items-center justify-center rounded-full border-2 border-[#b44701] bg-[#001a18] text-sm font-extrabold text-[#f0eee9] shadow-sm sm:size-12">
        {number}
      </div>

      {/* Steg-kort */}
      <div className="rounded-xl border border-[#f0eee9]/10 bg-[#012622] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h3 className="text-lg font-extrabold text-[#f0eee9]">{title}</h3>
          {highlight && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[#001a18] px-3 py-1 text-xs font-medium text-[#f0eee9]/90 ring-1 ring-[#f0eee9]/15">
              <Info className="size-3.5 text-[#b44701]" />
              {highlight}
            </span>
          )}
        </div>
        <p className="mt-2 text-base font-extrabold text-[#f0eee9]/95">
          {summary}
        </p>
        <div className="mt-2 text-sm font-medium leading-relaxed text-[#f0eee9]/75">
          {children}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. UNIVERSAL RULES MATRIX (Slutt på repetisjon av "Gjør / Ikke gjør")      */
/* -------------------------------------------------------------------------- */

export function UniversalRulesMatrix({
  doItems,
  dontItems,
}: {
  doItems: string[];
  dontItems: string[];
}) {
  return (
    <section className="my-14">
      <div className="mb-6 max-w-2xl text-left">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#f0eee9]">
          Grunnregler for alle plagg i kolleksjonen
        </h2>
        <p className="mt-1.5 text-base font-medium text-[#f0eee9]/75">
          Disse prinsippene gjelder uansett hvilken Utekos-modell du eier, og
          sikrer at både ytterstoff og isolasjon beholder spensten år etter år.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* GJØR DETTE */}
        <div className="rounded-xl border border-[#f0eee9]/15 bg-[#012622] p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-[#f0eee9]/10 pb-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#001a18] text-[#f0eee9] ring-1 ring-[#f0eee9]/20">
              <CheckCircle2 className="size-5 text-[#b44701]" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#f0eee9]">
                Gjør alltid dette
              </h3>
              <p className="text-xs font-medium text-[#f0eee9]/65">
                Rutinene som forlenger levetiden
              </p>
            </div>
          </div>
          <ul className="space-y-3.5 text-left">
            {doItems.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-sm font-medium leading-relaxed text-[#f0eee9]/90"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#b44701]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* UNNGÅ DETTE */}
        <div className="rounded-xl border border-[#b44701]/40 bg-[#010b0a] p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-[#f0eee9]/10 pb-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#b44701]/15 text-[#b44701]">
              <XCircle className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#f0eee9]">
                Unngå alltid dette
              </h3>
              <p className="text-xs font-medium text-[#f0eee9]/65">
                Slitasje som svekker isolasjon og membran
              </p>
            </div>
          </div>
          <ul className="space-y-3.5 text-left">
            {dontItems.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-sm font-medium leading-relaxed text-[#f0eee9]/85"
              >
                <XCircle className="mt-0.5 size-4 shrink-0 text-[#b44701]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. MODEL CARE SELECTOR (Interaktive faner per modell fremfor tekstvegg)    */
/* -------------------------------------------------------------------------- */

const modelSpecs = [
  {
    id: "techdown",
    name: "Utekos TechDown™",
    tagline: "CloudWeave™ syntetisk dun og Luméa™ ytterstoff",
    temp: "Maks 30 °C (følg vaskelapp)",
    washAgent: "Mildt flytende vaskemiddel",
    drying: "Lufttørkes på bred henger",
    keyFocus:
      "Rist plagget lett etter vask for å fordele CloudWeave™-isolasjonen jevnt.",
    description:
      "Utekos TechDown™ er utviklet for ukomplisert vedlikehold og tørker svært raskt. Skånsom vask og rolig lufttørking bevarer både den matte Luméa™-finishen og isolasjonens spenst vask etter vask.",
    specificSteps: [
      "Lukk YKK® Dual V-Zip™ og alle lommeglidelåser helt før vask.",
      "Velg skånsomt program med lav sentrifugering og mild såpe uten blekemiddel.",
      "Heng plagget direkte til lufttørking med god plass rundt seg.",
      "Rist plagget lett når det er tørt for å løfte isolasjonen tilbake til fullt volum.",
    ],
    avoidNote:
      "Unngå tørketrommel med høy varme og ikke komprimer plagget i Utekos Stapper™ før det er 100 % tørt.",
  },
  {
    id: "mikrofiber",
    name: "Utekos Mikrofiber™",
    tagline: "Hurtigtørkende syntetisk fiber og DuraLite™ Nylon",
    temp: "Maks 30 °C skånsomt",
    washAgent: "Mild såpe uten tøymykner",
    drying: "Lufttørkes hengende",
    keyFocus:
      "Luft gjerne mellom bruk – mikrofiber trenger sjelden full maskinvask.",
    description:
      "Utekos Mikrofiber™ er slitesterkt, hurtigtørkende og krever minimalt med stell. Lav temperatur og rolig lufttørking hjelper de syntetiske fibrene med å holde på spensten og den isolerende luftlomme-strukturen.",
    specificSteps: [
      "Lukk alle glidelåser og slakk ut snorstramminger før du legger plagget i trommelen.",
      "Vask på maks 30 °C med mild såpe på skånsomt program.",
      "La plagget lufttørke på en stødig henger i romtemperatur.",
      "Tørk over ytterstoffet med en fuktig klut ved småflekker fremfor å vaske hele plagget.",
    ],
    avoidNote:
      "Skal ikke tørketromles, strykes eller blekes. Langvarig kompresjon i pakksekk kan flate ut fibrene.",
  },
  {
    id: "dun",
    name: "Utekos Dun™",
    tagline: "90 % sertifisert kvalitetsdun (650 FP) og 20D DWR-nylon",
    temp: "Maks 30 °C ull-/dunprogram",
    washAgent: "Spesialsåpe for dun (uten enzymer)",
    drying: "Tørketrommel på lav varme med 2–3 tørkeballer",
    keyFocus:
      "Dun krever tålmodighet under tørking for å gjenopprette full spenst og loft.",
    description:
      "Skånsom behandling bevarer den luftige varmen i Utekos Dun™. Naturlig dun bruker lengre tid på å tørke enn syntetisk isolasjon, og er helt avhengig av bevegelse under tørking for at dunfjærene ikke skal klumpe seg.",
    specificSteps: [
      "Lukk glidelåser, fest borrelås og vreng plagget før vask.",
      "Bruk kun eget dunvaskemiddel som bevarer dunets naturlige fettlag.",
      "Tørk i trommel på lav varme sammen med 2–3 tørkeballer (når vaskelappen tillater det).",
      "Ta ut plagget med jevne mellomrom under tørkesyklusen og rist forsiktig løs eventuelle dunklumper.",
    ],
    avoidNote:
      "Bruk aldri vanlig vaskemiddel med enzymer eller optisk hvitt, og legg aldri bort plagget før dunet er 100 % tørt helt inn i kjernen.",
  },
  {
    id: "comfyrobe",
    name: "Comfyrobe™",
    tagline:
      "HydroGuard™ vanntett skall (8 000 mm) og SherpaCore™ lammeullsfleece",
    temp: "Maks 40 °C skånsomt program",
    washAgent: "Mildt vaskemiddel",
    drying: "Lufttørkes hengende",
    keyFocus:
      "Skyll og luft alltid godt etter eksponering for saltvann, klor eller isbading.",
    description:
      "Comfyrobe™ kombinerer et vanntett membranskall med et tykt SherpaCore™-fôr. Riktig lufting i hverdagen og skånsom vask uten tøymykner sørger for at membranen forblir tett samtidig som fleecen holder seg myk.",
    specificSteps: [
      "Heng plagget til lufting og tørk etter bruk i regn, ved sjøen eller etter bading.",
      "Maskinvask på maks 40 °C på skånsomt program med mildt vaskemiddel.",
      "La roben tørke hengende. Om nødvendig kan den tromles svært kort på lav temperatur kun for å børste opp fôret.",
      "Etterbehandle ytterstoffet med egnet impregneringsspray (DWR) ved behov.",
    ],
    avoidNote:
      "Ytterstoffet i HydroGuard™ må aldri utsettes for høy varme, og roben må ikke pakkes bort mens SherpaCore™-fôret fortsatt holder på fukt.",
  },
];

export function ModelCareSelector() {
  return (
    <section className="my-14">
      <div className="mb-6 max-w-2xl text-left">
        <Badge className="mb-3 bg-[#012622] text-[#f0eee9] ring-1 ring-[#f0eee9]/15">
          Modellspesifikk pleie
        </Badge>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#f0eee9] sm:text-3xl">
          Velg ditt Utekos-plagg
        </h2>
        <p className="mt-2 text-base font-medium text-[#f0eee9]/75">
          Ulike materialer krever ulik behandling. Velg modellen din under for å
          se nøyaktig temperatur, tørkemetode og spesialråd.
        </p>
      </div>

      <Tabs defaultValue="techdown" className="w-full">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-2 rounded-xl bg-[#010b0a] p-2 ring-1 ring-[#f0eee9]/10">
          {modelSpecs.map((model) => (
            <TabsTrigger
              key={model.id}
              value={model.id}
              className="rounded-lg px-4 py-2.5 text-sm font-extrabold text-[#f0eee9]/70 transition-all data-[state=active]:bg-[#b44701] data-[state=active]:text-[#f0eee9] data-[state=active]:shadow-sm"
            >
              {model.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {modelSpecs.map((model) => (
          <TabsContent
            key={model.id}
            value={model.id}
            className="mt-0 rounded-2xl border border-[#f0eee9]/15 bg-[#012622] p-6 sm:p-8"
          >
            {/* Header for valgt modell */}
            <div className="border-b border-[#f0eee9]/10 pb-6 text-left">
              <span className="text-xs font-medium text-[#b44701]">
                {model.tagline}
              </span>
              <h3 className="mt-1 text-2xl font-extrabold text-[#f0eee9]">
                {model.name}
              </h3>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-[#f0eee9]/80">
                {model.description}
              </p>
            </div>

            {/* 3 raske spesifikasjons-kort */}
            <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-[#001a18] p-4 ring-1 ring-[#f0eee9]/10">
                <div className="flex items-center gap-2 text-xs font-medium text-[#f0eee9]/60">
                  <Thermometer className="size-4 text-[#b44701]" />
                  <span>Temperatur og program</span>
                </div>
                <p className="mt-1.5 text-sm font-extrabold text-[#f0eee9]">
                  {model.temp}
                </p>
              </div>

              <div className="rounded-xl bg-[#001a18] p-4 ring-1 ring-[#f0eee9]/10">
                <div className="flex items-center gap-2 text-xs font-medium text-[#f0eee9]/60">
                  <Droplets className="size-4 text-[#b44701]" />
                  <span>Vaskemiddel</span>
                </div>
                <p className="mt-1.5 text-sm font-extrabold text-[#f0eee9]">
                  {model.washAgent}
                </p>
              </div>

              <div className="rounded-xl bg-[#001a18] p-4 ring-1 ring-[#f0eee9]/10">
                <div className="flex items-center gap-2 text-xs font-medium text-[#f0eee9]/60">
                  <Wind className="size-4 text-[#b44701]" />
                  <span>Tørkemetode</span>
                </div>
                <p className="mt-1.5 text-sm font-extrabold text-[#f0eee9]">
                  {model.drying}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h4 className="mb-3 text-base font-extrabold text-[#f0eee9]">
                  Slik går du frem med {model.name}
                </h4>
                <ul className="space-y-3">
                  {model.specificSteps.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm font-medium leading-relaxed text-[#f0eee9]/85"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#b44701]/20 text-xs font-extrabold text-[#b44701]">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-xl bg-[#010b0a] p-5 ring-1 ring-[#f0eee9]/10">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-[#b44701]">
                    <Layers className="size-4" />
                    <span>Viktig for denne modellen</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-[#f0eee9]/90">
                    {model.keyFocus}
                  </p>
                </div>

                <div className="border-t border-[#f0eee9]/10 pt-3">
                  <p className="text-xs font-medium leading-relaxed text-[#f0eee9]/65">
                    <strong className="font-extrabold text-[#f0eee9]">
                      Merk:
                    </strong>{" "}
                    {model.avoidNote}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

const dwrSteps = [
  {
    step: "1",
    title: "Vask plagget rent og tørk helt",
    description:
      "Skitt og fett blokkerer impregneringen. Vask plagget etter anvisningen først, og la det tørke til det er helt tørt.",
    icon: Droplets,
  },
  {
    step: "2",
    title: "Påfør egnet DWR-spray jevnt",
    description:
      "Heng plagget luftig og spray et jevnt lag med tekstilimpregnering på ytterstoffet, med ekstra fokus på skuldre, hette og ermer.",
    icon: ShieldCheck,
  },
  {
    step: "3",
    title: "Aktiver kun hvis vaskelappen tillater det",
    description:
      "Noen DWR-sprayer lufttørker ferdig, mens andre krever svært lav varme for aktivering. Sjekk alltid både vaskelapp og flaskens veiledning.",
    icon: Flame,
  },
];

export function DwrRestorer() {
  return (
    <section className="my-14 rounded-2xl border border-[#f0eee9]/15 bg-[#012622] p-6 sm:p-10">
      <div className="mb-8 max-w-2xl text-left">
        <Badge className="mb-3 bg-[#001a18] text-[#f0eee9] ring-1 ring-[#f0eee9]/15">
          Vannavvisende beskyttelse (DWR)
        </Badge>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#f0eee9]">
          Frisk opp impregneringen
        </h2>
        <p className="mt-2 text-base font-medium text-[#f0eee9]/75">
          Når regndråpene ikke lenger preller like lett av ytterstoffet, trenger
          du ikke et nytt plagg – du trenger bare å reaktivere DWR-beskyttelsen
          i tre enkle trinn.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {dwrSteps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="flex flex-col justify-between rounded-xl bg-[#001a18] p-6 ring-1 ring-[#f0eee9]/10"
            >
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#b44701] text-sm font-extrabold text-[#f0eee9]">
                    {item.step}
                  </span>
                  <Icon className="size-5 text-[#f0eee9]/50" />
                </div>
                <h3 className="text-base font-extrabold text-[#f0eee9]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-[#f0eee9]/75">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const faqItems = [
  {
    q: "Hvor ofte bør jeg vaske Utekos-plagget mitt?",
    a: "Vask sjeldnere enn du tror. God lufting mellom hver bruk og rask flekkfjerning med en fuktig klut er som regel nok. Vask først når plagget faktisk er skittent – hyppig maskinvask sliter mer på fibrene enn vanlig bruk utendørs.",
  },
  {
    q: "Kan jeg bruke vanlig vaskemiddel på Utekos Dun™?",
    a: "Bruk helst et eget dunvaskemiddel, eller et svært mildt flytende vaskemiddel uten enzymer og optisk hvitt. Vanlige vaskemidler bryter ned dunets naturlige fettlag og reduserer isolasjonsevnen over tid.",
  },
  {
    q: "Hva gjør jeg hvis vann ikke lenger preller av ytterstoffet?",
    a: "Da kan DWR-behandlingen enkelt friskes opp. Vask plagget rent, la det tørke helt og påfør en egnet impregneringsspray jevnt over ytterstoffet. Bruk lav varme til aktivering kun når både vaskelappen og produktveiledningen på sprayen tillater det.",
  },
  {
    q: "Kan dunet klumpe seg under vask?",
    a: "Ja, våt dun vil naturlig samle seg i klumper. Bruk tørketrommel på lav varme med 2–3 tørkeballer når vaskelappen tillater det, og ta ut plagget med jevne mellomrom for å riste løs klumper for hånd. Plagget må være helt gjennomtørt før det legges bort.",
  },
  {
    q: "Hvordan oppbevarer jeg plagget mellom sesonger?",
    a: "Heng plagget på en stødig henger i et tørt og luftig skap. Unngå å lagre plagget i Utekos Stapper™, kompresjonsposer eller tette plastomslag over lengre tid – isolasjonen trenger luft og plass for å bevare spensten og varmeevnen.",
  },
];

export function CareFaq() {
  return (
    <section className="my-14">
      <div className="mb-6 max-w-2xl text-left">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#f0eee9]">
          Vanlige spørsmål om vask og vedlikehold
        </h2>
        <p className="mt-1.5 text-base font-medium text-[#f0eee9]/75">
          Raske svar på det livsnytere oftest lurer på når sesongen er på hell.
        </p>
      </div>

      <Accordion multiple={false} className="w-full space-y-3">
        {faqItems.map((item, index) => (
          <AccordionItem
            key={index}
            value={`faq-${index}`}
            className="rounded-xl border border-[#f0eee9]/10 bg-[#012622] px-6"
          >
            <AccordionTrigger className="py-5 text-left text-base font-extrabold text-[#f0eee9] hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-left text-sm font-medium leading-relaxed text-[#f0eee9]/80">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

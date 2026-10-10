export const categories = {
  varmeplagg: {
    label: "Varmeplagg",
    title: "Varmeplagg fra Utekos",
    description: "Se varmeplagg fra Utekos. Sammenlign modellene og finn informasjon om passform, materialer og størrelser på produktsidene.",
    intro: "Her finner du varmeplaggene samlet, fra Utekos Dun™ og Utekos Mikrofiber™ til TechDown™, Svale og Comfyrobe™. Åpne produktsidene for å sammenligne materialer, passform og tilgjengelige størrelser.",
    guidanceTitle: "Hva bør du sammenligne?",
    guidance: ["Tenk gjennom om plagget først og fremst skal brukes når du sitter i ro eller er i bevegelse.", "Sammenlign materialene og funksjonene til hver modell, og sjekk størrelsen før du velger.", "Tilbehør til pakking og oppbevaring finner du i en egen kategori."],
    source: { kind: "collection", handle: "produkter" },
  },
  tilbehor: {
    label: "Tilbehør",
    title: "Tilbehør til Utekos",
    description: "Finn tilbehør til pakking og oppbevaring av Utekos. Se Utekos Stapper™ og produktinformasjon før du velger.",
    intro: "Tilbehøret er samlet her, adskilt fra varmeplaggene. Utekos Stapper™ er en kompresjonsbag for transport og oppbevaring.",
    guidanceTitle: "Planlegg pakking og oppbevaring",
    guidance: ["Sjekk produktbeskrivelsen for størrelse og bruk før du velger tilbehør.", "Se varmeplaggene i en egen oversikt dersom du også trenger et plagg."],
    source: { kind: "collection", handle: "tilbehor" },
  },
  "camping-og-bobil": {
    label: "Camping og bobil",
    title: "Skreddersy varmen på camping- og bobiltur",
    description: "Sammenlign Utekos Svale, TechDown™, Mikrofiber™ og Dun™ til camping og bobil. Velg størrelse og farge, og finn varme til pausene utendørs.",
    intro: "Morgenkaffen utenfor bobilen, en pause i campingstolen eller en lang kveld rundt campingbordet. Her finner du komfortable varmeplagg som både oppgraderer og forlenger de fine stundene utendørs. Juster, form og nyt.",
    guidanceTitle: "Velg ut fra hvordan du reiser",
    guidance: ["Skal plagget brukes mest ved bobilen eller også når du går korte turer? Sammenlign passform og funksjoner på produktsiden.", "Se på plassen du har til oppbevaring, og vurder kompresjonsbag separat fra plagget.", "Sjekk materialer, størrelse og vedlikehold før du pakker til turen."],
    source: { kind: "selection", handles: ["utekos-svale", "utekos-techdown", "utekos-mikrofiber", "utekos-dun"] },
  },
  hytte: {
    label: "Hytte",
    title: "Varmeplagg til hytta",
    description: "Utforsk Utekos-plagg til hytteliv. Sammenlign TechDown™, Dun™ og Comfyrobe™ til pausene ved hytta og på uteplassen.",
    intro: "Til kaffen ved hytteveggen eller pausen på hytteterrassen kan det være nyttig å sammenligne både lengde, materialer og bevegelsesfrihet. Disse modellene omtaler hyttebruk i produktbeskrivelsene.",
    guidanceTitle: "Velg for hverdagen på hytta",
    guidance: ["Vurder om du ønsker et plagg til rolige stunder ved hytta eller et plagg som også skal brukes på tur.", "Sammenlign de ulike materialene på produktsidene fremfor å velge bare etter utseende.", "Kontroller størrelsen og hvor mye plass du trenger til klær under plagget."],
    source: { kind: "selection", handles: ["utekos-techdown", "utekos-dun", "comfyrobe"] },
  },
  terrasse: {
    label: "Terrasse",
    title: "Varmeplagg til terrassen",
    description: "Se Utekos-plagg til terrasseliv og rolige stunder ute. Sammenlign Svale, TechDown™, Dun™ og Comfyrobe™.",
    intro: "Når du vil bli sittende ute, er behovet et annet enn når du er i aktivitet. Her har vi samlet Svale, som er laget for kvelder ute, og modeller som omtaler terrasseliv i produktbeskrivelsene.",
    guidanceTitle: "Finn et plagg til uteplassen",
    guidance: ["Tenk gjennom hvilken del av sesongen du vil bruke plagget, og sammenlign modellene før du velger.", "Se etter en passform som fungerer med stolen og klærne du vanligvis bruker ute.", "Les om ventilasjon og materialer på hver produktside. Funksjonene er forskjellige fra modell til modell."],
    source: { kind: "selection", handles: ["utekos-svale", "utekos-techdown", "utekos-dun", "comfyrobe"] },
  },
  glamping: {
    label: "Glamping",
    title: "Varmeplagg til glamping",
    description: "Planlegg klær til rolige stunder på glampingturen. Se et utvalg Utekos-varmeplagg og sammenlign modellene før du velger.",
    intro: "Planlegger du glamping, kan du velge klær til tiden utenfor teltet eller overnattingsstedet. Dette er vårt redaksjonelle utvalg til rolige stunder ute; se hver produktside for modellens materialer og funksjoner.",
    guidanceTitle: "Planlegg klær til oppholdet",
    guidance: ["Undersøk forholdene på stedet og hva overnattingsstedet stiller med, før du lager pakkelisten.", "Vurder et eget plagg til tiden ute morgen og kveld, i tillegg til klærne du bruker på aktiviteter.", "Sammenlign størrelse, materialer og oppbevaring. Utvalget her er klær, ikke telt eller annet overnattingsutstyr."],
    source: { kind: "selection", handles: ["utekos-svale", "utekos-techdown", "utekos-dun"] },
  },
} as const;

export type CategorySlug = keyof typeof categories;
export type ListingKey = CategorySlug | "all";
export const categorySlugs = Object.keys(categories) as CategorySlug[];

export const catalogIndex = {
  label: "Produkter",
  title: "Produkter fra Utekos",
  description: "Utforsk varmeplagg og tilbehør fra Utekos. Finn produkter etter type eller se våre utvalg til camping, bobil, hytte, terrasse og glamping.",
  intro: "Velg mellom varmeplagg og tilbehør, eller se et utvalg til stedet du vil bruke produktene. Her finner du også hele det tilgjengelige sortimentet samlet.",
};

export function listingPath(key: ListingKey, page = 1): string {
  const path = key === "all" ? "/produkter" : `/produkter/${key}`;
  return page === 1 ? path : `${path}?page=${page}`;
}

export function isCategorySlug(handle: string): handle is CategorySlug {
  return Object.hasOwn(categories, handle);
}

export function assertProductHandles(handles: readonly string[]): void {
  const collision = handles.find(isCategorySlug);
  if (collision) throw new Error(`Shopify handle conflicts with a category URL: ${collision}`);
}

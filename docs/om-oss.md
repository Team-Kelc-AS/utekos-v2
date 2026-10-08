# Om oss: seksjoner og bilder rettet 7. oktober 2026

Implementert lokalt på `main`, ikke publisert. Brukerens tre skjermbilder og
dagens lokale `utekos-headless`-komponenter er referansen for denne rettingen.

Etterfølgende ikonretting: alle ikoner som ble lagt til i disse seksjonene
kommer fra `src/assets/components/utekos-icons`. Prinsippene bruker
`HeartOutlineIcon`, `SealOutlineIcon`, `LeafIcon` og `GroupOutlineIcon`.
Møteplasser og veibeskrivelse bruker `LocationIcon`; karusellen bruker
`CaretLeftIcon` og `CaretRightIcon`. Karusellknappene kan nå ta et eget ikon
som `children`, slik at denne sidens ikonvalg er eksplisitt.

- «Kjernen i alt vi gjør»: pillen «Vårt DNA» og fire eksisterende shadcn
  `Card` med `CardHeader`, `CardTitle` og `CardContent`. Ikoner, mørke kort,
  avstander og to kolonner på større skjermer følger referansen.
- «Et glimt av opplevelsen»: pillen «Livet med Utekos», samme overskrift og
  lead-tekst. `glimt-1.webp` til `glimt-6.webp` brukes i nummerrekkefølge i
  eksisterende shadcn-karusell, med ett/to/fire synlige bilder på
  mobil/nettbrett/desktop, som i headless.
- «Der du har møtt oss»: pillen «Møteplasser», introduksjon og arrangementer
  med stedsikoner til venstre, `messe-1.webp` til `messe-4.webp` i et 2 × 2-rutenett
  til høyre. På mindre skjermer kommer bildene under teksten.
- Intersport: logo til venstre og pill, original tekst og kartlenke til høyre
  i en samlet ramme. `public/Intersport_logo.svg` er kopiert uendret fra headless.

Alle ti fotografier er åpnet og kontrollert. Alt-tekstene beskriver de faktiske
motivene. Ingen produktvariantnavn er utledet fra gamle galleri-alt-tekster.
Bildenes opprinnelige sideforhold beholdes med eksplisitt bredde/høyde og
`height: auto`. Messefilene er 1080 × 1080, så disse vises kvadratisk selv om
referanseskjermbildet har liggende utsnitt. Ingen bilder er beskåret eller endret.

Google Sans Flex-oppsettet er bevart; nettleseren viser `opsz` 120,
overskriftsvekt 800 og brødtekstvekt 500. Kortikonene bruker samme sekundærfarge
som headless og vedlegget. Shadcn sine badge-klasser gjenbrukes på statiske
`span`-elementer, slik at pillene ikke trenger en klientkomponent.
`AboutGallery.tsx` er en serverkomponent som komponerer den eksisterende
klientkarusellen. Ingen nye avhengigheter eller endringer i sporingen.

Verifisert etter rettingen:

- Avgrenset ESLint uten advarsler, TypeScript og `pnpm run build` bestått.
- HTTP 200, fire shadcn-kort, seks glimt- og fire messebilder i riktig rekkefølge.
- Bilder og Intersport-logo lastet uten feil; ingen Next.js-runtimefeil.
- Visuell kontroll av alle fire seksjoner på desktop og mobil.
- Ingen horisontal overflyt ved 320, 390, 768, 1024 eller 1440 px.
- Karusellknapper, piltaster og looping fungerer; kartlenken har synlig
  tastaturfokus. Ingen observerte konsollfeil eller lokale HTTP-feil.

Dokumentasjon: Next.js sin native MCP bekreftet installert 16.3.8, og den
medfølgende bilde-/serverkomponentdokumentasjonen er lest. Utekos Docs sin
`nextjs/get-started/12-images` er kontrollert gjennom MCP. Shadcn CLI 4.21.1,
prosjektets `base-nova`-komponenter, Context7 og offisiell dokumentasjon for
[Card](https://ui.shadcn.com/docs/components/base/card),
[Badge](https://ui.shadcn.com/docs/components/base/badge) og
[Carousel](https://ui.shadcn.com/docs/components/base/carousel) er kontrollert.
Utgivelsene [Next.js 16.3.8](https://github.com/vercel/next.js/releases/tag/v16.3.8)
og [shadcn 4.21.1](https://github.com/shadcn-ui/ui/releases/tag/shadcn@4.21.1)
krever ingen ny pakkeoppgradering for denne rettingen.

Markedsføringsteksten og forhandleromtalen er gjenbrukt fra brukerens eksisterende
innhold, ikke uavhengig verifisert på nytt. Heroens tomme bildefelt ligger utenfor
denne bestillingen. Ingen commit, push eller deploy er utført.

## Historikk: korrigert innholdsmigrering 5. oktober 2026

Oppdatert 5. oktober 2026. Lokal endring, ikke publisert.

Etter brukerens korrigering følger tekstinnhold og seksjonsrekkefølge nå den
aktive `/om-oss`-siden i `../utekos-headless/src/app/(store)/om-oss/page.mdx`
og komponentene i `components/mdx/`:

- Hero: opprinnelig ingress og «Skreddersy varmen».
- `AboutFounder`: fullt sitat og alle tre historieavsnitt, ordrett.
- `AboutPrinciples`: alle fire prinsipper med original tekst.
- `AboutPromise`: begge løftene med original tekst.
- `AboutGallery`: overskrift og ingress; v2s eksisterende tomme bildefelt beholdes.
- `AboutEvents`: innledning og alle tre historiske arrangementer med sted/dato.
- `AboutRetailer`: Intersport-tekst og samme kartlenke som kilden.
- `AboutCta`: overskrift, ingress, produktlenke og trygghetstekst.

Nye generiske avsnitt, selskapsseksjon og FAQ fra den første migreringen er
fjernet for å samsvare med originalsidens innhold. Datoenes tegnsetting er
normalisert, og fraktteksten er «Gratis frakt fra 999 kr» i tråd med v2s
inklusive terskel. Tittel og metabeskrivelse følger originalsidens frontmatter.

Eksisterende CSS, palett, typografi og komponentramme er uendret.
`UtekosGrunder.webp` beholdes i originalt 4:5-format. Det er ikke migrert
nye galleribilder, messbilder eller klientkomponenter. Ingen schema eller
sporingslogikk er lagt til.

Dette er en gjenoppretting av brukerens eksisterende tekst, ikke en ny,
uavhengig verifisering av markedsføringsløfter, forhandlerstatus eller betaling.
Kildekontroll er gjort mot den aktuelle lokale headless-koden.

Verifisert ved denne korrigeringen:

- MDX-kompilering og avgrenset ESLint bestått.
- Lokal `/om-oss` returnerte HTTP 200.
- Alle tre historieavsnitt og alle titler/tekster for prinsipper og løfter
  er sammenlignet ordrett mot den renderte HTML-en.
- Møteplasser, forhandler og avsluttende CTA finnes i HTML-en.
- Ingen dupliserte ID-er eller interne ankerlenker uten mål.
- Ny visuell nettleserkontroll blokkert: Playwright-profilen var opptatt,
  og CUA kunne ikke laste browser request-header policy.

## Historikk: første migrering, før innholdskorrigeringen

Opplysningene nedenfor beskriver den tidligere versjonen og dens daværende
kontroller. De er ikke verifikasjon av den korrigerte versjonen ovenfor.

# Om oss: innhold og migrering

Gjennomgått 5. oktober 2026. Implementert lokalt i v2, ikke publisert.

## URL og søkeintensjon

Behold `/om-oss`. Både den eksisterende MDX-siden i `utekos-headless` og
den offentlige siden bruker denne adressen. Den er kort, norsk, beskrivende
og passer søkeintensjonen: hvem Utekos er, historien og hvem kunden handler med.
En lengre søkeord-URL gir ingen dokumentert gevinst i det tilgjengelige grunnlaget.
Produktkategoriene beholder jobben med generiske produktsøk.

Dette er en kvalitativ vurdering. Search Console, Bing Webmaster Tools,
søkevolum, eksisterende rangeringer og eksterne lenker er ikke målt her.
Det er derfor ikke mulig å tallfeste et mulig trafikktap eller en gevinst.
Google beskriver midlertidige rangeringssvingninger ved URL-migrering.
Ved å beholde adressen unngår vi selve URL-flyttingen; innholdsendringer kan
likevel påvirke rangeringer. Ingen nye omdirigeringer er nødvendig for denne siden.

Implementert: unik tittel og beskrivelse, selvrefererende canonical,
Open Graph-tekst, brødsmuler, footerlenke, oppføring i sitemap og relevante
lenker til produkter, Uteguiden, kundeservice og frakt/retur.

Kilder:

- [Google: URL-struktur](https://developers.google.com/search/docs/crawling-indexing/url-structure).
- [Google: flytting av URL-er](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).
- [Google: nyttig, pålitelig innhold og E-E-A-T](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
- [Bing: webmaster guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a), særlig tydelige entiteter, crawlbare lenker, canonical og stabile URL-er.

FAQ bruker felles shadcn Accordion (Base UI), med ett åpent felt per gruppe. Spørsmål og svar rendres på serveren, og `hiddenUntilFound` beholder lukkede svar i HTML-en. Åpne/lukke-interaksjonen krever JavaScript. JSON-LD, FAQPage og annen
schema er utsatt etter bestillingen. Google avviklet FAQ-rich-results fra
7. mai 2026 og fjernet dokumentasjonen i juni. En senere schema-implementasjon
skal derfor ikke begrunnes med forventet FAQ-utvidelse hos Google.
[Kilde: Googles endringslogg](https://developers.google.com/search/updates).

## Faktagrunnlag og redaksjonelle valg

- Grunnlegger, opprinnelig motivasjon og sitatutdrag: eksisterende
  `../utekos-headless/src/app/(store)/om-oss/page.mdx` og
  `components/mdx/AboutFounder.tsx`, sammenholdt med
  [den offentlige om oss-siden](https://utekos.no/om-oss).
  Fortellingen er kortet ned. Ingen nye biografiske opplysninger, datoer,
  kundeantall, tester eller sertifiseringer er lagt til.
- Selskap, organisasjonsnummer og forretningsadresse er kontrollert i
  [Enhetsregisterets offentlige data for KELC AS](https://data.brreg.no/enhetsregisteret/api/enheter/925820393).
  Norsk selskap betyr ikke at produktene er produsert i Norge.
- Kontaktkanalene følger eksisterende kontakt- og retursider i prosjektet.
  Kjøpsvilkår lenkes til, slik at om oss-siden ikke oppretter en parallell policy.
- Den gamle sidens absolutte varmegaranti, generelle miljøoverlegenhet og
  påstand om eneste fysiske forhandler er ikke videreført. Det ble ikke funnet
  tilstrekkelig aktuelt grunnlag for slike løfter i denne oppgaven.
- Terrasse og camping er brukssituasjoner fra eksisterende innhold og
  kategoristruktur. De er ikke dokumenterte, prioriterte category entry points
  for hele det norske markedet. Kortere vei til produktvalg og kundehjelp er
  en UX/CRO-hypotese, ikke et målt konverteringsløft.

Evidence-Based Marketing ble konsultert om konsekvent merkevarebruk og
skillet mellom merkevarekjennetegn og kjøpssituasjoner. Relevante oppslag:
`ref/core-evidence/4-distinctive-assets-help-exposures-become-brand-memories`
og `ref/core-evidence/3-category-entry-points-are-retrieval-cues`.
Oppslagene bygger blant annet på Romaniuks *Building Distinctive Brand Assets*
og *Category Entry Points in a B2B World*. Generelle prinsipper brukes som
bakgrunn; B2B- og OOH-funn overføres ikke til påstander om effekt for denne siden.
Ingen medie-, budsjett- eller markedsstrategi er endret.

## Arkitektur og visuell ramme

`page.mdx` eier alt innhold. `layout.tsx` eier metadata og serverrendret ramme.
Eksisterende MDX-komponenter, brødsmuler og fontoppsett gjenbrukes. Ingen nye
klientkomponenter, hooks, runtime-datahenting eller avhengigheter er lagt til.
Eksisterende CTA-markør `AboutUsShopAllProductsClick` er bevart; ingen
sporingslogikk er endret.

Next.js og `@next/mdx` er begge 16.3.8 i pakkefil og låsefil. Utekos Docs sin
MDX-guide og de installerte guidene for MDX, Server Components, metadata og
fonter er lest. [Utgivelsen 16.3.8](https://github.com/vercel/next.js/releases/tag/v16.3.8)
er kontrollert. Eksisterende MDX-pipeline støtter siden; eksperimentell Rust-MDX
er ikke anbefalt for produksjon i den installerte guiden og er ikke innført.

Design: videreføring av Utekos-identiteten, DESIGN_VARIANCE 5,
MOTION_INTENSITY 2, VISUAL_DENSITY 4. Samme mørke merkevareflate gjennom hele
siden, også når operativsystemet foretrekker lyst tema. Dette følger den
etablerte merkevaren og unngår en separat temamekanisme på én informasjonsside.
Brukerens bestilling om tomme bildefelt overstyrer design-skillens standard
om faktiske bilder. De fire tomme feltene er dekorative og skjult for
skjermlesere, uten falsk lastestatus. Ingen bilder eller OG-bilder er lagt til.

Google Sans Flex er kontrollert i den faktisk leverte WOFF2-filen:
versjon 4.005, `opsz` 6-144, `wght` 1-1000. Fontens STAT-tabell navngir
verdien `opsz=120` som `120pt`. Dette er en fontvariant, ikke tekststørrelse.
Nettleseren viser overskriftsvekt 800 og brødtekstvekt 500.

## Verifikasjon

- Avgrenset ESLint, TypeScript og produksjonsbygg er bestått.
  `/om-oss` er prerenderet som statisk innhold. Første TypeScript-kjøring
  møtte usynkroniserte genererte route-typer; produksjonsbygget regenererte
  dem, og påfølgende TypeScript-kjøring var grønn.
- Lokal HTTP 200, korrekt canonical/tittel/beskrivelse, én H1, fire FAQ-er,
  fire tomme bildefelt, ingen bilder i hovedinnholdet og ingen JSON-LD.
- Alle interne lenkemål kontrollert med HTTP 200. Footerlenke og sitemap
  observert. Ingen dupliserte ID-er eller ankere uten mål.
- Desktop og mobil er visuelt kontrollert. Ingen horisontal overflyt ved
  320, 390, 768, 1024 eller 1440 px. Begge systemtemapreferanser er kontrollert.
  FAQ kan åpnes med tastatur, med synlig fokus. Nettleser- og Next-feilrapporten
  var tom.
- Ny sidelasting med JavaScript deaktivert viste innhold og alle fire FAQ-er.
  Native FAQ åpnet med Enter mens Next-klientkode ikke hadde kjørt.
- Lighthouse mot utviklingsserveren: tilgjengelighet 100, beste praksis 100,
  SEO 100, ytelse 64, LCP 8,3 s, TBT 300 ms, CLS 0. Dette er en dev-måling
  med Next-utviklingskode, ikke en produksjonsmåling eller dokumentasjon på
  beståtte Core Web Vitals. Produksjonsytelse og faktisk INP er ikke målt.

Ingen commit, push, deploy, publisering, søkemotorinnsending eller ny
bakgrunnsjobb er utført. Endringen er lokal.

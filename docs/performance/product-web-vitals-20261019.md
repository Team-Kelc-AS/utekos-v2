# Produktsider: stabil layout og utsatt karusell

Lokale endringer 19. oktober 2026. Ikke deployet.

## Endringer

- Variantstatus beholder samme høyde med og uten tekst. Ugyldig margin-deklarasjon
  er rettet, og eksplisitt linjehøyde hindrer et mindre restskift.
- Anmeldelsesområdet reserverer 7rem, eller 10rem under 375px der innholdet kan
  brytes over flere linjer. Reservasjonen beholdes også uten anmeldelser, slik
  at en tom respons ikke flytter resten av siden.
- Route-loading og innholdets Suspense-fallback bruker samme ProductSkeleton.
- StockedProducts beholder kortene i server-HTML. Embla lastes først innenfor
  400px fra viewport. En native, horisontalt scrollbar karusell med piler og
  tastaturkontroll fungerer før innlasting og ved chunk-feil. Oppgradering
  avventer fokus og unngås etter interaksjon med fallbacken, for å bevare
  brukerens kortposisjon og tilstand.
- Web Vitals sender maksimalt ti sammendrag med fem kilder hver: elementtype,
  faste områdenavn og rektangler. DOM-tekst, inputverdier, vilkårlige attributter
  og URL-er fra PerformanceEntry serialiseres ikke. Dokumentets opprinnelige
  pathname skilles fra pathname ved rapportering. Canonical event-ID,
  transport, samtykkegater og gjeldende rapporteringskontekst beholdes.
- Tracking-browser-testens in-memory esbuild fikk outfile, slik at eksisterende
  CSS Modules i Accordion kan kompileres. Ingen harness-fil skrives til disk.

## Verifikasjon

Produksjonsbuild, TypeScript og rutekontroll passerer i en isolert kopi av
HEAD 6cda0d29e7f67d1d1ec9d205336e160e2282968d med disse endringene.
Den vanlige arbeidskopien inneholder uferdige kampanje- og Klarna-ruter med
manglende importer. De er ikke endret som del av denne oppgaven.

- 43 målrettede tester for diagnostikk, produkter, galleri og handel passerer.
- 66 tracking-nettlesertester passerer etter retting av harnessen.
- 15 tracking-gatewaytester passerer.
- Fokusert ESLint og git diff --check passerer.
- Chromium mot lokal produksjonsbuild: 320, 390, 768 og 1440px.
  Forsinket XL -> XS-navigasjon viste pending-status og 0px vertikal flytting
  av lager-/kjøpsområdet ved alle bredder.
- Fire relaterte produktkort beholdt samme karusellhøyde før/etter oppgradering.
  Pilnavigasjon og fokus er kontrollert. Blokkerte chunks beholdt native
  karusell, alle fire kort og fungerende piler.
- Korte lokale innlastinger av Comfyrobe, TechDown og Mikrofiber ved 390px
  registrerte ingen layoutskift. Dette er ikke feltdata eller bevis på at
  den opprinnelige CLS-hendelsen på 0,5697 er løst.
- Mobil- og desktop-skjermbilder er kontrollert.

Den brede testsuiten hadde også en separat support-seo-test som forventer
1200px bildebredde, mens den eksisterende filen er 1920px. Denne filen/testen
er ikke endret. Hele testsuiten er derfor ikke rapportert som grønn.

## Bundle

Next 16.4 experimental-analyze, /produkter/[handle], union av klientgruppene
bootstrap og render_dependent, kun JS:

| Måling | Før | Etter |
|---|---:|---:|
| Summerte moduldeler | 745122 bytes | 722984 bytes |
| Embla i disse gruppene | 17749 bytes | 0 bytes |
| Outputs i unionen | 15 | 14 |

Reduksjon: 22138 bytes (2,97%). Dette er analyzer-estimater, ikke målt
HTTP-overføring, CPU-besparelse eller forbedring i CrUX. Utsatt kode er fortsatt
tilgjengelig og lastes når karusellen nærmer seg viewport.

## Sporing

Publisert web-GTM 175, GTM-5TWMJQFP, ble lest gjennom Stape GTM MCP i denne
oppgaven. Fem aktive tagger: Google base 109, UET base 130, UET business events
131, UET ID Sync 160 og Data Tag 182. De gamle GA4- og Meta-adapterne er
pauset. Google base har send_page_view=false; UET base deaktiverer automatiske
pageviews. Ingen dobbel aktiv Google-/Meta-basistagg er dokumentert i denne
containeren. Meta-runtime eies også av appen og kan ikke vurderes ved å telle
GTM-tagger alene.

Google-identitet, Data Tag og Meta-transport har eksisterende kontrakter for
tidlige hendelser og checkout. Ingen leverandørtagger er slettet, utsatt eller
publisert som en spekulativ ytelsesretting. De store sporingsskriptene fra
auditen er fortsatt en ytelseskostnad; denne endringen dokumenterer ikke en
reduksjon i den kostnaden.

Rå lokalmålinger og logger: /tmp/utekos-perf-20261019/.

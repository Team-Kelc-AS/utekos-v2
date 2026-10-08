# Footer: struktur og servergrense

Oppdatert lokalt 5. oktober 2026. Kilder er `footer.config.ts`,
`FooterNavigation.tsx` og `CopyrightNotice.tsx` i `../utekos-headless`.

## Innhold og layout

De fire gruppene følger gammel rekkefølge: Handlehjelp, Kundeservice,
Informasjon og Bedriftsinformasjon. CSS viser én kolonne under 768 px og
fire kolonner fra 768 px, tilsvarende headless. Eksisterende v2-produktlenker
er bevart i en separat rad under gruppene.

KELC AS, Lille Damsgårdsveien 25, 5162 Laksevåg, org.nr. 925 820 393,
telefon og e-post er hentet fra kildekonfigurasjonen og samsvarer med
v2s kontakt-/personverninnhold. Adressen er vanlig tekst i `address`,
uten de gamle plattformavhengige `map:`-lenkene.

De gamle `/handlehjelp/teknologi-materialer`, `/handlehjelp/vask-og-vedlikehold`
og `/handlehjelp/storrelsesguide` finnes ikke i v2. De er utelatt inntil sidene
er migrert; Handlehjelp lenker foreløpig til Kontakt oss og Uteguiden.

## Klientkostnad

`Footer.tsx` har `import "server-only"`. Data, grupper, bedriftsinformasjon
og responsive regler rendres på serveren. En ubrukt `links`-prop fra den
gamle, flate v2-footeren er fjernet; root-layouten bruker fortsatt `<Footer />`.

Den eneste klientgrensen i footerens importtre er `next/link` på de interne
lenkene. `prefetch={false}` hindrer forhåndslasting både i viewport og ved
hover. Telefon og e-post er vanlige ankere. Ingen hooks, viewport-JavaScript,
providers, Zod, skjema-/nyhetsbrevavhengigheter eller egne klientøyer er lagt til.
Ingen sporingsendringer, nye bilder eller betalings-/registreringspåstander.

Valgene er kontrollert mot Next.js 16.3.8s medfølgende dokumentasjon for
[server-/klientkomponenter](https://nextjs.org/docs/app/getting-started/server-and-client-components)
og [Link](https://nextjs.org/docs/app/api-reference/components/link).
Utekos Docs og Context7 bekrefter prinsippet om små klientgrenser; Context7
hadde ikke 16.3.8 som versjonsspesifikk kilde, så installert dokumentasjon
har forrang. Vercels dokumentasjonssøk ga ingen mer presis veiledning.
[Utgivelsen 16.3.8](https://github.com/vercel/next.js/releases/tag/v16.3.8)
ble kontrollert via Exa; denne oppgaven krever ingen avhengighetsoppgradering.

## Verifisering

- ESLint og produksjonsbygg med TypeScript bestått.
- Footer og alle bedriftsopplysninger er til stede i serverens HTML.
- Alle 11 unike interne footerlenker gir lokal HTTP 200.
- Klientmanifestene for `/`, `/personvern` og `/produkter/[handle]`
  inneholder ingen Footer-modul. De har den forventede Next Link-grensen.
  Dette er import-/byggebevis, ikke en måling av overførte JavaScript-byte.
- Nettleserkontroll ved 320, 390, 767, 768, 1024 og 1440 px: ingen horisontal
  sideoverflyt, korrekt grupperekkefølge og alle lenkemål minst 44 px høye.
  Tastaturfokus er synlig, og Enter navigerer til Frakt og retur.
- Desktop, nettbrett og mobil er visuelt kontrollert. Ingen nettleserfeil observert.

Ingen commit, push eller deploy.

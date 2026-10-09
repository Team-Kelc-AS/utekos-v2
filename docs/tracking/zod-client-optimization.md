# Zod-klientoptimalisering – 8. oktober 2026

Implementert og verifisert lokalt på main. Ikke publisert. Eksisterende, uvedkommende arbeidsendringer er beholdt. Ingen pakkeoppgradering eller endring i trackingaktivering.

## Endring og kontrakt

- `browser-schema.ts`, de sju classic-baserte browserhendelsene (wishlist, hero, accordion, size guide, form start/error og video) og `metaParameterBuilderUserData.ts` bruker den eksisterende `zodMini`-adapteren.
- `generateLeadDataLayerEvent.ts` inneholder den rene lead-builderen. Klientens `data-layer.ts` importerer denne direkte. Den gamle modulen re-eksporterer funksjonen for eksisterende serverkonsumenter. Lead-skjemaet og servervalideringen er beholdt.
- Strenge objekter, regexer, kontrollrekkefølge, valgfrie felt, parsed output og fullstendige issue-objekter er sammenlignet mot classic-definisjonene. Engelsk feillocale er beholdt.
- Zod 4.6.5 sin classic `.finite()` returnerer samme skjema; Mini `number()` avviser fortsatt NaN og uendelige tall. Dette er testet.
- Opprinnelige kontrakthasher er beholdt. Begrunnede lokale avvik og nye hasher står i `contract-overrides.json`; gateway-manifestet markerer den delte Meta-modulen som tilpasset.

## Importgrenser

`layout → Tracking → dynamic(TrackingRuntime) → runtime → browser-schema → Mini`.

`browser-schema → hendelsesskjema → canonicalEventEnvelope → metaParameterBuilderUserData → Mini`.

`runtime → data-layer → generateLeadDataLayerEvent` har bare typeimport fra lead-skjemaet. Checkout har også en dynamisk import av runtime ved behov. PageView, checkout-forberedelse, consent, identiteter og transport er ikke utsatt ytterligere eller fjernet.

Classic beholdes i serverkonsumentene, blant annet API-ruter, serverhandlinger, produkt-/søkevalidering, Klarna og den komplette kanoniske hendelsesunionen. Det er ingen målt klientgevinst ved å migrere disse. Typeimporter beholdes. Transitive Zod 3.25.76/4.1.11 fra verktøy/Vercel er ikke endret.

## Målemetode og resultater

Installert Zod 4.6.5, Next.js 16.3.8/Turbopack, TypeScript 5.9.3, Node 24.17.0 og esbuild 0.27.7. Samme lokale `.env.local`, Next-konfigurasjon og uvedkommende arbeidsendringer ble brukt før/etter. Ingen miljøverdier er kopiert til rapporten.

Tre kjøringer av `pnpm exec next experimental-analyze --output`:

| Forsidens klientgraf | Opprinnelig | Namespace-import | Endelig Mini |
| --- | ---: | ---: | ---: |
| Zod-moduldeler, byte | 513 909 | 224 154 | 155 434 |
| Classic-moduldeler, byte | 52 134 | 15 909 | 0 |
| Locale-filer | 63 | 1 | 1 |

Namespace var et måletrinn; den endelige klientkoden bruker Mini. Tallene over er summer av analysert modulkode og kan inneholde samme kilde i flere chunks. De er ikke initial nedlasting eller komprimert nettverksoverføring. Alle 56 genererte ruteanalyser ble kontrollert: ingen classic Zod i klientoutput, bare `en.js` som locale.

To vellykkede `pnpm build`-kjøringer produserte følgende faktiske JS-filer. Filnavn er deduplisert innen hver rad. Gzip bruker Node `gzipSync` med standardinnstillinger per fil; ingen summering av modulkomprimering.

| Produksjonsoutput | Før, rå byte | Etter, rå byte | Før, gzip-byte | Etter, gzip-byte |
| --- | ---: | ---: | ---: | ---: |
| Forsidens 16 scriptfiler i prerender-HTML | 895 166 | 895 166 | 292 407 | 292 408 |
| Resterende 36 JS-chunks, alle ruter | 1 457 746 | 1 120 326 | 434 968 | 361 324 |
| Samtlige 52 JS-chunks, alle ruter | 2 352 912 | 2 015 492 | 727 375 | 653 732 |
| Chunk med tracking-runtime, delmengde av raden over | 371 459 | 57 433 | 83 649 | 14 981 |

Initial-scriptsettet er bestemt fra `<script src>` i `.next/server/app/index.html`; det omfatter også noModule-scriptet. Det er ingen påvist initial JS-besparelse. Restsettet er alle andre emitterte chunks, ikke en påstand om at én bruker laster alle disse. Den store gevinsten gjelder senere lastet trackingkode. En byte forskjell i initial gzip er komprimeringsvariasjon ved endrede referanser.

Før-build: `4t3FY9PxYN2ZB36CryJd2`, trackingchunk `3h6_9j9kbf0nr.js`.
Etter-build: `mOGWQbKBizoDQORD_lqLk`, trackingchunk `1izr8r-0j455c.js`.

Dette er lokale fil- og analyseobservasjoner. Faktisk CDN-overføring, lastetid og CPU-gevinst er ikke målt. Det krever separat runtime/nettverksmåling; syntetisk gzip er ikke en providerkvittering eller et produksjonsresultat.

## Verifikasjon

- Produksjonsbygg før/etter, inkludert Next TypeScript-kontroll: bestått.
- Separat `tsc --noEmit`: bestått.
- 213 tester i `tests/*.test.cjs`: bestått, inkludert 10 nye Zod-tester og eksisterende offline Chromium-integrasjon for tracking, consent, identiteter, duplikater og checkout.
- 11 gateway-tester: bestått etter manifestoppdateringen. Før oppdateringen fanget kontrollen korrekt opp endret Meta-skjema.
- `pnpm tracking:contracts`: 117 opprinnelige kontrakter verifisert med registrerte avvik.
- Fokusert ESLint og `git diff --check`: bestått.
- Skillens 36 eksempelsammenligninger og to isolerte locale-kontroller: bestått. Disse er tillegg til applikasjonstestene.
- Ny bundle-regresjonstest sikrer at runtime ikke emitterer classic Zod, serverens lead-skjema eller andre språkfiler. En tom locale-indeks tillates; språkfilene kontrolleres eksplisitt.

## Dokumentasjon

Hentet 8. oktober 2026 gjennom InKeep Zod MCP: [Mini](https://zod.dev/packages/mini), [skjema-API](https://zod.dev/api). Mini-APIene ble også kontrollert mot installert pakke og eksekverbare tester. [Next.js bundleanalyse](https://nextjs.org/docs/app/guides/package-bundling) ble kontrollert mot dokumentasjonen i installert Next 16.3.8. Utekos Docs sin veiledning om klient-/servergrenser ble konsultert i gjennomgangen.

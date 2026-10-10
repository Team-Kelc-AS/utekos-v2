# Camping og bobil: lokal UI-leveranse

Verifisert 10. oktober 2026 på `main`, Next.js 16.3.8 / React 19.2.8. Implementeringen er lokal. Ingen commit, push eller publisering er utført av denne oppgaven. Parallelle endringer i hyttesiden er bevart.

## Implementert

- Ett modellkort per produkt i rekkefølgen Svale, TechDown™, Mikrofiber™, Dun™. To kolonner på desktop, én på mobil.
- Størrelse og eventuell farge velges **direkte i kortet**, i tråd med siste avklaring. Handlekurv og Klarna vises også i kortet. Ingen kjøpsmodal.
- Eksplisitt størrelsesvalg kreves. Komplett, entydig alternativvalg gir eksakt Shopify-variant, pris, variantbilde og lagerstatus. Utsolgt, restordre og ukjent lagerstatus blokkerer vanlig kjøp. Varierende variantpriser vises som intervall før valg.
- Dun har «Påmeldingsliste» og gjenbruker eksisterende reservasjonsdialog. Samtykke og informasjon om senere betalingslenke er uendret.
- Én H1, venstrestilt introduksjon og eksisterende campingbilde. Produktene står før den opprinnelige lange forklaringen, NBCC-medlemsfordelen, guider og kategorilenker. URL-, metadata- og pagineringsfunksjonene er gjenbrukt.
- Størrelsesguiden er en utvidbar serverrendret del av kortet. Den bruker eksisterende modellmål; det er ikke konstruert nye Small-mål for Dun/Mikrofiber.
- «Frakt og retur» åpner en liten dialog med ordrette utdrag fra gjeldende side og lenke til fullstendige vilkår. Utdraget deles nå med selve vilkårssiden.
- Judge.me-forhåndsvisningen hentes på serveren med én begrenset offentlig widgetforespørsel per modell, faktisk sammendrag og maksimalt tre unike publiserte omtaler. Feil og null omtaler skilles. Ingen historiske tall brukes som reserve.
- Den delte native dialogen har fått eksplisitt Tab-/Shift+Tab-løkke etter at en nettleserkontroll avdekket fokusflukt. Escape, fokusretur og bakgrunnslåsing er bevart.

## Designgrunnlag

Utekos-paletten, eksisterende Google Sans Flex med verifisert 120pt-variantmapping, ExtraBold/Medium, setningskasus og originale merkeelementer er brukt. Designinnstillinger: variasjon 5, bevegelse 2, tetthet 4. Respons på hover, fokus og trykk er CSS-basert. Produkt- og campingbilder beholder faktiske sideforhold med eksplisitte dimensjoner og automatisk høyde.

Et separat Stitch-prosjekt ble opprettet: `8396770450193629573`. Desktopforslag `6f7d21727fbd474e83baae03ff26a8cd` og mobilforslag `70a41a811e2142078d28f97bdde1e97b` ble åpnet og visuelt vurdert. Venstrestilt introduksjon, produktplassering og to-/énkolonneoppsett ble brukt som layoutinspirasjon. Genererte produktbilder/logo, avvikende typografi og udokumenterte produktpåstander ble forkastet. Forslagene er ikke dokumentasjon på konverteringseffekt.

## Server- og klientgrenser

`CampingPage`, modellkort, omtaler, størrelsesmål og vilkår rendres på serveren. `ModelPurchaseControls` håndterer kun valg og eksisterende kjøpsknapper. Variantdata til klienten begrenses til ID, alternativer, pris, tilgjengelighet og bilde, sammen med modellens offentlige handle/navn. Lagerantall, SKU og backenddata sendes ikke i denne DTO-en.

- `DeferredModelKlarna` importerer eksisterende Klarna-komponent når kjøpskontrollene nærmer seg viewporten (160 px margin). SDK-en initialiseres gjennom den eksisterende komponenten. Knappen er synlig i kortet; en deaktivert plassholder reserverer høyden før lasting.
- Dun-dialogen og dens eksisterende questionnaire-/Base UI-/`cn`-avhengigheter lastes først når påmeldingsflyten åpnes.
- Vilkårsdialogen lastes når «Frakt og retur» åpnes.
- Judge.me-parseren, Cheerio og valideringen forblir på serveren.
- Ingen ny UI-/animasjonsavhengighet er lagt til. Handlekurvlås, feilbehandling og eksisterende Klarna-/sporingskontrakter gjenbrukes.

## Før-/etteranalyse

Begge analyser bruker campingruten, klientmiljø og JavaScript. Kommando: `pnpm exec next experimental-analyze --output`. I rutens `analyze.data` summeres `chunk_parts` med outputfil som inneholder `/static/` og slutter med `.js`. Komprimerte tall er summen av modulenes `compressed_size`, ikke faktisk HTTP-overføring. Utsatte moduler, delte moduler og polyfills er inkludert.

| Måling | Før | Etter | Differanse |
| --- | ---: | ---: | ---: |
| Summerte modulbyte | 1 311 914 | 1 423 420 | +111 506 (+8,50 %) |
| Summerte komprimeringsestimater | 522 205 | 569 035 | +46 830 (+8,97 %) |
| Modulpartier | 706 | 771 | +65 |
| JS-filer | 28 | 32 | +4 |

Funksjonsutvidelsen gir altså økt total modulstørrelse. Store nye bidrag er den utsatte reservasjonsflyten: shadcn questionnaire (17 267 byte), `cn` engine/tables (25 527 byte), questionnaire-wrapper (8 489 byte), reservasjonsdialog (7 266 byte), samt delt CloseIcon (10 250 byte). Inlinevalgkomponenten er 3 602 byte, Klarna-komponenten 2 759 byte. Dette er modulbidrag i analysen, ikke separate nettverkskostnader eller en påstand om redusert førstegangslasting.

- [Føranalyse](/var/folders/h1/mmr263ts7lg7l0vnyl9m97z00000gn/T/utekos-camping-before-0b9a_jsq/analyze/index.html)
- [Etteranalyse](/var/folders/h1/mmr263ts7lg7l0vnyl9m97z00000gn/T/utekos-camping-after-66266i12/analyze/index.html)
- Maskinlesbare summer: [camping-og-bobil-ui-metrics.json](./camping-og-bobil-ui-metrics.json).

## Verifikasjon

TypeScript (`pnpm exec tsc --noEmit`), ESLint for berørte TS/TSX/testfiler, `pnpm run build` (inkludert prosjektets motion-budget-kontroll) og `git diff --check` bestod på sluttkoden.

106 tester bestod, uten feil eller hoppede tester:

```sh
node --test tests/model-purchase.test.cjs tests/model-klarna-controls.test.cjs \
  tests/judgeme.test.cjs tests/catalog-urls.test.cjs tests/product-cards.test.cjs \
  tests/product-commerce.test.cjs tests/product-seo-metadata.test.cjs \
  tests/cart-tracking.test.cjs tests/klarna-client.test.cjs \
  tests/klarna-bridge.test.cjs tests/klarna-authenticated-bridge.test.cjs \
  tests/dun-reservation.test.cjs
```

De nye testene dekker eksakt størrelse/farge/ID/pris/bilde, ufullstendige og tvetydige valg, utsolgt/restordre/ukjent lager, begrenset DTO, prisintervall og modellrekkefølge. Judge.me-testene dekker begrenset forespørsel, deduplisering, reelt totalantall og API-/konfigurasjons-/produktfeil. Klarna-testene kjører de faktiske komponentcallbackene med test-SDK og testresponser: eksakt prepare-ID, dobbeltklikk, deaktivert kjøp, API-feil og avbrutt autorisering uten ordre. Handlekurvens innsendingslås og feilfrigjøring er også dekket.

Nettleserkontroller på lokal side:

- Svale Stor `67548601155832`: faktisk handlekurv-POST ble avskåret og besvart med testhandlekurv; riktig Stor-linje og pris ble vist.
- TechDown Middels `46944403882232`: faktisk Klarna prepare-forespørsel ble avskåret, eksakt variant verifisert og API-feil simulert. Kjøpslåsen ble frigitt. Liten `46944403849464` var blokkert som utsolgt.
- Mikrofiber Medium/Fjellblå `42903231037688`: korrekt valgt kombinasjon. Dun Small/Vargnatt `67610887160056`: eksisterende reservasjon åpnet med riktig valg og uendret samtykke-/betalingslenkeinformasjon.
- Ingen reell Shopify-mutasjon, betaling, e-post eller reservasjon ble sendt. Testavskjæring ble fjernet etter kontrollene.
- Én main/én H1, desktop/mobil, 390 px mobil uten horisontal overflow, originalbilder med korrekte forhold, utvidbar størrelsestabell, lange vilkår, Tab/Shift+Tab, Escape, fokusretur og bakgrunnslåsing kontrollert.
- `?page=1` ga 308 til kanonisk rute; `?page=0` og `?page=2` ga 404. Next-utviklingsdiagnostikken viste ingen konfigurasjons-/sesjonsfeil.

Premium-designaudit fant 17 eksisterende funn utenfor de nye/endrede campingkomponentene. Dette er ikke rapportert som en feilfri audit av hele prosjektet.

## Lighthouse og begrensninger

Lighthouse 13.5.0 kjørt mot lokal produksjonsserver på port 3100. Testserveren ble avsluttet etter målingene. Dette er én laboratoriekjøring per profil, ikke feltdata og ikke en før-/etter-Lighthouse-sammenligning.

| Måling | Mobil | Desktop |
| --- | ---: | ---: |
| Performance | 76 | 99 |
| Accessibility | 100 | 100 |
| Best practices | 96 | 96 |
| SEO | 100 | 100 |
| FCP | 1,58 s | 0,45 s |
| LCP | 6,56 s | 0,75 s |
| TBT | 103 ms | 0 ms |
| CLS | 0 | 0 |

Mobilens LCP er fortsatt svak. Målingens kritiske kjede omfatter felles fontpreloads og renderblokkerende CSS; Lighthouse estimerer ca. 1,9 s mulig CSS-relatert ventetid. Campingbildet har nå `loading="eager"` og `fetchPriority="high"`, men dette alene løser ikke mobilresultatet. Det er ikke utført en separat, global font-/header-/CSS-ombygging. Best practices trekkes av eksisterende `/favicon.ico` 404. Disse punktene står igjen som ytelses-/prosjektbegrensninger, ikke som beståtte resultater. Enhetenes score er ikke dokumentasjon på kommersiell effekt.

Lighthouse ble kjørt før den siste rene fail-closed-presiseringen for ukjent lagerstatus; alle verifiserte livevarianter hadde eksplisitt lagerstatus og samme renderatferd. Sluttkoden er deretter typekontrollert, lintet, produksjonsbygd og analysert på nytt.

- [Mobilrapport](/tmp/utekos-camping-evidence/lighthouse-mobile.report.html)
- [Desktoprapport](/tmp/utekos-camping-evidence/lighthouse-desktop.report.html)
- Logger: `/tmp/utekos-camping-{tests,typecheck,eslint,build,analyze}.log`.

## Skjermbilder

Lokale skjermbilder ble åpnet og visuelt kontrollert. Artefakter under `/tmp` og systemets tempmappe kan senere ryddes av operativsystemet.

- [Desktop, hel side](/tmp/utekos-camping-evidence/desktop-full.jpg)
- [Desktop, kjøpskontroller](/tmp/utekos-camping-evidence/desktop-cards.jpg)
- [Mobil, hel side](/tmp/utekos-camping-evidence/mobile-full.jpg)
- [Mobil, valgt størrelse og Klarna](/tmp/utekos-camping-evidence/mobile-card.jpg)
- [Mobil, frakt og retur](/tmp/utekos-camping-evidence/mobile-policy.jpg)
- Stitch-forslag: `/tmp/utekos-stitch-desktop.png` og `/tmp/utekos-stitch-mobile.png`.

## Dokumentasjonsgrunnlag

Relevant dokumentasjon ble kontrollert før implementeringen, inkludert installert Next-dokumentasjon for server-/klientgrenser, lazy loading, Image og bundleanalyse, eksisterende Utekos-/Shopify-/Klarna-kontrakter og Judge.me sin offentlige widgetintegrasjon.

- [Next.js package bundling](https://nextjs.org/docs/app/guides/package-bundling)
- [Next.js lazy loading](https://nextjs.org/docs/app/guides/lazy-loading)
- [Judge.me API](https://judge.me/help/en/articles/8409180-using-judge-me-api)

Siden er implementert og lokalt verifisert. Produksjonsbetaling, produksjonsreservasjon, feltytelse og publisering er ikke verifisert i denne leveransen.

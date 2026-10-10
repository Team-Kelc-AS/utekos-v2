# SEO for frakt og retur

Implementert lokalt på `main` 10. oktober 2026, som utvidelse av [runden for de fire informasjonssidene](./support-implementation.md). Installert Next.js 16.3.8, `schema-dts` 2.1.0 og `schema-dts-lib` 1.1.0 er brukt. Ingen commit, push, `pnpm run sync`, publisering eller bakgrunnsjobb er utført. Eksisterende arbeidstre er bevart.

## Endringen

`/frakt-og-retur` bruker nå det samme typede registeret, den statiske metadatabyggeren, native bildefiler og JSON-LD-komponentene som de fire øvrige sidene. Metadata er uavhengige av kontaktskjema, samtykke, cookies og eksterne API-er.

Tittelen er **Frakt og retur hos Utekos | Levering og størrelsesbytte**. Eksisterende beskrivelse er beholdt: «Frakt og retur hos Utekos: se fraktpris, leveringstid, 14 dagers angrerett, gratis størrelsesbytte, returadresse og hvordan du får pengene tilbake.» Samme tittel og beskrivelse brukes i søkemetadata, Open Graph og Twitter. `title.absolute` unngår ekstra merkevaresuffiks.

Canonical og `og:url` er `https://utekos.no/frakt-og-retur`, også med kampanjeparametere. OG-type er `website`, språk `nb_NO`, nettsted `Utekos`, Twitter-kort `summary_large_image`. Felles robotbygger beholder preview-`noindex, follow`; offentlige sider tillater store bildepreview og ubegrenset tekstsnippet.

Sidegrafen inneholder `WebPage` med ID `#webpage` og `BreadcrumbList` med ID `#breadcrumb`. Samme register driver synlige brødsmuler og JSON-LD: **Forsiden → Frakt og retur**. Siden peker til eksisterende `#website` og `#organization`, med `nb-NO`. Synlig oppdateringsdato **2026-10-05** brukes i `WebPage.dateModified` og den eksisterende sitemapoppføringens `lastModified`. Ingen publiseringsdato, personlig forfatter, Article, FAQPage, HowTo eller kunstige produktdata er lagt til.

Den eksisterende pathname-kontrollen hindrer gamle sidegrafer etter klientnavigasjon med Cache Components. Grafbygging og sikker serialisering skjer fortsatt på serveren; native JSON-LD er til stede uten JavaScript.

## Felles frakt- og returpolicy

Den eksisterende `OnlineStore`-entiteten har fått to nestede policyer. Det opprettes ingen ekstra organisasjon eller nettsted. Frakt-og-retur-sidens `mainEntity` refererer til disse stabile identitetene:

| Identitet | Innhold | Støtte |
|---|---|---|
| `/frakt-og-retur#return-policy` | MerchantReturnPolicy med `merchantReturnLink` til fullstendige vilkår | Googles dokumenterte alternativ B |
| `/frakt-og-retur#shipping-service` | ShippingService med navn, beskrivelse og to ShippingConditions for Norge | Googles organisasjonspolicy for frakt |

Returpolicyens lenkeprofil bevarer skillet mellom ordinær retur, gratis størrelsesbytte og reklamasjon. Den forenkler heller ikke meldefrist, sendefrist eller refusjonsvilkår til én regel. Dette er et støttet alternativ til detaljert organisasjonsmarkup. [Google: returpolicy](https://developers.google.com/search/docs/appearance/structured-data/return-policy).

Fraktreglene beskriver **99 NOK ordinær frakt**, samt **0 NOK fra ordreverdi 999 NOK**, begge med eksplisitt destinasjon `NO`. Ved overlapp velger Google den laveste gjeldende satsen; grensen er testet under, på og over 999. Ingen øvre ordregrense eller verdensomspennende frakt utledes. Behandlingstid, cutoff og en bestemt leveringsmåte er ikke dokumentert. Sidens 2–5 virkedager etter PostNord-henting brukes ikke som total ordreleveringstid; ny global `ServicePeriod` utelates uten full arbeidsukedokumentasjon. [Google: fraktpolicy](https://developers.google.com/search/docs/appearance/structured-data/shipping-policy).

Eksisterende produktspesifikke `OfferShippingDetails` og `MerchantReturnPolicy` er uendret og beholder sitt separate produktscope. Merchant Center eller Search Console kan ha overstyrende innstillinger; disse eksterne innstillingene er ikke endret eller bekreftet av lokale HTML-tester.

## Delingsbildet som kan erstattes

Nye filer:

- `src/app/(storefront)/frakt-og-retur/opengraph-image.jpg`
- `src/app/(storefront)/frakt-og-retur/opengraph-image.alt.txt`

JPEG-en er en visuelt kontrollert, uendret kopi av `public/og-image-skreddersy-varmen.jpg`: **1200 × 630, 657 656 byte**, SHA-256 `0a57a0078315bba4ec74395a3bbba25d0e7005ea157c17f13f6bf4681e504b6f`. Alt-teksten er «To personer sitter ute på en terrasse i blå Utekos-varmeplagg.».

Next.js eier URL, MIME, dimensjoner og alt gjennom [filmetadata](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image). Ingen konkurrerende `images`-felt settes. Ferdig HTML bekrefter Twitter-fallback til samme bilde/alt. Bildets innholdsavhengige URL-versjon er kontrakttestet med installert Next-loader.

Erstatt senere JPEG-en med en egen originalkomposisjon i 1200 × 630 og oppdater alt-filen. Bevar palett, originalwordmark/logo, Google Sans Flex 120pt-variant, ExtraBold/Medium, setningskasus, korrekt ™ og riktig produktvariant. Ingen crop/padding/stretch/zoom til ny ratio. Ingen ny originalkomposisjon er produsert i denne runden.

## Før og etter

Førmålingen kom fra lokal v2 før denne utvidelsen. Etterkontrollen bruker ferdig produksjonsbygg.

| Kontroll | Før | Etter |
|---|---|---|
| HTTP-status | 200 | 200 |
| Sidetittel | Frakt og retur – levering, angrerett og størrelsesbytte \| Utekos | Frakt og retur hos Utekos \| Levering og størrelsesbytte |
| Canonical | Korrekt | Korrekt, også med kampanjeparametere |
| Rutespesifikt OG-bilde | Manglet | JPEG, dimensjoner, MIME og alt; lokal HTTP 200 |
| Sidegraf/brødsmuler | Manglet | WebPage og BreadcrumbList |
| Felles identitet | OnlineStore og WebSite | Samme to toppentiteter, med nestede policyer |
| Sitemapdato | Ingen | Dokumentert `2026-10-05` |
| Synlig tekst, tabeller, lenker, fragmenter og klasser | Førmåling | Identiske |

Ingen endring er gjort i `page.mdx`, CSS, vilkår, produktopplysninger eller eksisterende fragmentlenker. React/Base UI-genererte ID-er er utelatt fra authored-fragment-sammenligningen.

## Verifikasjon

- **29 målrettede tester består**, inkludert metadata, preview-robotregler, alle fem sidegrafer, referanser, bilder, URL-versjon, fraktgrensen og regresjoner for fellesidentitet, Uteguiden og produktdata.
- **TypeScript, avgrenset ESLint og `pnpm build` består.** Produksjonsbygget genererer 64 statiske oppføringer, inkludert nytt bildeendepunkt. Metadata er statiske; nettstedets øvrige chrome gir delvis prerendrede sider.
- **30 støtte-HTTP-scenarioer og 52 øvrige HTTP-regresjoner består.** De fem sidene er kontrollert som nettleser, mobil, Googlebot, bingbot og facebookexternalhit, samt Meta Range/komprimering. Query-canonicals og bildebyte er kontrollert i tillegg.
- Frakt-og-retur-sidens head er **3555 byte**, med komplette OG-data innen første 1 MB. Meta Range ble ignorert med HTTP 200/full gyldig HTML og `Content-Encoding: gzip`. Ingen blokkerende lokal `X-Robots-Tag` ble observert.
- Alle fem sider virker uten JavaScript. Klientnavigasjon gjennom alle fem, tilbake til Om oss og videre til Uteguiden beholder én fellesgraf og bare aktiv sidegraf. UI-/schema-brødsmuler, grafreferanser og sitemap samsvarer.
- **Schema.org MCP:** de fire toppentitetene er validert separat med kontekst; 0 feil og 0 advarsler. Generiske feltforslag er ikke Google-kvalifisering eller grunnlag for oppdiktede opplysninger.
- **Schema Markup Validator, kodeinnsending:** `not_run`. Tjenesten omdirigerte til Googles kontroll for «unusual traffic» før kodeinnsending. Ingen resultatstatus for frakt og retur ble mottatt; kontrollen er uavklart.
- **Google Rich Results Test, kodeinnsending forsøkt:** «Something went wrong — Log in and try again». Ingen gyldig Google-resultatlenke eller kvalifiseringsstatus ble mottatt. Den offentlige metadata-/schema-kodefilen ligger klar for innlogget testing.

Lokal type-/vokabularvalidering er ikke bevis på indeksering, valgt søkeresultat eller faktisk crawleridentitet gjennom Vercel/WAF. Evidens ligger i `/tmp/utekos-shipping-seo-build/`: HTTP-resultater, metadata/schema-HTML, browser-resultater og eksterne kontrollmeldinger. `git diff --check` består.

Reproduser etter `pnpm build`:

```sh
node --test tests/support-seo.test.cjs tests/site-seo.test.cjs tests/knowledge-seo.test.cjs tests/product-jsonld.test.cjs
node scripts/seo/verify-support-build.mjs
```

For før/etter-sammenligning i denne leveransen ble `SEO_BASELINE=/tmp/utekos-support-seo-before-shipping.json` og `SEO_TEST_OUTPUT=/tmp/utekos-shipping-seo-build` brukt. Integrasjonsskriptets server på 3107 og nettlesere er lukket etter kontroll. Den eksisterende dev-serveren er bevart.

## Feltoversikt

[shipping-returns-schema-fields.csv](./shipping-returns-schema-fields.csv) inneholder **552 vurderinger**: 104 `emitted`, 428 `not_applicable`, 16 `missing_evidence`, 4 `unsupported`. Felles metadata, native bilder, eksisterende organisasjonsidentitet, crawlregler og nye policyfelt er med. Plattformstøtte skiller Google-profiler fra ren Schema.org-semantikk. `emitted` betyr implementert utdata, ikke publisert eller valgt av Google.

Installert deklarasjon og den faktiske importerte `IdReference`-basen ble inventert: **467 deklarerte/arvede felt fordelt på 11 konkrete entitetsinstanser**, med én disposisjon per felt. Alle 11 feltledgere består kontrollen uten manglende inventarfelt eller obligatoriske feltblokkeringer. Valgt returprofil er uttrykkelig lenkealternativ B; detaljerte alternativ A-felt er vurdert og begrunnet som utenfor den valgte representasjonen. Midlertidige inventarer/JSON-ledgere ligger i `/tmp/utekos-shipping-schema-inventory.json` og `/tmp/utekos-shipping-field-ledgers/`.

Inventarhash for `schema-dts/dist/schema.d.ts`: `efc3e1bdfe893c6e93057d99cd8e839e54dc233da19af4c05a09665c78c2b22c`. Importert `schema-dts-lib/dist/index.d.ts`: `e64243c3fea87b24faf8cf6301192a07afaf701a300c68aad87f20e4e60a9d1c`.

## Separat innholdsoppfølging og publisering

Størrelsesbytteseksjonen bruker fortsatt `kundeservice@kelc.no`, mens resten av siden og fellesidentiteten bruker `kundeservice@utekos.no`. Avklar ønsket offentlig e-postadresse før en separat tekstendring. Begge adresser er bevart i denne implementasjonen.

Ingen publisering er utført. Åpne `robots.txt` og eksisterende `htmlLimitedBots: /.*/` er beholdt; ingen IndexNow-innsending, AI-fil, hreflang, ny språkversjon eller WAF-endring er gjort. Vercel-beskyttelse og headere, Google Rich Results Test, Meta Sharing Debugger, Search Console og Bing URL Inspection må kontrolleres på faktisk offentlig v2-deploy. Foreløpig offentlig domene ble i planundersøkelsen knyttet til headless, og dokumenterer ikke denne implementasjonen. Senere eksplisitt publisering følger kun `pnpm run sync` etter gjennomgang av hele arbeidstreet.

Native Next DevTools, installerte Next-guider for metadata/bilder/JSON-LD, Utekos Docs og Schema.org MCP er konsultert. Ingen pakkeoppgradering var nødvendig. SEO-effekt eller visning av rich results rapporteres først når det er observert etter publisering.

# SEO for fire informasjonssider

**Utvidelse:** Frakt og retur er senere lagt til som femte side i samme register og testløp. Nye felles frakt-/returpolicyer, feltoversikt og oppdaterte resultater er dokumentert i [shipping-returns-implementation.md](./shipping-returns-implementation.md). Tallene nedenfor beskriver den opprinnelige firerunden.

Implementert lokalt på `main` 10. oktober 2026, mot installert Next.js 16.3.8. Ingen commit, push, `pnpm run sync`, publisering, WAF-endring eller produksjonsmigrering er utført. Eksisterende omfattende arbeidstre er bevart.

## Implementasjon

`src/lib/seo/supportPages.ts` er det typede registeret for de fire canonical-stiene, godkjente titlene/beskrivelsene, sidetypene og brødsmulene. `buildSupportMetadata.ts` komponerer komplette OG-/Twitter-objekter, absolutte canonical-/OG-adresser og robotdirektiver. Statiske serverlayouts eksporterer metadata; kontakt har fått et layout, og metadata er fjernet fra kontaktens page-komponent. Ingen nye API-, cookie-, samtykke- eller skjemakonfigurasjonsoppslag inngår i metadata.

Alle fire bruker `title.absolute`, samme tittel/beskrivelse i søk/OG/Twitter, `nb_NO`, `summary_large_image`, `max-image-preview:large` og `max-snippet:-1`. Eksisterende robotbygger beholder preview-`noindex, follow`; returtypen er presisert uten å endre eksisterende runtime-atferd. Bare vedlikehold bruker OG-type `article` og dokumentert `article:modified_time`.

`buildSupportJsonLd.ts` bygger typede sidegrafer med `schema-dts`. Serverlayoutene bygger og serialiserer data med den eksisterende sikre serialiseringen. Felles `OnlineStore` og `WebSite` defineres fortsatt én gang av root-layoutet; eksisterende nestet `ContactPoint` har fått ID-en `https://utekos.no/#customer-service`.

| Side | Ny sidegraf, i tillegg til fellesgrafen | Brødsmuler |
|---|---|---|
| `/om-oss` | AboutPage, BreadcrumbList, Person, ImageObject | Forsiden → Om oss |
| `/kontaktskjema` | ContactPage, BreadcrumbList | Forsiden → Kontakt oss |
| `/handlehjelp/storrelsesguide` | WebPage, BreadcrumbList; produktfamilier som Thing | Forsiden → Størrelsesguide |
| `/handlehjelp/vask-og-vedlikehold` | WebPage, Article, BreadcrumbList | Forsiden → Vask og vedlikehold |

Samme register driver UI og `BreadcrumbList`. Ingen 404-rute `/handlehjelp` er lagt inn som mellomledd. Personens navn, rolle og bilde kommer fra Om oss. Artikkelens headline er den eksisterende H1-en «Riktig pleie. Varme som varer.». `dateModified` og sitemapets `lastModified` er `2026-09-01` fra synlig `<time>`. Forfatter, første publiseringsdato og artikkelbilde utelates uten dokumentasjon. Delingskortet brukes ikke som artikkelbilde. Ingen FAQPage, HowTo, Product, tilbud, lager, vurderinger eller Dataset er lagt til.

**Klientnavigasjon:** Den første produksjonstesten viste at Cache Components beholdt inaktive layouts og dermed gamle native JSON-LD-skript i DOM-en. `SupportJsonLdScript.tsx` er derfor en liten klientgrense som leser `usePathname` og bare renderer den aktive sidens native skript. Grafbygging og serialisering forblir på serveren. Disse fire statiske rutene serverrenderer også skriptet før JavaScript; dette er kontrollert med JavaScript deaktivert. Navigasjon mellom alle fire, tilbake til Om oss og videre til Uteguiden er kontrollert uten gamle sidegrafer. Se Next.js’ dokumentasjon om [Activity](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents#navigation-with-activity) og [usePathname](https://nextjs.org/docs/app/api-reference/functions/use-pathname).

## Før og etter

Førmålingen er hentet fra den eksisterende lokale v2-serveren umiddelbart før endringene. Et lokalt produksjonsbygg er brukt for etterkontrollene.

| Kontroll | Før | Etter |
|---|---|---|
| HTTP-status, alle fire sider | 200 | 200 |
| Korrekt canonical | 4 av 4 | 4 av 4, også med kampanjeparametere |
| OG-bilde | 1 av 4 | 4 av 4, med MIME, dimensjoner og alt |
| Twitter-kort | Om oss: summary | Alle fire: summary_large_image |
| Sidegraf og strukturerte brødsmuler | 0 av 4 | 4 av 4 |
| Felles organisasjon/nettsted | Én fellesgraf | Én fellesgraf; ingen doble definisjoner |
| Vedlikehold i sitemap | URL uten lastmod | Samme URL med dokumentert `2026-09-01` |
| Synlig innhold og designklasser | Førmåling | Identisk tekst, tabeller, lenker, authored fragment-ID-er og CSS-klasser |

Ingen MDX-side, måltabell, produktopplysning, skjema, CSS-fil eller eksisterende fragmentlenke er omskrevet. React/Base UI-genererte ID-er er utelatt fra sammenligningen av authored fragmenter.

## Bildene som skal erstattes senere

Hver mappe har `opengraph-image.jpg` og `opengraph-image.alt.txt`:

- `src/app/(storefront)/om-oss/`
- `src/app/(storefront)/kontaktskjema/`
- `src/app/(storefront)/handlehjelp/storrelsesguide/`
- `src/app/(storefront)/handlehjelp/vask-og-vedlikehold/`

JPEG-ene er kontrollerte, uendrede bytekopier av `public/og-image-skreddersy-varmen.jpg`: **1200 × 630, JPEG, 657 656 byte**. Alle fire og originalen har SHA-256 `0a57a0078315bba4ec74395a3bbba25d0e7005ea157c17f13f6bf4681e504b6f`. Bildet er visuelt kontrollert. Nåværende alt-tekst er «To personer sitter ute på en terrasse i blå Utekos-varmeplagg.».

Erstatt hver JPEG med en egen originalkomposisjon i 1200 × 630 og oppdater den tilhørende alt-filen. Bevar Utekos-palett, originalwordmark/logo, Google Sans Flex 120pt-variant, ExtraBold/Medium, setningskasus, korrekt ™ og riktig produktvariant. Ingen crop/padding/stretch/zoom til ny ratio. Hold filen under 5 MB for også å møte Twitter-grensen. 1200 × 630 er valgt produksjonsformat og Metas anbefaling, ikke et universelt protokollkrav.

Next.js’ [filmetadata](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) eier bilde-URL/MIME/dimensjoner/alt. Metadataobjektene har ingen konkurrerende `images`-nøkkel. Ferdig HTML viser at Twitter arver OG-bildet og alt-teksten. Installert Next-loader er testet med endrede bildebyte uten å endre repoets filer: URL-versjonen endres. Etter fremtidig bildebytte må et nytt bygg og faktisk delingscache kontrolleres. Permanent bildeverifikasjon tillater nye gyldige JPEG-er/alt-tekster; den låser ikke plassholderkopiene.

## Verifikasjon

- **27 målrettede tester består:** støttefelt, preview-regler, grafreferanser, sikre skript, bildedimensjoner og innholdsavhengig bildeversjon; samt fellesidentitet, Uteguiden og produktgrafer.
- **TypeScript, avgrenset ESLint og `git diff --check` består.** Første typekontroll fant nye typefeil som er rettet, samt utdaterte genererte ruter etter nytt kontaktlayout. `next typegen` regenererte disse; ingen generert typefil er redigert manuelt.
- **`pnpm build` består**, inkludert motion-budsjettet og TypeScript; 63 statiske genereringer, deriblant de fire nye bildeendepunktene. Sidene har statiske metadata; nettstedets øvrige dynamiske chrome gjør dem til delvis prerendrede sider.
- **24 støttespesifikke HTTP-scenarioer består:** desktop, mobil, Googlebot, bingbot, facebookexternalhit og Meta Range-/komprimeringsscenario på hver side. Query-canonicals og bildehenting kontrolleres i tillegg. Range ble ignorert med HTTP 200 og gyldig full HTML; `Content-Encoding: gzip` ble observert. Hele head er 3507–4027 byte, godt innen første 1 MB.
- **48 representative HTTP-regresjoner består** på 12 ruter. Produkt-/kategoristatus, attributt-canonical, ukjent 404/noindex og fellesbilder er kontrollert av eksisterende skript.
- Alle fire genererte bilde-URL-er svarer lokalt med 200 og `image/jpeg`, og responsbyte samsvarer med respektive kildefil. Produksjonsbyggets metadata bruker absolutte `https://utekos.no`-adresser.
- Alle fire sider fungerer med JavaScript deaktivert. Mobil og desktop har samme primærtekst/data. UI-/JSON-LD-brødsmuler og alle interne grafreferanser samsvarer, inkludert den nestede kundeserviceidentiteten.
- Sitemap har de fire URL-ene én gang hver; bare vedlikehold har den nye dokumenterte datoen. Eksisterende innholdsbilder beholdes, metadata-only kort er utelatt. `/handlehjelp` og den eksisterende teknologilenken gir fortsatt 404.
- **Schema Markup Validator, kodeinnsending:** alle fire renderer 0 feil og 0 advarsler. Sidegrafens referanser oppløses sammen med fellesgrafen. Dette er validering av lokalt generert v2-HTML, ikke av publisert v2.
- **Google Rich Results Test, kodeinnsending forsøkt:** tjenesten returnerte «Something went wrong — Log in and try again» etter innsending av vedlikeholdssidens renderede HTML. Ingen gyldig Google-resultatlenke eller kvalifiseringsstatus ble mottatt. Det regnes som en uavklart ekstern kontroll; Schema.org-validering erstatter ikke Google-testen. Kodefilene for alle fire ligger klare i evidensmappen for innlogget testing.
- Schema.org MCPs enklere validator godtar de 11 nye toppentitetene uten feil/advarsler. Den støtter ikke Graph-konvolutten direkte; derfor ble entiteter validert separat. Generiske forslag om flere felt er ikke grunnlag for oppdiktede verdier.

Reproduser mot eksisterende server:

```sh
node --test tests/support-seo.test.cjs tests/site-seo.test.cjs tests/knowledge-seo.test.cjs tests/product-jsonld.test.cjs
SEO_TEST_ORIGIN=http://localhost:3000 node scripts/seo/check-support-http.mjs
```

Reproduser produksjonsintegrasjon etter `pnpm build`:

```sh
node scripts/seo/verify-support-build.mjs
```

Integrasjonsskriptet eier en avgrenset serverprosess i forgrunnen på port 3107 og lukker server/nettlesere i `finally`. Ingen vedvarende bakgrunnsjobb opprettes. Den eksisterende dev-serveren er ikke stoppet. Dev-serverens HMR ga midlertidig 404 for nye metadatafiler; dette ble ikke godkjent som bildebevis. Alle fire er bekreftet i ferdig produksjonsbygg.

Lokale evidensfiler: `/tmp/utekos-support-seo-before/` og `/tmp/utekos-support-seo-build/`, inkludert metadata/schema-HTML egnet for kodevalidering, HTTP-resultater, serverlogg og browser-resultater. Midlertidig arbeidscheckpoint ligger i `/tmp/utekos-support-seo-checkpoint.md`.

## Feltoversikt og crawlere

[support-schema-fields.csv](./support-schema-fields.csv) har **144 vurderinger**: 112 `emitted`, 16 `not_applicable`, 13 `missing_evidence`, 3 `unsupported`. Kilde, plattformstøtte og begrunnelse følger hvert felt. `emitted` beskriver implementert/verifisert utdata, ikke publisering, indeksering eller lovet søkeresultat. Google-støttede Article-/Breadcrumb-/Organization-felt er skilt fra Schema.org-semantikk.

Eksisterende åpne `robots.txt` (`User-agent: *`, `Allow: /`) og `htmlLimitedBots: /.*/` er beholdt. Sistnevnte bevarer også korrekt produkt-/kategoristatus før responsstart. Ingen `noarchive`, `nocache`, `nosnippet`, kunstig hreflang eller særskilt AI-schema/-fil er innført.

| Gruppe | Rolle; tilgang beholdt |
|---|---|
| Googlebot / Googlebot-Image | Søk og bilder. |
| Google-InspectionTool | Testverktøy; testtilgang beviser ikke indeksering. |
| Google-Extended | Kontrolltoken for Gemini-trening/grounding, uten egen HTTP-UA eller Search-rangeringssignal. |
| bingbot / MicrosoftPreview / Bing-previewcrawlere | Bing-indeksering og Microsoft-forhåndsvisninger. |
| facebookexternalhit | Delingskort fra HTML/bilder; OG innen første 1 MB, Range og komprimering kontrollert lokalt. |
| meta-webindexer | Meta AI-søk og kildelenker. |
| meta-externalagent / meta-externalads | Henholdsvis trening/produktforbedring og annonsering/forretningsprodukter. |
| meta-externalfetcher | Brukerutløste hentinger; annen rolle enn trening. |
| OAI-SearchBot / PerplexityBot | AI-søk. GPTBot er en separat kontroll for modelltrening. |

Rollene er dokumentert hos [Google](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers), [Microsoft](https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0), [Meta](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers), [OpenAI](https://developers.openai.com/api/docs/bots) og [Perplexity](https://docs.perplexity.ai/docs/resources/perplexity-crawlers). Test med angitt UA beviser ikke en ekte crawlertilgang gjennom WAF. [Bing-direktiver](https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a) kan også påvirke Copilot-bruk/sitering.

## Separat innholdsoppfølging

1. Størrelsesguiden bruker fortsatt `kundeservice@kelc.no`; kontaktsiden/fellesidentiteten bruker `kundeservice@utekos.no`. Avklar korrekt offentlig adresse før innholdet endres.
2. Vedlikeholdsguidens `/handlehjelp/teknologi-materialer` gir fortsatt lokalt 404. Avklar ønsket eksisterende mål eller opprett siden som separat innholdsarbeid.
3. Vedlikeholdsguiden mangler dokumentert forfatter, første publiseringsdato og representativt artikkelbilde. Innhent faktagrunnlag før feltene legges til.

## Publisering og gjenstående eksterne kontroller

Ingen publisering er gjort. Offentlig `utekos.no` var i planundersøkelsen knyttet til utekos-headless; denne leveransen migrerer ikke domenet. Vercel-prosjekt, Deployment Protection, WAF og faktisk `X-Robots-Tag` må verifiseres på riktig offentlig v2-deploy. Preview-`noindex` er kontrakttestet lokalt; ingen ny Vercel-preview er opprettet.

Meta Sharing Debugger, Search Console og Bing URL Inspection skal kontrollere faktisk v2-deploy senere. IndexNow er kun en senere distribusjonsmulighet med verifisert vert/nøkkel og publiserte endringer. Ingen innsending er utført. Senere eksplisitt publisering følger bare `pnpm run sync`, etter gjennomgang av hele arbeidstreet den kommandoen vil inkludere.

Etter publisering sammenlignes indeksering, valgt canonical, feil, visninger, klikk og relevante søk manuelt mot førperioden i Search Console/Bing. Ingen SEO-effekt eller rich-result-visning er dokumentert av lokale tester.

## Kilder og versjonsvalg

Native Next DevTools bekreftet installert 16.3.8 og henviste til `node_modules/next/dist/docs/`. Metadata-/bilde-/JSON-LD-/usePathname-/Cache Components-guidene og installert metadataresolver/loader er lest. Provider-dokumentasjon, Utekos Docs, Context7 og schema-org MCP ble konsultert i planarbeidet; ingen pakkeoppgradering var nødvendig.

Faktisk, synlig innhold styrer markup etter [Googles retningslinjer](https://developers.google.com/search/docs/appearance/structured-data/sd-policies). [Article](https://developers.google.com/search/docs/appearance/structured-data/article), [Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) og [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) beskriver relevante Google-funksjoner, med visning bestemt av Google. FAQ-resultater er avviklet ifølge [Google Search-oppdateringer](https://developers.google.com/search/updates?hl=en); [HowTo](https://developers.google.com/search/blog/2023/08/howto-faq-changes) er også avviklet. [AI-funksjoner](https://developers.google.com/search/docs/appearance/ai-features) krever ingen ekstra AI-filer/schema. [Meta-bilder](https://developers.facebook.com/documentation/sharing/webmasters/images), [Vercel-headere](https://vercel.com/docs/headers/response-headers) og [IndexNow](https://www.indexnow.org/documentation) avgrenser henholdsvis delingskort, deploykontroll og eventuell senere distribusjon.

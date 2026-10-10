# Felles SEO fra rotlayouten

Implementert lokalt på `main` 2026-10-09. Ingen publisering, commit, push, IndexNow-innsending eller bakgrunnsjobb. Eksisterende lokale endringer og Uteguiden-innhold er bevart.

## Ansvar og resultat

`src/app/layout.tsx` leverer felles metadata via `buildRootMetadata()` og ett serverrendret `site-jsonld`-script. Grafen inneholder `OnlineStore` (undertypen av Organization anbefalt for nettbutikker) og `WebSite`. Identitetene er fortsatt `https://utekos.no/#organization` og `https://utekos.no/#website`.

Uteguidens Article/CollectionPage og NBCC-siden refererer til disse identitetene. Produkttilbud bruker samme organisasjon som `seller`. Ingen kopier av Utekos-organisasjonen legges i sidegrafene. Artikkel-, produkt- og brødsmuledata tilhører den aktuelle ruten; rotlayouten merker ikke alle sider som artikler eller produkter.

Rotmetadata har produksjonsbase, tittelsuffiks, en konkret beskrivelse, utgiver, nettstednavn, norsk Open Graph-locale, eksisterende originalbilde og robots-regler. Dokumentets språk er `nb`. Forsiden får sin egen absolutte tittel, canonical og komplett Open Graph-/Twitter-oppsett. Kategorier bruker den delte byggeren for komplette delingsobjekter.

**Arv:** Next.js slår sammen metadata grunt. Root har derfor ingen canonical, `og:url`, `og:title` eller `og:description`. Root Twitter setter bare korttypen, slik at Next kan fylle inn den aktuelle sidens Open Graph-data. Forsiden, artikler og produkter setter sine egne delingsdata. Eksisterende eksplisitte sidevalg beholdes, som kompakt Twitter-kort på Om oss. Dette er en felles grunnmur, ikke en omskriving av alle statiske siders metadata.

`VERCEL_ENV=preview` gir `noindex, follow`. Kategorier og NBCC bruker samme robots-bygger slik at egne metadata ikke opphever preview-regelen. Tomme produktlister forblir `noindex` også i produksjon. PDF-sidens eksisterende `noindex` beholdes. Store bildeutdrag tillates. `htmlLimitedBots`, robots.txt, URL-er, cacheoppsett og global 404-strategi er uendret.

## Faktagrunnlag

| Felt | Verifisert kilde og valg |
|---|---|
| Butikknavn | Shopify Admin API `shop.name`: Utekos. |
| Offentlig nettsted | Eksisterende `SITE_ORIGIN`: `https://utekos.no`. Shopify Admin API peker på `kasse.utekos.no`; dette er ikke storefrontens canonical-base. |
| Juridisk enhet | Native BRREG-oppslag på 925820393: KELC AS. Samsvarer med synlig footer. |
| Organisasjonsnummer | `identifier` som PropertyValue med `propertyID: Organisasjonsnummer`. Ingen konstruert VAT-/ISO6523-identifikator. |
| Adresse | BRREG og synlig footer: Lille Damsgårdsveien 25, 5162 Laksevåg, NO. Ingen personreferanse fra c/o-linjen publiseres. |
| Kundeservice | Synlig footer: `kundeservice@utekos.no`, `+4740216343`, `/kontaktskjema`. Shopifys alternative butikkontakt brukes ikke som kundeserviceadresse. |
| Logo | Eksisterende original `public/icon.png`, visuelt kontrollert, 1000 × 1000 PNG. |
| Delingsbilde | Eksisterende original `public/og-image-skreddersy-varmen.jpg`, visuelt kontrollert, 1200 × 630 JPEG. Ingen nye bilder, beskjæring eller formatendring. |
| Beskrivelse | Kort metadataomtale av eksisterende varmeplagg-/tilbehørssortiment og bruksområder på nettstedet. Ingen nye tekniske produktpåstander. |

Stiftelsesdatoen til KELC AS blir ikke brukt som merkevarens etableringsdato. Ingen udokumenterte sosiale profiler, vurderinger, åpningstider, fysiske butikkpåstander, søkehandlinger eller verifikasjonskoder legges til. Produktspesifikke frakt-/returregler blir på produktene; de løftes ikke til hele virksomheten uten et verifisert generelt datagrunnlag. Ingen nye runtime-kall til Shopify, BRREG eller andre tjenester.

## Kontroller

- `pnpm build`: bestått, med TypeScript og 59 genererte sider.
- 35 målrettede tester: bestått. Dekker rot-/forsidemetadata, preview og tomkategori, identitet/referanser, trygg JSON-LD-serialisering, originale bildedimensjoner, Uteguiden, produkter, sitemap og URL-er.
- ESLint for berørt kode og skript samt `git diff --check`: bestått.
- HTTP i både utvikling og lokalt produksjonsbygg: **40 kontroller** (ti representative sider × vanlig nettleser, Googlebot, Bingbot, facebookexternalhit), med én felles graf, korrekte sidetitler og canonical, bevarte lokale delingsdata, ingen dupliserte identiteter, riktige MIME-typer og 200 for logo/delingsbilde. Sporingsparametere endrer ikke canonical; ukjent artikkel gir 404/noindex uten forsidens canonical.
- Uteguidens eksisterende HTTP-regresjon: **44 kontroller** i begge miljøer. Alle ti artikler, oversikt, bilder, sitemap, gamle redirecter, originaltekst, ankere og kildelister består etter identitetsflyttingen.
- Klientnavigasjon forside → Uteguiden → artikkel → kontakt: én vedvarende `site-jsonld`, riktig aktiv sidetittel/canonical og riktige delingstitler. Eksisterende handlekurv og skjemaer er ikke endret.
- Schema.org Validator: forsidens renderede metadata og felles JSON-LD gir **0 feil og 0 advarsler**, med WebSite → OnlineStore og nestede kontakt-/adressefelter korrekt oppløst.
- Google Rich Results Test: [forsiden](https://search.google.com/test/rich-results/result?id=AXnqeJj8x4LTgdco43YVqg) gir gyldig Organization. [Artikkelen «Hvorfor blir man kald?»](https://search.google.com/test/rich-results/result?id=Wk1TtTjykJgKiwO67HjvfQ), testet med både root-script og eget script, gir gyldig Article, Breadcrumbs og Organization. Google godtar altså den delte OnlineStore-forfatteren/utgiveren. Ingen kritiske feil eller artikkelmerknader.
- Google klassifiserer i tillegg OnlineStore under «Local businesses», med **én ikke-kritisk merknad om valgfritt `image`**. Vi leverer den dokumenterte logoen som `logo` og har ikke valgt et separat virksomhetsbilde. Dette er ikke en påstand om en fysisk butikk. Den eksisterende artikkelverdien `isAccessibleForFree: true` utløser også en gyldig «Paywalled Content»-kontroll; artikkelen er fortsatt gratis. Testene bruker innlimt offentlig HTML/metadata, og validerer ikke en publisert deploy.

Preview-regelen er testet med miljøstyrte kontrakttester; det er ikke opprettet eller publisert en Vercel-preview. Live Search Console-/Bing-inspeksjon og Meta Sharing Debugger er ikke utført. Lokal kvalifisering og indeksering/rich-result-visning i produksjon er ulike ting.

Reproduser HTTP-kontroll mot en allerede kjørende server:

```sh
SEO_TEST_ORIGIN=http://localhost:3000 node scripts/seo/check-site-http.mjs
SEO_TEST_ORIGIN=http://localhost:3000 node scripts/seo/check-knowledge-http.mjs
```

Det lokale produksjonsbygget ble testet med en avgrenset forgrunnsprosess som stoppet serveren etter kontrollene. Bevisfiler: `/tmp/utekos-root-seo-20261009/`. Feltoversikten, inkludert arv og konsumentbegrensninger, er oppdatert til 1091 vurderinger i [uteguiden-schema-fields.csv](./uteguiden-schema-fields.csv).

## Dokumentasjon

- Installert Next.js 16.3.8: `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`, metadatareferansen og `resolve-metadata.js`. [Metadataarv](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#merging), [JSON-LD](https://nextjs.org/docs/app/guides/json-ld). Utekos Docs ble også konsultert gjennom native MCP. Ingen pakkeoppgradering var nødvendig.
- [Google Organization](https://developers.google.com/search/docs/appearance/structured-data/organization): bruk relevant subtype som OnlineStore og dokumenterte virksomhetsopplysninger. Google krever ikke en identitetsgraf på hver side; root-plasseringen sikrer ett konsistent datasett og stabile referanser, inkludert på forsiden.
- [Google site names](https://developers.google.com/search/docs/appearance/site-names): WebSite-navn og URL på forsiden. Ingen avviklede SearchAction-tiltak innføres.
- [BRREG-enheten](https://data.brreg.no/enhetsregisteret/api/enheter/925820393), hentet via native BRREG MCP. Shopify-identitet ble lest gjennom skjemaverifisert og validert Admin API-spørring.
- [Vercel environments](https://vercel.com/docs/deployments/environments): preview og produksjon behandles som forskjellige miljøer. Den eksplisitte metadataregelen testes lokalt; ingen antakelse om live-deployens responsheadere.

Utekos Shopify Platform MCPs dokumentasjonssøk ga ingen relevant SEO-dokumentasjon. Connectoren, sporingslaget, Supabase og betalingsflyten får ingen nye oppgaver i denne endringen.

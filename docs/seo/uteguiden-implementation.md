# Uteguiden: SEO-leveranse 9. oktober 2026

Implementert lokalt på `main`. Ingen commit, push, `pnpm run sync`, publisering eller IndexNow-innsending. Eksisterende lokale endringer og ruter er bevart. Next.js 16.3.8, MDX 3.1.1, Zod 4.6.5 og schema-dts 2.1.0 er uendret.

## Implementasjon

- Elleve `layout.mdx` erstatter de tidligere layoutfilene. Eksplisitte MDX-wrappere og `{props.children}` bevarer sideinnhold, eksisterende hero-plassering og MDX-mapping. Ingen parallelle `layout.tsx`.
- Ti artikler i `knowledgeArticles.ts` er felles datagrunnlag for oversikt, SEO-metadata, JSON-LD og sitemap. Synlig tittel og ingress er bevart. SEO-titler og beskrivelser er separate felt.
- Zod validerer unike stier/slugger, SEO-felter, kildelenker, datoer, kronologi og bildedimensjoner ved import/prerendering. Metadata bruker statiske eksporter, uten nye fetcher eller cachelag.
- Hver artikkel har ett serverrendret script med Article, WebPage, BreadcrumbList og ImageObject. Felles WebSite og OnlineStore (en Organization-undertype) leveres nå én gang fra rotlayouten, se [felles SEO](./site-implementation.md). Utekos er forfatter/utgiver med eksisterende `https://utekos.no/#organization`. Oversikten har CollectionPage og ItemList med ti artikler i kortrekkefølgen, uten Article.
- JSON-LD serialiseres med `<` erstattet av `\u003c`. Kildereferanser beholder antall, ordlyd og eksisterende URL-er, også `additionalLinks`. Lenketekster er UI-tekst, ikke egne schema-felter.
- Canonical bruker produksjonsorigin. Komplette Open Graph-objekter, Twitter `summary_large_image`, `nb_NO`, byline, brødsmuler og store bildeutdrag er lagt inn. Preview bruker `noindex`; ingen oppdiktede konto-ID-er.
- Alle ti lenker finnes i server-HTML. Seks kort vises først, fire ligger i native `<details>` med «Se mer». Ingen klientkomponent for denne utvidelsen.
- Sitemap inneholder hver artikkel én gang. `lastModified` bruker eksisterende redaksjonell dato når dokumentert. Bildesitemap inkluderer faktiske innholdsbilder; grafiske delingskort holdes separat. Gamle `/kunnskap/*`-redirecter er bevart.

## Datagrunnlag og bevaringskontroll

| Artikkel | Kilder | Datoer |
|---|---:|---|
| julegaven-til-den-som-har-alt | 14 | Eksisterende dato uten klokkeslett |
| hva-er-glamping | 56 | Udokumentert; utelatt |
| glamping-i-norge | 0 | Udokumentert; utelatt |
| vinterlagring-av-campingvogn-og-bobil | 70 | Udokumentert; utelatt |
| hvordan-forlenge-terassesesongen | 12 | Eksisterende dato uten klokkeslett |
| cloudweave | 6 | Eksisterende tidspunkt/tidssone |
| hva-skal-man-ha-innerst | 8 | Eksisterende tidspunkt/tidssone |
| hvordan-holde-varmen-ute | 10 | Eksisterende tidspunkt/tidssone |
| hvorfor-blir-man-kald | 7 | Eksisterende tidspunkt/tidssone |
| ykk | 8 | Eksisterende tidspunkt/tidssone |

Før-/etterkontrollen sammenligner samtlige tidligere avsnitt, overskrifter med anker-ID og hele den synlige kildelisten fra HTTP-renderingen. Alle er bevart. En uavhengig kodegjennomgang bekreftet også de sju opprinnelige registerpostene og de to flyttede kildelistene. Glamping-kilde 22 hadde opprinnelig tom tittel; `citation.name` utelates der, mens den dokumenterte referansen beholdes. Manglende datoer, forfatterpersoner og kilder er ikke konstruert.

## Bilder og proveniens

Elleve selvstendige PNG-delingsbilder ligger i `public/images/uteguiden/social/*-v1.png`. Alle er nøyaktig 1200 × 630, under 8 MB og komponert direkte i målformatet. `scripts/seo/render-knowledge-social.mjs` lager originale vektormotiver med Utekos-paletten, uendret `WordmarkWhite.svg` og Google Sans Flex med verifiserte variable akser: optisk variant 120, vekt 800/500. Skriptet bruker fontfilen fra prosjektets Next/font-bygging og nekter å overskrive en eksisterende versjon med endrede bytes. Ved revisjon brukes for eksempel `SEO_IMAGE_VERSION=v2`, og registerets URL-er oppdateres. Ingen eksisterende fotografier er beskåret eller strukket inn i delingskortene. Kortene er kreative illustrasjoner, ikke teknisk dokumentasjon.

Organization bruker den eksisterende svart/hvite `icon.png` (1000 × 1000), som også er byline-logoen og er synlig på lys bakgrunn. Det originale hvite wordmarket brukes uendret på de mørke delingskortene.

Vinterlagringsbildet `public/images/uteguiden/vinterlagring-v1.png` er en ny AI-generert, fiktiv illustrasjon av umerkede fritidskjøretøy ved et lagerbygg. Verktøyet leverte **1672 × 941**, omtrent 16:9 (0,05 % avvik fra eksakt forhold). Originalfilen er bevart uten beskjæring, padding eller geometrisk endring; de faktiske dimensjonene brukes overalt. Dette presisjonsavviket er dokumentert, ikke skjult gjennom en ny eksport. Synlig bildetekst presiserer at bildet ikke dokumenterer et bestemt anlegg eller en teknisk prosedyre.

De eksisterende coverbildene for CloudWeave og glamping-i-norge er gjennomgått visuelt og brukes nå også i artiklene. Glampingbildet er uttrykkelig merket som illustrasjon av et uspesifisert sted. Opprinnelige bildeformater og artikkelbilder er bevart. Alle elleve delingskort er visuelt kontrollert i en kontaktflate.

## Schema-feltoversikt

[uteguiden-schema-fields.csv](./uteguiden-schema-fields.csv) inneholder nå **1091 felt-/typevurderinger** for de fjorten brukte typene, inkludert arvede felter og de nestede typene CreativeWork, ListItem, QuantitativeValue, PostalAddress, ContactPoint og PropertyValue. OnlineStore erstatter den generelle Organization-definisjonen etter innføring av felles identitet i rotlayouten. Felter hentes fra installert schema-dts 2.1.0; hver rad angir arv, status, begrunnelse, konsumentbegrensning og primærkilde.

Statusene er `implementert`, `ikke relevant`, `manglende dokumentasjon` og `ikke støttet av aktuell konsument`. «Implementert» kan være betinget, for eksempel dokumenterte datoer. Ubrukte felter som krever rettigheter eller dokumentert virksomhetsinformasjon fylles ikke ut. Schema.org-semantikk er ikke en påstand om en Google-funksjon. Oversiktens generelle ItemList gir ikke i seg selv rett til en artikkelkarusell. Regenerer oversikten med `node scripts/seo/knowledge-field-ledger.mjs` og vurder klassifiseringene ved endring av graphen.

## Verifikasjon

- `pnpm build`: bestått, inkludert TypeScript og alle 59 genererte sider. Bytte til MDX avdekket først foreldede `.next/dev/types` og manglende eksplisitte MDX-importer. Genererte typer ble sikkerhetskopiert utenfor repoet, importene rettet, og hele byggingen kjørt på nytt.
- 29 målrettede tester: bestått. Omfatter ny `tests/knowledge-seo.test.cjs` samt eksisterende sitemap-, produktmetadata-, produktgraph-, URL- og videoregresjoner. Testene dekker også `</script>`, Unicode, negative Zod-tilfeller, alle ruter og faktiske bildeformater/dimensjoner.
- ESLint for berørt kode og nye skript: bestått uten advarsler. `git diff --check`: bestått.
- Direkte HTTP: 44 kombinasjoner (elleve sider × vanlig UA, Googlebot, Bingbot og facebookexternalhit) testet både mot utviklingsserveren og et lokalt produksjonsbygg, med status 200, korrekt metadata og én sidegraph. Innhold, synlige schema-bilder, sitemap, ukjent artikkel (404), sporingsparametere og elleve gamle redirect-adresser (308) består. Produksjonsserveren kjørte som en avgrenset forgrunnstest og ble stoppet automatisk ved avslutning.
- Nettleser: alle ti artikler åpnet via oversiktslenker og tilbake via brødsmuler. Riktig tittel/canonical, én aktiv H1 og én aktiv graph. Alle elleve sider kontrollert ved 390 × 844 og 1440 × 900: én main/H1/graph ved direkte navigasjon, ingen horisontal sideoverflow. Mobilvisning av nytt bilde og bildetekst er inspisert.
- Next.js Cache Components beholder nylig besøkte sider i skjulte React Activity-trær. Disse kan fortsatt finnes i DOM etter klientnavigasjon. Kontrollene skiller derfor aktiv side fra skjult buffer. Direkte server-HTML har bare den aktuelle siden. Global cache-/HTTP-/404-strategi er uendret.
- Schema.org Validator: renderet head og main for oversikt, julegaveartikkel, vinterlagring og «Hvorfor blir man kald?» gir **0 feil og 0 advarsler**. Sistnevnte er også testet med den endelige logo-URL-en. Dette er representative eksterne tester, ikke en påstand om elleve separate valideringer.
- Google Rich Results Test: julegaveartikkel og «Hvorfor blir man kald?» gir gyldig Article og Breadcrumbs. Sistnevnte har ingen artikkelmerknader. Julegaveartikkelen har fire **ikke-kritiske** merknader for dato uten klokkeslett/tidssone; datoene beholdes etter den vedtatte presisjonsregelen. `isAccessibleForFree: true` gjør at Google også lister en gyldig «Paywalled Content»-kontroll; innholdet er fortsatt gratis.

Ekstern validering ble gjort med ferdig renderet offentlig artikkelinnhold i kodefeltet, ikke ved å publisere en preview. Det er ikke utført produksjonskontroll av nye bildeadresser, Meta Sharing Debugger, Search Console-/Bing-inspeksjon eller indekseringsinnsending. Dette krever en senere uttrykkelig bestilt publisering. Ingen synlighet, ranking, Bing/Copilot-sitering eller rich-result-visning er garantert.

Lokale bevis, førkopier, HTTP-HTML og logger: `/tmp/utekos-seo-20261009/`. Dette er lokal arbeidsdokumentasjon, ikke en publisert artefakt. Reproduser HTTP-kontrollen mot en allerede kjørende server med `SEO_TEST_ORIGIN=http://localhost:3000 node scripts/seo/check-knowledge-http.mjs`.

## Dokumentasjonsgrunnlag

- [Next.js MDX](https://nextjs.org/docs/app/guides/mdx), [JSON-LD](https://nextjs.org/docs/app/guides/json-ld), [Cache Components / Activity](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents). Installert versjons dokumentasjon og filmatcher er kontrollert lokalt.
- [Google Article](https://developers.google.com/search/docs/appearance/structured-data/article), [Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb), [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization), [site names](https://developers.google.com/search/docs/appearance/site-names).
- [Google dokumentasjonsendringer](https://developers.google.com/search/updates), [HowTo/FAQ-endringer](https://developers.google.com/search/blog/2023/08/howto-faq-changes), [speakable-begrensninger](https://developers.google.com/search/docs/appearance/structured-data/speakable). FAQPage/HowTo inngår ikke som rich-result-tiltak.
- [Meta bildekrav](https://developers.facebook.com/documentation/sharing/webmasters/images): selvstendige versjonerte delingsbilder, 1200 × 630 og under 8 MB.
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a): tilgjengelig innhold, interne lenker, canonical, sitemap og korrekt strukturert innhold; ingen særskilt Microsoft-schema.
- [Schema.org Article](https://schema.org/Article) og per-feltlenker i CSV-en. Utekos Docs, native dokumentasjons-MCP-er og Context7 ble konsultert under kartleggingen.

Supabase og Stape/GTM har ingen nye oppgaver eller endringer i denne leveransen. Serpstat kan brukes til senere måling, men er ingen runtime-avhengighet.

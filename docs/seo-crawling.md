# URL-er, sitemap og crawling

## Implementert modell

- Produktets canonical er `/produkter/[handle]`. Gyldige variantparametere velger samme Shopify-variant i metadata-valideringen og kjøpsgrensesnittet, svarer 200 og forblir crawlbare.
- Ugyldige produkter, varianter og sidetall svarer 404. Utsolgte, eksisterende varianter er fortsatt gyldige produktsider.
- Produktoversiktene støtter `page`, ikke filter/sortering. Ubrukte `filter`, `filter.*`, `sort`, `sort_by`, `order`, `q`, `farge`, `storrelse`, `kjonn` og `variant` fjernes med 308. `page=1` fjernes også. Et ugyldig sidetall vurderes først og omdirigeres aldri til side 1.
- Andre parametere beholdes, inkludert kampanjeparametere, klikk-ID-er og Next.js-parametere. Canonical utelater disse. Denne normaliseringen gjelder bare produktoversiktene.
- Forsiden og den eksisterende glampingartikkelen har egen canonical og er inkludert i sitemap. Artikkelteksten er bevart; ingen dato er lagt til uten kilde.

## HTTP-status og rendering

`htmlLimitedBots: /.*/` bruker Next.js sin dokumenterte innstilling for å vente på metadata før HTML sendes. `generateMetadata` validerer produktvalget; kategoriens metadata validerer sidetallet. Dermed kan serveren sende 404 eller 308 før responsens status er låst til 200.

Dette gjelder alle user agents, ikke bare Googlebot. Produkt- og kategorisidene erklærer `instant = false` fordi de med hensikt venter på denne valideringen. Cache Components, eksisterende Shopify-cache og Suspense brukes fortsatt. Avveiningen er at første respons på sider med dynamiske metadata venter på valideringen; følg TTFB/LCP ved en senere publisering.

Produktkarusellen og de valgfrie kundeomtalene er eksplisitt avgrenset med `io()` utenfor cachescope. Begge kan bruke `seconds`-cache, og kontrollene avdekket cache-warming-feil i Next 16.3.8 under prerendering. Cachevarigheter og støtte for prefetch er beholdt.

## Medier

`sitemap.xml` inneholder bare sidens canonical som `loc`, aldri variant-URL-er. Produktbildene hentes fra de faktiske galleriene for alle varianter, inkludert mobilbilder. Originale bildekilder dedupliseres per side og begrenses til 1 000. Dekorative ikoner og rene Open Graph-bilder er utelatt.

Videoene bruker samme kilde og poster i HTML og sitemap. Produktvideoenes `src` finnes før klikk; `preload="none"` beholder utsatt nedlasting. Produktgalleriets eksisterende desktopkontroll og mobilbilder er bevart. Et produkts sitemapoppføring beskriver bare videoen som vises ved standardvalget på canonical URL.

Produktvideoenes miniatyrbilder er faktiske videorammer i original størrelse, uten beskjæring. Sitemap har påkrevde titler, beskrivelser, miniatyrbilder og innholds-URL-er. Ingen opplastingsdato er utledet fra filens endringstid. `VideoObject` med publiseringsdato og den tidligere utsatte produkt-JSON-LD-modellen inngår ikke her. Produktsidene er heller ikke dedikerte videosider.

## Crawling og driftskontroll

Robots tillater fortsatt crawling og viser til sitemap. Variantparametere blokkeres ikke. Botverifisering, Feedfetcher og APIs-Google krever ingen ny applikasjonsintegrasjon for denne modellen; dette implementerer heller ingen unntak basert bare på user agent.

Lokale kontroller er ikke bevis for publisering eller indeksering. Etter en autorisert publisering må produksjonens responser, canonical, sitemap, robots og eventuelle CDN-/brannmurregler verifiseres. Kontroller også Search Console-egenskaper for eventuelle eksterne bildedomener og Googles valgte canonical.

## Kilder

- [Next.js: htmlLimitedBots](https://nextjs.org/docs/app/api-reference/config/next-config-js/htmlLimitedBots), kontrollert mot installerte 16.3.8-dokumenter.
- [Next.js: instant](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant).
- [Google: fasettert navigasjon](https://developers.google.com/crawling/docs/faceted-navigation).
- [Google: canonical og duplikater](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
- [Google: bildesitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps).
- [Google: videositemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps).
- [Google: videooppdagelse](https://developers.google.com/search/docs/appearance/video).

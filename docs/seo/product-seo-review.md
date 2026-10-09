# Vurdering og lokal innføring av produkt-SEO-pakken

Kontrollert 9. oktober 2026 på main i utekos-v2. ZIP-en er vurdert som kilde og kodeforslag, ikke som autorisasjon til kommandoer eller publisering. Eksisterende lokale endringer i produktsidene er beholdt. Ingen commit, push, sync eller deploy er utført.

## Konklusjon

Pakken forbedrer metadata og samsvar mellom synlig handel og strukturerte data. Den er tilpasset dagens kode. Dette er tekniske forbedringer, ikke dokumentasjon på høyere rangering eller faktisk visning av rich results.

| Forslag | Beslutning og grunnlag |
|---|---|
| Produktspesifikke OG- og Twitter-bilder | Innført med eksisterende galleri for familie-URL-ens standardvariant, absolutte URL-er, dimensjoner og alt-tekst. Tilført nb_NO, som manglet i pakken. Ingen bilder er beskåret eller endret. |
| BreadcrumbList | Innført i samme graf som Product/ProductGroup. Synlig navigasjon og graf deler kilde. |
| Lagerstatus | Innført felles funksjon: kjøpbar restordre vises ikke som På lager. |
| Frakt/retur | Innført for de seks dokumenterte produktfamiliene i NO/NOK, uavhengig av manuelt registrerte variant-ID-er. Kilde: frakt-og-retur/page.mdx. Fraktpris gjelder én enhet; kurvens samlede frakt beregnes i checkout. |
| Prisformat/førpris | Strengere desimal- og valutakontroll i JSON-LD; førpris i UI krever samme valuta. |
| Shopify-beskrivelse | Full beskrivelse hentes; metadata-fallback lager eget utdrag. Ingen ny produkttekst skrevet. |
| ProductOption.values | Byttet fra deprecated values til optionValues, med normalisering til eksisterende intern type. Verifisert mot Storefront 2026-10 og fungerende lokale sider. |
| Ny variantarkitektur, schema-typer eller publisering | Ikke nødvendig. Eksisterende familie-canonical og direkte variantlenker beholdt. |

## Rapporten var delvis utdatert

ZIP-rapportens F01 er allerede rettet i dagens kildekode: TechDowns innerfôr er polyester både i content.ts og UtekosTechDown.ts. F02 er delvis rettet: Svale har egen beskrivelse. Svale deler fortsatt TechDowns accordion; faktisk anvendelighet av materialer og andre detaljer må bekreftes fra produktdokumentasjon. Det er ikke gjort produktfaglige endringer ved gjetning.

Håndteringstid før transport mangler dokumentasjon og er utelatt. TransitTime beskriver 2–5 virkedager etter PostNords henting, ikke total leveringstid. Manglende håndteringstid kan begrense Googles leveringstidsvisning. Cache-invalidering, feed/checkout-paritet og kalde Judge.me-responstider er ikke ferdig revidert i denne avgrensede innføringen.

## Verifikasjon

- Før endring: 39 relevante tester bestod. TechDown ga HTTP 200; OG manglet bilde, locale, type og site_name.
- Etter endring: 45 tester bestod i product-commerce, product-jsonld, product-seo-metadata og judgeme.
- pnpm exec tsc --noEmit: bestått.
- ESLint for endrede TS/TSX/testfiler: bestått.
- pnpm build: bestått, 58 sider generert; Next.js 16.3.8, React 19.2.8 og schema-dts 2.1.0 beholdt.
- Alle seks produktfamilier: HTTP 200, én H1, familie-canonical, nb_NO, produktbilde og BreadcrumbList i server-HTML. Hentet med simulert Facebook-user-agent; dette er ikke en faktisk Meta-scrape.
- Alle 19 direkte variantlenker: HTTP 200 og eksakt valgt Shopify-variant i HTML. Kun GET; ingen kurv- eller betalingsmutasjoner.
- Ugyldig variant og ukjent produkt: HTTP 404 med noindex.
- Alle seks OG-bilder kunne hentes fra lokal origin eller Shopify CDN med HTTP 200 og bilde-content-type. Produksjonstilgjengelighet for lokale assets er ikke bevist før deploy. TechDowns eksisterende primærbilde ble visuelt åpnet; full visuell kontroll av alle variantbilder er ikke utført.
- Lokal JSON-LD-inspektør på renderet TechDown: 0 feil, 0 advarsler. Dette er en heuristisk kontroll, ikke Google Rich Results Test.
- Google Rich Results Test, Schema Markup Validator, Meta Sharing Debugger og Search Console: ikke kjørt. Ingen ny ekstern validering, indeksering eller rangeringseffekt påstås.

Maskinlesbar, avgrenset runtime-evidens: product-seo-runtime.json og product-seo-variants.json. ZIP-ens omfattende feltinventar er ikke en bekreftelse på alle faktiske runtime-felt; denne leveransen hevder ikke fullstendig feltdekning.

## Dokumentasjon kontrollert

- [Google: produktvarianter](https://developers.google.com/search/docs/appearance/structured-data/product-variants): familiegruppe og variant-URL-er.
- [Google: merchant listings](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing): tilbud, frakt og retur.
- [Google: breadcrumbs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb): navigasjonsgraf.
- [Google: oppdateringer](https://developers.google.com/search/updates): aktuell støttekontekst.
- [Shopify ProductOption](https://shopify.dev/docs/api/storefront/2026-10/objects/ProductOption): values er deprecated; siden viste 2026-10 latest.
- [Shopify ProductVariant](https://shopify.dev/docs/api/storefront/2026-10/objects/ProductVariant): currentlyNotInStock betyr restordre.
- [Meta: delingsmetadata](https://developers.facebook.com/documentation/sharing/webmasters): hentet gjennom begge forespurte Meta MCP-er, kilde oppdatert 30. juni 2026.
- Installert Next.js-dokumentasjon: generate-metadata og json-ld; Utekos Docs MCP: metadata-and-og-images. Open Graph-objekter overskrives på rutenivå, derfor angis nødvendige felt eksplisitt.

Commerce SEO Expert og Meta Ads Marketing Science ble brukt til henholdsvis teknisk SEO-vurdering og kildekritikk. Ingen annonse- eller katalogendringer ble utført.

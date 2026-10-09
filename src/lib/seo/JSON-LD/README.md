# Produktdata for JSON-LD

`src/app/produkter/[handle]/layout.tsx` rendrer én JSON-LD-blokk via
`ProductJsonLD.tsx` og `buildProductPageJsonLd` i `buildProductJsonLd.ts`.
Blokken inneholder en `@graph` med produktet og `BreadcrumbList` fra samme
`productBreadcrumbs` som den synlige navigasjonen. Produkter med flere varianter
bruker `ProductGroup` med ett `Product` per aktuell Shopify-variant. Stapper
bruker ett `Product`. Alle variantlenker forhåndsvelger riktig variant.

Produktfilene i undermappene er manuelt redigerbare øyeblikksbilder. Rendererens
kilder er:

- Shopify-dataene som produktsiden bruker: varianter, navn, SKU/GTIN, alternativer,
  pris, førpris og tilgjengelighet.
- Produktsidens innhold og galleri: beskrivelse og bilder.
- Judge.me-kilden som produktsiden bruker: offentlige omtaler og samlet vurdering.
  Historiske omtaler brukes ikke dersom kilden er utilgjengelig.
- Produktfilene her: materiale, kategori, målgruppe, egenskaper og variantens
  vekt, mål og `colorSwatch`. Variantfakta kobles med `productID`, ikke rekkefølge.
  `colorSwatch` må være en offentlig bilde-URL.
- `productPolicies.ts`: frakt- og returvilkår for dagens seks produkter, med
  `src/app/frakt-og-retur/page.mdx` som kilde. Nye varianter arver vilkårene uten
  å være avhengig av et manuelt variantøyeblikksbilde. Fraktprisen beregnes fra
  aktuell enhetspris: 99 kr under 999 kr, ellers gratis, for NOK til Norge.
  Håndteringstid er fortsatt udokumentert og utelates.

Endringer i snapshot-feltene `price`, `availability`, `aggregateRating`, `review`,
`name`, `description` og `image` overstyrer derfor ikke den renderte JSON-LD-en.
Oppdater den respektive kilden når disse skal endres. Nye varianter hentes automatisk,
men trenger en oppføring med korrekt `productID` her for ekstra manuelle fakta.
Nye produktfamilier trenger en egen gjennomgang av vilkårene før de tas inn i
`productPolicies.ts`. Importør, produsent og logo fra TechDown-utkastet publiseres ikke
uten verifisering.

`productMetadata.ts` lager canonical, Open Graph og Twitter-metadata fra den
samme produktkilden. Delingsbildet følger standardvalget på familie-canonical.
Validering av eksplisitte variantparametere beholdes i `generateMetadata`.
Synlig lagerstatus og JSON-LD deler nå `productAvailability`.

Avklaring før full publiseringsgodkjenning: Svale har egen beskrivelse, men deler
fortsatt TechDowns accordion. Bekreft at disse detaljene gjelder Svale mot
produktdokumentasjon. ZIP-rapportens tidligere konflikt om TechDowns innerfôr
er ikke lenger til stede: både synlig innhold og JSON-LD oppgir polyester.
Se `docs/seo/product-seo-review.md` for denne gjennomgangens verifikasjon.

Retningslinjer: [Google produktvarianter](https://developers.google.com/search/docs/appearance/structured-data/product-variants)
og [Next.js JSON-LD](https://nextjs.org/docs/app/guides/json-ld).

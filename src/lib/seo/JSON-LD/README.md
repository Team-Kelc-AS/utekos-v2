# Produktdata for JSON-LD

`src/app/produkter/[handle]/layout.tsx` rendrer én JSON-LD-blokk via
`ProductJsonLD.tsx` og `buildProductJsonLd.ts`. Produkter med flere varianter
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
- Tilbudet i produktfilen: frakt- og returvilkår. Fraktprisen beregnes fra aktuell
  enhetspris etter dagens regel: 99 kr under 999 kr, ellers gratis, for NOK.

Endringer i snapshot-feltene `price`, `availability`, `aggregateRating`, `review`,
`name`, `description` og `image` overstyrer derfor ikke den renderte JSON-LD-en.
Oppdater den respektive kilden når disse skal endres. Nye varianter hentes automatisk,
men trenger en oppføring med korrekt `productID` her for ekstra manuelle fakta og
frakt-/returvilkår. Importør, produsent og logo fra TechDown-utkastet publiseres ikke
uten verifisering.

Retningslinjer: [Google produktvarianter](https://developers.google.com/search/docs/appearance/structured-data/product-variants)
og [Next.js JSON-LD](https://nextjs.org/docs/app/guides/json-ld).

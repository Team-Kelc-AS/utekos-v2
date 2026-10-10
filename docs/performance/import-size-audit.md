# Importstørrelser – 9. oktober 2026

Målt lokalt med installert Next.js 16.3.8 og Turbopack. Ikke publisert.
Råverdier ligger i [import-size-measurements.json](./import-size-measurements.json).

## Implementert

- Direkte serverimporter for `connection`, `NextResponse`, runtime-bruk av
  `NextRequest`, `cacheLife`, `cacheTag`, `io`, `cookies` og `headers`.
  Rene typeimporter trenger ingen runtime-optimalisering.
- Direkte importer for `notFound`, `permanentRedirect` og `unstable_rethrow`.
- `geolocation` og `ipAddress` via den eksporterte inngangen
  `@vercel/functions/headers`.
- Ønskelisteknappen importerer ikke lenger Base UI PreviewCard. Den enkle
  teksten «Legg i ønskeliste» bruker en liten, separat tooltip med portal,
  250 ms forsinkelse, fokus-/hover-støtte og Escape. Farger, skrifttype,
  `opsz: 120`, vekt 500 og tekst er beholdt. Dialogen lastes fortsatt ved klikk.

Next-stiene under `next/dist` er interne, versjonsavhengige innganger.
De målte funksjonene/klassene var identiske med de offentlige eksportene i
installert versjon. Kontroller stier, typer, bygg og runtime på nytt ved oppgradering.
Bruk serverutgavene av `io`, `cookies` og `headers` bare i serverkode.

## Kontrollert rutemåling

`pnpm exec next experimental-analyze --output` ble kjørt før og etter å ha
slått bare oppgavens endringer av/på. Tabellen summerer genererte JS-deler
fra `analyze.data`, separat for server og klient, inkludert asynkrone moduler.
Den er ikke en måling av første sidelasting, overført gzip, CPU eller responstid.
Delte moduler betyr at besparelsene ikke skal summeres på tvers av ruter.

| Rute | Mindre server-JS | Mindre klient-JS |
| --- | ---: | ---: |
| Proxy (`/middleware`) | 936 829 B | – |
| `/api/search-index` | 46 753 B | – |
| `/api/cart` | 60 862 B | – |
| `/produkter` | 194 565 B | 120 713 B |
| `/produkter/[handle]` | 152 745 B | 72 646 B |
| `/produkter/hytte` | 81 739 B | 8 353 B |

Ingen klientrute økte i denne sammenligningen. Arbeidskopien ble formatert
parallelt. Den kontrollerte baseline inkluderte formateringen; under ettermålingen
ble `IntersportAnimation.tsx` endret igjen. Derfor brukes ikke forsiden som
primært bevis i tabellen.

Som en separat, ikke fullstendig isolert kontroll var alle produserte
`.next/static/**/*.js` samlet 5 337 B større etter endringen, mens serverfilene
var 423 375 B mindre. Oppdeling og deling mellom ruter gjør at samlet filstørrelse
for hele nettstedet og importert kode per rute er forskjellige mål.

## Ønskeliste: isolert avhengighetsmåling

esbuild, minifisert ESM med kodeoppdeling. React, React DOM, `next/dynamic`
og CSS er holdt utenfor begge målingene. Gzip er summert per generert fil.
Dette er ikke samme mål som redaktørens røde importestimat, som inkluderer
delte avhengigheter.

| Lastetrinn | Før | Etter |
| --- | ---: | ---: |
| Innledende kode | 131 609 B | 8 754 B |
| Innledende gzip | 48 570 B | 3 695 B |
| All kode, også utsatte deler | 142 418 B | 21 120 B |
| All gzip, også utsatte deler | 53 039 B | 8 974 B |

Kjør `node scripts/performance/check-wishlist-budget.mjs` for regresjonskontroll.
Grensene er 5 000 B initial gzip og 10 000 B totalt i denne isolerte målingen.

## Undersøkt og beholdt

- `next/link`: direkte App Router-import reduserte noe serverkode, men den
  interne TypeScript-deklarasjonen manglet vanlige ankerprops og krevde `ref`.
  Forsøket ble reversert. Ingen casting for å skjule kontraktfeilen.
- `lucide-react`: Next optimaliserer allerede pakken som standard.
- Base UI bruker allerede komponentinnganger. Motion bruker `motion/mini`,
  Cheerio bruker `cheerio/slim`, og PDF-visningen lastes dynamisk.
- `optimizePackageImports` for Google-/Zod-pakkene utløste en intern Turbopack-
  feil i `next-api/src/nft.rs`. Forsøksinnstillingen ble fjernet.

## Verifikasjon

- Produksjonsbygg og TypeScript bestod.
- 88 relevante kontrakttester og 11 proxy-/gatewaytester bestod.
- ESLint på berørte filer og ønskelistebudsjettet bestod.
- Nettleser: hover, flytting til tooltip, Escape, tastaturaktivering, dialog,
  fokusretur og ett lagret element ved gjentatt klikk. Testet på 1440 og 390 px.
- Tooltip lå innenfor viewport; faktisk CSS var `#012622`, `#f0eee9`,
  `font-variation-settings: "opsz" 120`, `font-weight: 500`.
- Lokale HTTP-kall bekreftet 404 for `/produkter/hytte?page=0` og 308 til
  `/produkter/hytte` for `?page=1`.

## Kilder

- Versjonsmatchet dokumentasjon i `node_modules/next/dist/docs/`, funnet via
  Next Devtools MCP. [Next: pakkeanalyse](https://nextjs.org/docs/app/guides/package-bundling).
- [React: portal](https://react.dev/reference/react-dom/createPortal) for å
  plassere tooltip utenfor kortets klipping.
- [WAI: tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) for fokus,
  Escape, hover og `aria-describedby`.
- Base UI 1.8.0s dokumentasjon og eksportkart ble kontrollert via Context7
  og den installerte pakken. Utekos Docs-søket ga ingen treff for importoptimalisering.

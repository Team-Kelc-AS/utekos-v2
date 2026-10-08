# Header: implementasjon og lokal verifikasjon

Kontrollert 8. oktober 2026. Lokale endringer på `main`; ikke publisert.

## Komponentgrenser

`Header` er `server-only` og setter sammen logo, lenker, ikoner og menyinnhold.
`HeaderMenu`, `HeaderSearch` og `ProductCategories` er små klientinnganger.
De laster henholdsvis `MenuDialog`, `SearchDialog` og `CategoryCombobox` med
`React.lazy` først ved åpning. Menyinnhold og ikoner sendes fra serveren som
ReactNode-props; de importeres ikke inn i de interaktive komponentene.

Combobox bruker eksisterende shadcn/Base UI-komponenter. Den generelle triggeren
har fått et valgfritt `showIcon` (standard `true`), slik at Header kan bruke
original `CaretDownIcon` uten et ekstra Lucide-ikon. Menypanelet bruker Base UI
Dialog for modalitet og fokus. Native `details` håndterer kategoriene i panelet.
CSS gjenskaper panelovergangen og den forskjøvede inn-animasjonen fra headless.
En eksplisitt CSS-animasjon håndterer første åpning: Base UI animerer ikke en
dialog som monteres med `defaultOpen` via sin vanlige startovergang.

Primary og sidebar-primary er `oklch(0.5376 0.156 43.96)` i begge temaer,
med `#f0eee9` som primary-foreground. Avviket i Os Caravan-temaet er normalisert.

## Søkegrensesnitt

Header har et eget skrivefelt utenfor produktnavigasjonen. «Søk»-etiketten er
visuelt skjult for skjermleserstøtte; teksten over feltet er fjernet etter avklaring.
Enter eller søkeikonet åpner den utsatte resultatdialogen med teksten fra feltet.
Ved lukking returneres fokus til Header-feltet. På smale skjermer ligger feltet
på en egen rad under logo, handlekurv og Meny. Kategorifilteret i Produkter
filtrerer fortsatt bare de seks kategoriene, som spesifisert i planen.

`GET /api/search-index` returnerer `{ groups: [{ label, items }] }`, med gruppene
`Produkter` og `Sider`. Elementer har `{ title, href, keywords }`.
Shopify-leseren følger alle cursor-sider, avviser manglende/gjentatte cursors og
dedupliserer produkt-håndtak. Eksisterende produktnavn, kategorier, artikkelregister
og offentlige informasjonssider brukes. Serveren validerer resultatet med Zod.

Indeksbyggeren bruker `cacheLife("minutes")` og eksisterende Shopify-tagger.
Ruten venter på `connection()` og har `Cache-Control: no-store`: den validerte
indeksen caches, ikke en feilrespons under et driftsavbrudd. Feil gir HTTP 503.
Klienten deler pågående forespørsler og beholder vellykket indeks i fem minutter.
Det er ingen polling eller forespørsel per tastetrykk.

## Observerte kontroller

- Målrettet ESLint: bestått uten advarsler. TypeScript: bestått.
- `node --test tests/header-search.test.cjs`: 6 av 6 bestått. Dekker filtrering,
  rangering, paginering, duplikater, cursor-/providerfeil, offentlige destinasjoner,
  kanoniske produktnavn, HTTP 503 og femminutters klientcache.
- `pnpm run build`: exitkode 0; alle 51 statiske genereringer fullført.
  `/api/search-index` er en dynamisk rute med separat datacache.
- Lokalt endepunkt: HTTP 200, seks produkter og 24 sider.
- Chrome på eksisterende lokal dev-server: Header og menypanel kontrollert ved
  320, 390, 768, 1024, 1280 og 1440 px uten horisontal overflow. Panelbredde
  320 px på smaleste skjerm, ellers 384 px. Søkepanel på 320 px er 288 px bredt
  og holder seg innenfor skjermhøyden.
- Tastaturvalg i Combobox navigerte til `/produkter/hytte`. Escape returnerte
  fokus til produktpilen. Menyen lukket ved lenkenavigasjon, Escape og
  bakgrunnsklikk. Fokusfelle, fokusretur og gjenopprettet scrolling kontrollert.
- Søket fant både TechDown og artikler. Ingen treff vises for ukjent søketekst.
  Midlertidig blokkering av indeksforespørselen ga feilmelding; `Prøv igjen`
  gjenopprettet resultatene. Skriving og gjenåpning ga ingen ekstra forespørsel.
  Nettverksblokkering, bevegelsesemulering og viewport-overstyringer ble fjernet.
- Etter presiseringen om eget Header-felt: Enter med `techdown` åpnet dialogen
  med samme tekst og fire treff; søkeikonet med `zzzxqv` ga «Ingen treff».
  Escape returnerte fokus til Header-feltet. Alle seks skjermbredder ble målt
  på nytt uten overflow, med synlig felt også ved 320 px. Mobilmenyen ble åpnet
  og lukket. Lint, TypeScript, seks søketester og produksjonsbygg ble kjørt på nytt.
- Redusert bevegelse gir ingen meny-animasjon og overgangstid 0 s.
- Visuell referanse kontrollert på utekos.no, sammenholdt med lokal headless-kode:
  venstrepanel 384 px og 200 ms overgang. V2 bruker avtalte egne lenker og ikoner.
  Beregnede inn-forsinkelser i v2: 320/375/430/485 ms, alle med 550 ms varighet.

### Uavklart byggefeil

Bygget fullførte, men logget `Unexpected cache miss after cache warming phase`
fra `StockedProducts.tsx:27` / `getProductCards()`. Disse filene er ikke endret i
Header-arbeidet. Årsaken er ikke fastslått, og baseline-analysen alene beviser ikke
at feilen også forekom før endringene. Dette er ikke et feilfritt byggresultat.

## Bundle-observasjoner

Målt med Next.js 16.3.8 `next experimental-analyze --output` før og etter.
Tallene summerer analyzerens output-moduldeler på `/om-oss` for de synkrone
avhengighetene fra Header sine klientinnganger. Delte runtime-moduler inngår
i importgrafen; dette er ikke overførte nettverksbytes eller en lastetidsmåling.

| Måling | Før | Etter |
| --- | ---: | ---: |
| Header sine egne synkrone TSX-moduler | 3 587 bytes | 3 362 bytes |
| Synkron JS-importgraf, inkludert delt runtime | 21 434 bytes | 14 022 bytes |
| CSS i samme graf | 3 312 bytes | 9 305 bytes |

Den synkrone grafen inneholder ikke Motion, React Query, Shopify-lesere,
søkeindeksen eller de tre utsatte interaksjonsmodulene. De nye funksjonene har
ytterligere kode som lastes ved bruk; tallene innebærer ikke at all kode for hele
nettstedet er blitt mindre. Nettleserkontrollen viste ingen indeksforespørsel ved
første sidelasting.

Faglig grunnlag: installert Next.js-dokumentasjon i `node_modules/next/dist/docs`,
[server-/klientgrenser](https://nextjs.org/docs/app/getting-started/server-and-client-components),
[shadcn Combobox](https://ui.shadcn.com/docs/components/base/combobox) og
[shadcn Sheet](https://ui.shadcn.com/docs/components/base/sheet).

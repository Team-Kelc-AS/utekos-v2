# Produktkort på forsiden

Lokalt implementert 6. oktober 2026. Ikke publisert.

`HomeProducts` ligger mellom Hero og filmen i `src/app/page.tsx`. Produktdata og
kortinnhold rendres på serveren. Kortkomposisjonen, mobil-/desktop-headeren og
kjøpsknappen er flyttet fra `../utekos-headless/src/components/ProductCard/` og
bruker prosjektets shadcn Card, CardContent, CardHeader, CardTitle, CardFooter og
Button. Headless-knappens checkout-stiler ligger lokalt på ProductCardFooter.
Karusellen bruker prosjektets shadcn `Carousel`, `CarouselContent`, `CarouselItem`,
`CarouselPrevious` og `CarouselNext`, bygget på installert Embla 8.6.0. Shadcn tar
hånd om dra-/tastaturnavigasjon og deaktiverte piler ved start og slutt.

Hvert kort har en fast Shopify-variant, variantbilde, pris og produktlenke.
Størrelse og farge er etiketter, uten velgere. Bare `availableForSale: true` og
`currentlyNotInStock: false` slipper gjennom. Alle produktsider og variantlister
pagineres; lagerdata bruker Next `cacheLife('seconds')` og feil blir ikke lagret
som en tom produktliste.

Rekkefølgen er Svale (Middels, Stor, Større), TechDown (Middels, Stor, Større),
Mikrofiber og Comfyrobe. Ti varianter var på lager ved kontrollen. Karusellen viser
1,5 kort under 768 px, 2,5 fra 768 px og 4 fra 1280 px. Kort og seksjon bruker
`font-sans`, Google Sans Flex med verifisert 120pt-variant (`opsz=120`), Medium
500 og ExtraBold 800. Bildene beholder originalt sideforhold uten object-cover
eller hover-zoom. Ved 320 px er innvendig avstand redusert slik at Klarna får sin
minste knappebredde på 150 px.

Bare bildeflaten på Svale-kortene bruker `--moonstruck`. Produktinformasjon og
knapper har fortsatt mørkegrønn bakgrunn og lys tekst. Kortene følger sin egen
innholdshøyde: ingen `h-full`, voksende header eller `mt-auto` på knappedelen.
Avstanden fra variantinformasjon til første kjøpsknapp er 12 px på mobil og
16 px på nettbrett/desktop.

De tre Svale-kortene har en play-knapp som erstatter bildet med hver sin video:

- Bilde 1: `https://cdn.shopify.com/videos/c/o/v/ad55c3a3299e4a4281def7afcac9caff.mp4` (5,653 sekunder).
- Bilde 2: `https://cdn.shopify.com/videos/c/o/v/a3ccb83777684e6e8576a79088d69beb.mp4` (6,677 sekunder).
- Bilde 3: `https://cdn.shopify.com/videos/c/o/v/edc5f94b8a434dd896f0282e9b92dc52.mp4` (11,712 sekunder).

Utekos TechDown™ Stor bruker
`https://cdn.shopify.com/videos/c/o/v/16f45a8826d04c18b41fc29e94212a5b.mp4`
(10,602 sekunder), koblet til produkt og størrelse uavhengig av kortets plassering.

Utekos TechDown™ Middels og Større bruker begge
`https://cdn.shopify.com/videos/c/o/v/b7ad5aa6e5b749e18f1b9c8a47180e5a.mp4`
(5,504 sekunder), også koblet til produkt og størrelse.

Alle fem videoenes metadata er verifisert til 1440 × 1800. Kilden settes
først ved trykk; videoen vises uten beskjæring. Alle kortvideoer spilles uten
synlige avspillingskontroller, tidslinje eller sekundvisning. Ved `ended`
vises bildet og play-knappen igjen. Escape eller avspillingsfeil viser også
bildet. Faktisk avspilling og retur er kontrollert på desktop og mobil, sammen
med null videoforespørsler før trykk og simulert avspillingsfeil.

### Samme videoer på produktsidene

`src/lib/products/variantVideos.ts` knytter videoene til produkt og størrelse
for både produktkort og produktsider. Svale bruker dermed størrelsen direkte,
også når en annen størrelse mangler fra listen over lagerførte kort.

Produktsidens første galleribilde får samme play-knapp og avspiller i eksisterende
desktop-visning (fra 768 px). Mobilgalleriet beholder bildene. Ingen video lastes
før trykk. Ved størrelsesbytte eller overgang til mobilvisning stoppes videoen
og kilden ryddes bort. Bildet kommer tilbake etter avspilling.

Kontrollert lokalt: riktig video for alle seks Svale-/TechDown-varianter,
størrelsesbytte under avspilling, retur til bilde, skjulte avspillingskontroller,
mobilvisning og desktop-grensen. ESLint, TypeScript, 25 eksisterende produkt-
og varianttester og produksjonsbygg (45 ruter) bestod. Eksisterende varsel om
Google Sans Flex-fallback gjenstår. Ikke publisert.

## Klarna via eksisterende headless

Brukeren har valgt eksisterende betalingsbackend. Klienten bruker samme ekte
Klarna Payments Buttons SDK som headless, `theme: default`, `shape: pill`,
`locale: nb-NO`, 40 px høyde på mobil og 48 px fra 768 px. SDK og offentlig
konfigurasjon lastes først når knappen nærmer seg synsfeltet.

- `/api/klarna/client-config` leser offentlig konfigurasjon fra headless.
- `/api/klarna/prepare` legger kortets faste variant i v2-kurven og bygger et
  autorisasjonsgrunnlag fra ferske Shopify-data. Betalingen omfatter hele kurven,
  slik den eksisterende headless-flyten gjør.
- `/api/klarna/orders` kontrollerer origin, HttpOnly-kurvens eierskap og ferske
  priser/linjer før den videresender til eksisterende headless. Kun den nødvendige
  `cartId`-cookien videresendes. Den hemmelige kurvnøkkelen sendes ikke til klienten.
- Headless beholder ansvar for ordreoppretting, automatisk capture, Shopify-ordre,
  varsler og bekreftelsesside. Ingen ny betalingsbackend er opprettet.
- Kurven låses under autorisasjon. Uklart utfall etter videresending beholder
  låsen og viser en konkret melding; det gjøres ingen automatisk betalingsretry.
- Rabatter/overstyrte priser og totaler den eksisterende backend-flyten ikke kan
  bevare, avvises med beskjed om å bruke vanlig kasse. Produktets ordinære salgspris
  (inkludert en lavere pris enn compare-at-prisen) støttes.

Servervariabelen `KLARNA_HEADLESS_ORIGIN` kan angi en separat HTTPS-origin;
standard er `https://utekos.no`. Selvhenvisning blokkeres. Før v2 eventuelt overtar
utekos.no, må headless få en separat, fortsatt tilgjengelig backend-origin og
variabelen settes til den. Klarna krever også at integrasjonens origin er tillatt
i Partner Portal. Disse produksjonsendringene er ikke utført.

Offisiell dokumentasjon: [Klarna One-step Express Checkout](https://docs.klarna.com/acquirer/klarna/express-checkout/integrate-express-checkout/integrate-one-step-express-checkout/),
[Shopify ProductVariant 2026-10](https://shopify.dev/docs/api/storefront/2026-10/objects/ProductVariant)
og installerte Next.js 16.3.8-guider i `node_modules/next/dist/docs/`.

## Verifisert lokalt

- 47 relevante tester passerte: lager/paginering, rekkefølge, variantlenker,
  betalingsbro, eierskap, prisendringer, rabatter, feilutfall og delt kurvlås.
- TypeScript, fokusert ESLint, `git diff --check` og produksjonsbygg passerte.
  Bygget har den eksisterende advarselen om fallback-metrikker for rotlayoutens
  Google Sans Flex; kortenes faktiske font ble kontrollert i nettleseren.
- Nettleser: 320, 390, 834, 1024 og 1440 px. Målt henholdsvis 1,5/1,5/2,5/2,5/4
  kort, ingen størrelsesvelgere, ingen horisontal sideoverflow. Shadcn data-slot,
  font, opsz, runde knapper og ekte Klarna-knappens shadow DOM er kontrollert.
- Karusellpil og tastaturpil flytter listen. Produktlenken åpnet nøyaktig
  Svale Middels. Et klikk med mock av cart POST sendte variant
  `67548601123064`, handle `utekos-svale`, antall 1.
- Lokal konfigurasjonsrute returnerte gyldig produksjonskonfigurasjon fra headless.
  Shopify-verktøyet validerte kurvens GraphQL-spørring.

Ingen virkelig Klarna-autorisasjon, ordre eller belastning er gjennomført.
Knappvisning og mocktester beviser ikke en fullført betaling.

Etter byttet til shadcn Carousel er kortbreddene kontrollert på nytt ved alle fem
bredder. Pil og tastatur flytter til riktig slide, og neste-pilen deaktiveres ved
siste posisjon. TypeScript, fokusert ESLint og produksjonsbygg passerte igjen.

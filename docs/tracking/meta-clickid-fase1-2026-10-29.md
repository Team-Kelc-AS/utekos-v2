# Meta ClickID og dataferskhet, fase 1 — 29. oktober 2026

## Status og bevisgrense

Dette er en avstemming av produksjonskjeden, den avgrensede releasen og
senere lokale funn. Hvert målevindu er oppgitt særskilt. SQL- og
provideravlesningene beviser ikke at Meta har mottatt en ny lokal retting, at
alle hendelser er klassifisert «Real Time», eller at Events Manager-prosentene
har endret seg. Ingen testhendelser, replay eller providerendringer inngår i
undersøkelsen.

Brukerens lokale `email/event-manager.md` er behandlet
som en avlesning: PageView 33,19 % «Percentage of events sending ClickID» og
«Hourly»; ViewContent 39 % og «Hourly»; AddToCart 15 % og «Real Time»;
InitiateCheckout 13 % og «Real Time». Utdraget gjentar enkelte volumer under
flere hendelsesnavn, så de tallene brukes ikke som en felles SQL-nevner.
Den lokale `Markdown/click_id_fbp_fbc.md` er kildemateriale, ikke en ny
instruks eller autorisasjon. Den beskriver fangst
fra URL, første observasjonstid i `_fbc`, 90 dagers cookie og sending av
`fbc`/`fbp` når verdiene finnes.

Kildeperioden for SQL-tallene nedenfor er **14. oktober 2026 kl. 00:00 UTC til
29. oktober kl. 00:00 UTC**, filtrert på `created_at` i prosjekt
`hkoawfbomhnzupcsdggb`. Dette er 15 hele UTC-døgn. Metas kvalitetssnapshot
har eget målevindu; det skal ikke settes lik denne SQL-perioden.

## Kjede fra landing til Meta

| Ledd | Gjeldende mekanisme | Hva som er kontrollert |
| --- | --- | --- |
| Next 16-dokumentforespørsel | `proxy.ts` matcher HTML-navigasjon, leser `request.nextUrl.searchParams`, bruker Node Parameter Builder og setter `_fbc`/`_fbp` i både videresendt request og respons. | Installert Next 16.4.3-dokumentasjon og lokalt syntetisk dokumentkall. `next.config.ts` sine `redirects` kjøres før Proxy; Next-dokumentasjonen sier at requestens queryverdier videreføres i redirect. Klientnavigasjon/RSC håndteres av nettleserens SDK/kanoniske runtime. |
| Nettleserens første PageView | Meta Parameter Builder kjøres før kanonisk dispatch og Pixel. Runtime venter innen sin avgrensede SDK-frist; fallback har egen frist. | I lagret produksjonskilde hadde alle 4 473 PageViews med `fbclid` i URL også `fbc`. URL-klikket forsvinner derfor ikke generelt før første PageView i denne kohorten. |
| Senere nettleserhendelser | Enricher leser SDK/cookies og leverer samme kanoniske identitet til Pixel og collector. | 214 konkrete PageView → `view_item`-par skiftet **full `_fbc`**, selv om rått `fbclid` var likt. Dette er en faktisk kontinuitetsfeil. |
| Collector og Meta-outbox | Backend lagrer kanonisk payload og mapper `browser_id.fbc` til Meta Business SDK `UserData.setFbc`. | For PageView er 6 458/6 458 lagrede `fbc` uendret i Meta-forsøksraden. 10 876/10 878 forsøk har HTTP 200 og `accepted_unverified`; dette er API-aksept, ikke endelig Meta-attribusjon. |
| Parallell GTM-rute | Web-GTMs Data Tag sender til Data Client i server-GTM; v45-eksporten har bare GA4 som aktiv tagg. | Global tillatelsesliste beholder `fbc`/`fbp` bare som egne hendelsesfelt. Web Data Tag sender dem ikke eksplisitt, og Data Client-malen mapper ikke `_fbc`/`_fbp`-cookies til disse feltene. Brukeren bekreftet at v45 er i produksjon; faktisk utgående GA4-data er ikke avlest. |
| Meta-mottak | Events Manager og Dataset Quality rapporterer egne mål og flere kilder. | Mismatch mellom egen CAPI og Metas aggregering består. Eksakt avsender, deduplisering og effekt på ClickID-prosenten er ikke fastslått. |

[Next Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy),
[Next redirect-rekkefølge](https://nextjs.org/docs/app/guides/redirecting) og
[Next redirect-query](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects)
er kontrollert mot installerte Markdown-kopier under `node_modules/next/dist/docs/`.
`next.config.ts` inneholder faste SEO-redirects, `cacheComponents`,
`partialPrefetching` og feed-rewrites. Ingen av disse er endret i denne saken.
`proxy.ts` importerte `NextResponse` fra en privat `next/dist/...`-sti; dette
er nå endret lokalt til dokumentert `next/server`.

## Produksjonsmåling

| Mål i egen PageView-kjede | Antall/verdi |
| --- | ---: |
| Kanoniske PageViews | 10 878 |
| Med `browser_id.fbc` og rått `click_id.fbclid` | 6 458 |
| Med `fbclid` i URL | 4 473 |
| Med URL-`fbclid`, men uten `fbc` | **0** |
| Meta-outbox-forsøk for disse PageViews | 10 878 |
| HTTP 200, `accepted_unverified` | 10 876 |
| `fbc` endret mellom ledger og Meta-forsøksrad | **0** |
| Hendelsestid → start på Meta-forsøk, median / p95 | 1,10 s / 5,97 s |

Slik gjentas hovedkontrollen, med samme `created_at`-vindu på begge tabeller:

```sql
WITH p AS (
  SELECT event_id, occurred_at, payload
  FROM marketing.event_ledger
  WHERE event_name = 'page_view'
    AND created_at >= '2026-10-14T00:00:00Z'
    AND created_at <  '2026-10-29T00:00:00Z'
), a AS (
  SELECT event_id, payload, status, http_status, last_attempt_started_at
  FROM ops.provider_dispatch_attempts
  WHERE provider = 'meta' AND event_name = 'page_view'
    AND created_at >= '2026-10-14T00:00:00Z'
    AND created_at <  '2026-10-29T00:00:00Z'
)
SELECT count(*) AS pageviews,
  count(*) FILTER (WHERE nullif(p.payload #>> '{browser_id,fbc}', '') IS NOT NULL) AS with_fbc,
  count(*) FILTER (WHERE p.payload->>'page_url' ILIKE '%fbclid=%') AS with_url_fbclid,
  count(*) FILTER (WHERE p.payload->>'page_url' ILIKE '%fbclid=%'
    AND nullif(p.payload #>> '{browser_id,fbc}', '') IS NULL) AS url_click_without_fbc,
  count(*) FILTER (WHERE a.status = 'accepted_unverified' AND a.http_status = 200) AS accepted_unverified,
  count(*) FILTER (WHERE nullif(p.payload #>> '{browser_id,fbc}', '') IS NOT NULL
    AND a.payload #>> '{browser_id,fbc}' IS DISTINCT FROM p.payload #>> '{browser_id,fbc}') AS changed_at_outbox
FROM p LEFT JOIN a USING (event_id);
```

Blant PageViews og **første** `view_item` med samme `page_view_id`, begge med
`fbc`, og `view_item` innen 120 sekunder etter PageView, finnes 3 280 par.
**214** har ulik komplett `fbc`, men likt rått `fbclid`. **212** av disse
skiftet også `fbp`; **213** hadde `fbclid` i PageView-URL. Dette er
observasjonskohorten, ikke alle besøk. Fbc-klikkdelen forsvant ikke i parene;
alle 214 beholdt klikkdelen og skiftet opprettelsestidsstempel. Ofte ble
også browser-ID-en erstattet. I de endrede
parene var PageView-verdiene normalt allerede til stede før PageView-eventtid.

Reproduserbart parutvalg, med samme 15-dagers `created_at`-vindu som over:

```sql
WITH p AS (
  SELECT event_id, occurred_at, payload
  FROM marketing.event_ledger
  WHERE event_name = 'page_view'
    AND created_at >= '2026-10-14T00:00:00Z'
    AND created_at <  '2026-10-29T00:00:00Z'
), v AS (
  SELECT event_id, occurred_at, payload
  FROM marketing.event_ledger
  WHERE event_name = 'view_item'
    AND created_at >= '2026-10-14T00:00:00Z'
    AND created_at <  '2026-10-29T00:00:00Z'
), paired AS (
  SELECT p.payload AS pp, v.payload AS vp,
    row_number() OVER (PARTITION BY p.event_id ORDER BY v.occurred_at, v.event_id) AS rn
  FROM p JOIN v ON v.payload->>'page_view_id' = p.payload->>'page_view_id'
    AND v.occurred_at >= p.occurred_at
    AND v.occurred_at < p.occurred_at + interval '120 seconds'
  WHERE nullif(p.payload #>> '{browser_id,fbc}', '') IS NOT NULL
    AND nullif(v.payload #>> '{browser_id,fbc}', '') IS NOT NULL
)
SELECT count(*) AS paired_pages,
  count(*) FILTER (WHERE pp #>> '{browser_id,fbc}'
    IS DISTINCT FROM vp #>> '{browser_id,fbc}') AS changed_fbc,
  count(*) FILTER (WHERE pp #>> '{browser_id,fbc}'
    IS DISTINCT FROM vp #>> '{browser_id,fbc}'
    AND pp #>> '{click_id,fbclid}' = vp #>> '{click_id,fbclid}') AS changed_same_click
FROM paired WHERE rn = 1;
```

Produksjonslogger for tre av de endrede PageViews viste
`cookies_to_set: []`, `has_fbc: true`, `has_fbp: true` og
`has_click_id: true`. De tre prøvene peker bort fra at collector mintet en ny
cookie ved PageView, men identifiserer ikke hvilket nettleserskript som senere
fjernet eller skrev over cookieverdiene.

En lokal test med faktisk installert Meta Parameter Builder gjenskapte
mekanismen: Etter at første PageView har full `fbc`, kan en slettet cookie
remintes med **samme klikk og nytt tidsstempel** (`AQQCAQMC` → `AQYCAQMC`).
Uten bevaring av første komplette verdi får senere hendelser en annen `fbc`.
Dette er en dokumentert mekanisme, ikke en bevist identitet for aktøren i alle
214 produksjonsparene.

Et separat URL-segment viser et tidligere tap som cookie-rettingen ikke kan
skape en verdi for: 4 231 PageViews hadde `utm_source` lik `fb`, `ig`,
`facebook`, `instagram` eller `meta`. **4 158** hadde `fbc`; **73** manglet
`fbc`. Alle 73 hadde markedsføring `granted` og `fbp`, men verken `fbclid` i
side-/kilde-URL, rått `click_id.fbclid` eller en avlest tidligere `fbc` for
samme `external_id` eller `fbp` innen dette 15-dagersvinduet. Fem hadde
Facebook/Instagram i referrer. 52 hadde eksplisitt `ad_id` i URL fordelt på
12 annonser; de samme 12 ID-ene hadde andre landinger med URL-`fbclid` i
vinduet. UTM/ad-ID er ikke i seg selv et Meta ClickID eller sikkert bevis på
et ad-klikk. Fraværet er likevel konkret i Meta-merket trafikk og må spores
til opprinnelig annonse-URL, redirect, appnettleser eller deling før man kan
plassere årsaken. Vi skal ikke konstruere en `fbc` fra UTM/ad-ID alene.

Betalt Microsoft-trafikk er holdt separat: 27. oktober UTC hadde 564 PageViews
med `utm_source=bing`, 556 med `msclkid` og 0 med Meta-`fbc`; 28. oktober var
tallene 1 058, 1 056 og 0. Dette er **ikke** organisk trafikk og er heller
ikke en begrunnelse for den observerte tidsstempelfeilen. En Microsoft-ID skal
ikke gjøres om til en oppdiktet Meta-ID. Segmentet viser hvorfor en totalandel
på tvers av annonseplattformer ikke er en måling av om faktiske Meta-klikk
ble fanget.

## Meta-tall og dataferskhet

Et tidligere Meta Dataset Quality-snapshot oppga PageView
`fbc`-matchnøkkeldekning **24,7 %** og `upload_frequency: hourly`. Det siste API-feltet betyr
gjennomsnittlig **mottaksfrekvens** for hendelsestypen via CAPI. Events
Managers egen **Data Freshness**-fane beskriver derimot forsinkelsen fra
hendelsestid til Meta-mottak. Brukerens «Hourly» i den fanen må derfor tas som
et separat avvik som trenger en faktisk fordeling og kildeoppdeling; etiketten
alene beviser ikke påstanden om at omtrent halvparten av enkelthendelsene var
en time forsinket. Egen CAPI-outbox startet PageView-forsøk raskt i kohorten
over, men dette sier ikke hvor raskt hver annen kilde sendte, eller når Meta
gjorde hendelsen tilgjengelig. `fbc`-matchnøkkeldekning og Events Managers
«Percentage of events sending ClickID» er også ulike rapportmål; de må ikke
likestilles.

[Meta Dataset Quality API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api),
[Meta Events Manager-hjelp](https://www.facebook.com/business/help/2041148702652965).

Meta Events Manager-utdraget oppgir PageView browser 9 857, «Conversions API
direct» 10 362 og «Conversions API with Meta» 7 186. En separat Meta Stats
connector returnerte forskjellige PageView-servervolumer for tilsynelatende
samme UTC-vindu og ulike aggregeringsvalg (15 731 i `event_source`, 17 512 i
`SERVER_ONLY`). Metas Events Manager-hjelp beskriver «Events Received» før
behandling/deduplisering; dette er ikke samme mål som ferdig prosesserte eller
dedupliserte hendelser. Det er derfor **ikke** forsvarlig å trekke fra egen
outbox og oppgi et eksakt antall ekstra hendelser eller utpeke avsender ut fra
disse tallene. En Meta-servert Pixel-konfigurasjon avlest 29. oktober inneholdt
fortsatt `OpenBridge`-opt-in og et AWS-endepunkt, mens Metas datasettdetaljer
samtidig sa `NOT_ONBOARDED / NO_UPSELL`. [Metas Gateway-dokumentasjon](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway)
beskriver en parallell browser → gateway → CAPI-rute når gateway er aktiv.
Dermed er OpenBridge en konkret kandidat, men konfigurasjonen og den
motstridende statusen beviser ikke faktisk videresending eller at ruten står
bak UI-kategorien «Conversions API with Meta». Ingen tilgjengelig offisiell
kilde definerte akkurat dette UI-navnet. GTM-taggeier og Shopify-piksel er
ikke lest tilbake i denne kontrollen.

Stapes avleste containerforbindelser omfattet Google Data Manager og
Microsoft V2, ingen egen Meta Audience-forbindelse. Dette inventaret sier
ikke hvilke Meta-tagger som kan ligge i GTM eller om OpenBridge er aktiv.
Stapes utgående overvåking svarte HTTP 409, og gjeldende GTM-versjoner kunne
ikke leses fordi Google Tag Manager API svarte 429 (dagskvote).

## Lokal retting og kontroll

- `src/lib/analytics/enrichCanonicalEventWithMetaAttribution.ts` holder den
  første **komplette** `fbc` for samme klikk, og den første `fbp`, gjennom
  Pixel, collector, senere hendelser og hel dokumentnavigasjon i samme fane.
  En validert `sessionStorage`-kopi med 90 dagers inaktivitetsgrense
  gjenoppretter verdiene dersom
  browser-cookies forsvinner. Nytt faktisk `fbclid` i URL får prioritet.
  Gjenoppretting skjer bare ved markedsføringsgodkjent hendelse, og logger et
  identifikatorfritt resultat én gang per dokument.
- `src/proxy.ts` bruker Nexts offentlige import for `NextResponse` og
  `NextRequest`. Eksisterende capture, matcher, samtykke og response-cookie-
  regler er beholdt.
- `tests/tracking-browser.test.cjs` dekker slettet/remintet cookie før
  produktvisning i Chromium og WebKit, full dokumentnavigasjon etter
  cookie-tap og at nytt URL-klikk vinner.

Verifisering etter siste lokale endring: **74/74** nettlesertester bestått,
inkludert eksisterende sen Meta-bro, checkout, pagehide og deduplisering.
Avgrenset ESLint og TypeScript for endrede moduler bestod. Global
`tsc --noEmit` er blokkert av eksisterende feil i andre, pågående filer og
genererte `.next/types`; dette er ikke rettet innenfor denne saken.

En isolert releasekandidat i
`/private/tmp/utekos-meta-clickid-release-latest-20261029` er lagt på
gjeldende `origin/main` (`92b6cff`) med kun disse fire filene; SHA-256 for
hver fil er identisk med arbeidskopien. `CI=1 pnpm install --frozen-lockfile`,
`next typegen`, full `tsc --noEmit`, avgrenset ESLint og **74/74**
nettlesertester bestod der. Lokal `pnpm run build`
kom gjennom kompilering og TypeScript, men stoppet under innsamling av
produktdata fordi den isolerte kopien ikke har produksjonsvariabelen
`SHOPIFY_STOREFRONT_PRIVATE_TOKEN`. Vercel oppgir variabelnavnet konfigurert
for produksjon; verdien er ikke lest. Cloud-bygg og faktisk Vercel-deploy er
egne kontrollpunkter; lokal build er ikke erklært bestått.

## Åpne sluttporter

Kontinuitetsrettingen bevarer en **allerede fanget** `fbc`. Alle de 214
parene hadde fremdeles `fbc` på begge hendelser. Rettelsen alene kan derfor
ikke påstås å løfte Events Managers prosent **som sender ClickID**. Den
separate prosentforskjellen og de 73 URL-tilfellene trenger egne mottaks- og
inngangskontroller.

1. Observer nye, naturlige Meta-klikk etter den bekreftede første releasen:
   identisk full `fbc`/`fbp` fra PageView gjennom Pixel, collector,
   Meta-forsøk og senere hendelser. Den lokale neste rettingen har ennå ikke
   produksjonsmålinger.
2. Hent kildeidentitet for «Conversions API with Meta», faktisk OpenBridge-
   nettverk/videresending, GTM-taggeier og Shopify-pikseleier. GTM API ga
   429-dagskvote og Shopify-pikseloppslag manglet `read_pixels`/
   `read_server_pixels`-tilgang. Ingen blind gateway-endring er gjort.
3. Sammenlign like tidsvinduer, hendelsesnavn, kilde og definisjon hos Meta.
   Kontroller mottatt `fbc`, browser/server-event-ID, deduplisering og
   faktisk mottaksforsinkelse per avsender. HTTP 200 fra egen CAPI er ikke
   endelig Meta-mottak eller attribusjon.
4. Undersøk hvilken kode eller plattform som endrer `_fbc`/`_fbp` mellom
   første PageView og produktvisning. Den lokale bevaringen avhjelper
   konsekvensen; produksjonsaktøren er ennå ikke bevist.
5. Spor de 73 Meta-merkede PageViews uten opprinnelig `fbclid` tilbake til
   faktiske annonseklikk/redirect-kjeder. URL og historikk i vår kilde gir
   ingen ekte klikkverdi å gjenopprette for disse; annonse-ID alene er ikke nok.

Ingen av punktene over er erklært fullført av lokal test alene. Den målte
kontinuitetsfeilen er rettet i lokal kode, mens 100 % faktisk fangst/levering
og «Real Time» for hele Meta-datasettet fortsatt krever mottaksbevis.

## Etter produksjonsrelease, lokal avlesning 02:55 UTC

Denne seksjonen ble lagt til i den lokale arbeidskopien etter den avgrensede
releasen. PR #3 ble slått sammen som `f8ecc1bf29656b933111d272d5c3cfde7b91f393`.
Vercel-deployment `dpl_2haDCu5VBZWvwQNBUZWoxHnPbQJn` var `READY` fra
02:40:03 UTC, hadde samme Git-SHA og aliasene `utekos.no` og
`www.utekos.no`. En live HEAD-forespørsel til produkt-ruten svarte HTTP 200
med denne deployment-ID-en. Dette er distribusjonsbevis, ikke mottaksbevis
hos Meta.

Fra READY-tidspunktet til 02:55:18 UTC var det **15 naturlige PageViews** i
egen ledger, alle med `fbc` og ingen med nytt `fbclid` i URL. De 15
PageViews hadde én distinkt pseudonym `external_id`; utvalget viser ikke
15 uavhengige kunder. Alle 15 tilhørende Meta-forsøk hadde `fbc` og HTTP 200
`accepted_unverified`; median hendelsestid til forsøksstart var **0,51 s**.
Innen fem minutter etter en PageView hadde 30 `scroll_depth`, to
`view_promotion` og én `view_item_list` samme `page_view_id`. **33/33**
beholdt komplett `fbc` og `fbp`. Det kom ingen `view_item`, ingen ny
Meta-landing med `fbclid`, og vi kan ikke fastslå om nettleserfanen ble
åpnet før eller etter deploy. Denne observasjonen verifiserer derfor ikke
rettingens effekt på nyklikk eller den opprinnelige
PageView → produktvisning-feilen.

Metas datasettdetaljer hadde `last_fired_time` og `server_last_fired_time`
02:49:20 UTC, fire sekunder etter en egen `scroll_depth`-hendelse. Dette
er tidsmessig forenlig med egen trafikk, men knytter ikke et spesifikt
event-ID til Meta-mottak. Meta Stats ga tomt svar for 02:40:03–02:55:00 UTC,
selv om egen CAPI hadde HTTP 200. Events Managers ClickID-prosent og
Data Freshness kan derfor ikke erklæres forbedret etter 15 minutter.

Ytterligere kildeavstemming: Den faktisk publiserte Stape/GTM-klientfilen
fra `/__sgtm` inneholdt 15 tagger, hvorav 10 var pauset. De aktive taggene
var Google, Microsoft og Stape Data Tag samt en Bing-bildeforespørsel;
ingen aktiv Meta-nettlesertagg var synlig. Data Tag sendte til
`/__sgtm/data`. Dette sier ikke hvilke server-GTM-tagger som kjører.
En ny HTTP 200-avlesning av den publiserte web-containeren (versjon 175,
29. oktober kl. 04:33:58 UTC) viser at Data Tag har
`add_common_cookie: false`, `add_data_layer: false` og ingen eksplisitte
`fbc`-, `fbp`- eller `fbclid`-felt i Event Data-listen. Listen inneholder
`event_id`, `event_time`, `page_view_id`, `page_location`, `page_referrer`,
`page_title`, `event_source`, `client_id`, `session_id`, `currency`, `value`,
`items`, `search_term`, `audience` og `transaction_id`.
Ingen av de 15 kompilerte taggoppføringene, 43 makroene, 12 predikatene eller
12 reglene nevner disse identifikatorene eksplisitt; de 10 pausede taggene
er kun representert som `__paused` i den publiserte klientfilen.
[Stapes Data Tag-dokumentasjon](https://stape.io/helpdesk/documentation/send-data-from-web-to-server-container-in-google-tag-manager)
og [oppsettguide](https://stape.io/blog/sending-data-from-google-tag-manager-web-container-to-the-server-container)
bekrefter at `Add Common Cookie` er funksjonen som legger disse vanlige
cookieverdiene i hendelsesdata. Dette er en konkret utelatelse i web-GTMs
Data Tag-oppsett, men ikke bevis for at verdiene mangler i HTTP Cookie-headeren
eller i appens separate Meta Pixel/CAPI-rute. Den lokale gateway-koden
`buildServerGtmRequestHeaders` videresender vanlige cookies, inkludert
`_fbc` og `_fbp`, til Stape på storefront-ruten **når de finnes i
forespørselens Cookie-header**; disse navnene er ikke på listen over private
cookies som fjernes. Vi mangler fortsatt en avlest
Data Client-hendelse for å se om server-GTM bruker disse cookieverdiene.

Den brukerleverte eksporten
`/Users/kristofferohnstadhjelmeland/Downloads/GTM-M8GT97CV_v45.json`
(eksporttid `2026-10-29 03:49:54`, tidssone ikke oppgitt; SHA-256
`f4218572b74ffee35018c2a86bf357c2cbc2c2d9434c6a88084a02f9b85fe83e`)
viser **server-GTM versjon 45** med én GA4-tagg, tre transformasjoner,
tre klienter og fem utløsere. Brukeren har bekreftet at **v45 er i
produksjon**. Eksporten har ikke et eget live-statusfelt, og GTM API har
ikke gitt uavhengig versjonsavlesning. En innlogget arbeidsområdevisning
bekreftet 29. oktober servercontaineren og **0 ventende endringer**.

Den tidligere formuleringen om én transformasjon og en ubekreftet
`allowedParameterNames`-liste var feil som beskrivelse av versjon 45.
Transformasjon 43, `Keep`, er en **aktiv tillatelsesliste i eksporten**:
`tf_allow_params`, `matchingConditionsEnabled: false`, `allTagsExcept: true`
og ingen unntatte tagger. Den gjelder dermed alle hendelser for den ene
GA4-taggen i denne versjonen. Listen har 46 felter og inneholder `fbc`
og `fbp` som egne toppnivåfelter, men ikke `fbclid`, `_fbc`, `_fbp`,
`common_cookie`, `browser_id` eller `click_id`. Verdier i disse andre
hendelsesfeltene ville derfor ikke være tilgjengelige for GA4-taggen etter
filteret. Ingen av disse reglene filtrerer `fbc`/`fbp` bare i utvalgte
hendelsesscenarioer. At `fbclid` ikke er med, er i seg selv ikke bevis for
tap av `fbc`: et allerede opprettet toppnivåfelt `fbc` er tillatt, og
`page_location` er tillatt selv når URL-en inneholder `fbclid`.
[Googles dokumentasjon
om server-GTM-transformasjoner](https://developers.google.com/tag-platform/tag-manager/server-side/transformations?hl=en)
bekrefter at en tillatelsesliste forkaster alle hendelsesparametere som
ikke står der, som standard for alle tagger.

Transformasjon 36, `P0 - Strip user_data PII from all tags`, gjelder også
alle hendelser og tagger og ekskluderer 12 PII-felt, men nevner ikke
`fbc`, `fbp` eller `fbclid`. Transformasjon 55 legger til POAS-feltene og
setter `event_name` til `poas_estimate` for Data Client-hendelsene
`add_to_cart` og `begin_checkout`; den endrer ikke eksplisitt `fbc` eller
`fbp`. Ingen av de tre transformasjonene har en egen prioritetsverdi;
Google beskriver standardrekkefølgen som Tillat, Utvid, Ekskluder.
Tillatelseslisten mangler også Data Client-feltene `timestamp`,
`unique_event_id`, `ip_override`, `page_hostname` og `page_path`, samt
Googles interne `x-ga-*`-felter. Dette kan svekke GA4-målingen og må
kontrolleres mot faktiske utgående GA4-kall. GA4 er den eneste taggen i
eksporten. Den utløses av GA4-klienten generelt og av Data Client bare for
`page_view`, `add_to_cart` og `begin_checkout`. Blokkeringen for
`view_item` har ingen klientbetingelse, selv om navnet nevner Google
Data Manager.

Data Client-malen i samme eksport leser JSON-kroppen inn i hendelsesdata,
men har ingen eksplisitt lesning av `_fbc` eller `_fbp` fra
forespørselens cookies eller utledning av `fbc` fra URL-`fbclid`.
Dens `getCookieValues`-kall gjelder `stape`, `FPID` og `_dcid`.
Data Client legger dermed ikke disse cookieverdiene automatisk i
toppnivåfeltene `fbc`/`fbp` i den eksporterte koden.
Web-GTMs Data Tag hadde `add_common_cookie: false` og ingen eksplisitt
`fbc`/`fbp`-mapping. Dette dokumenterer fravær av **eksplisitt**
eventData-mapping i web-GTM → Data Client → GA4-grenen. Om feltet likevel
når en utgående GA4-hendelse, må kontrolleres med en faktisk hendelse i
server-GTM Preview. Versjon 45 har ingen Meta-server-tagg: en installert
Facebook CAPI-mal er ikke en aktiv tagg. Produksjonsbackendens READY-deploy
`0e6b9ed5ac09bccf9f34630e4c11278629d76632` er kontrollert mot
Meta-dispatch-kilden: `UserData.setFbc`/`setFbp` sendes via
`EventRequest.execute()` i Meta SDK utenom server-GTM. Derfor forklarer
ikke den avleste GA4-grenen i seg selv Metas lave ClickID-andel; per-event
Meta-mottak og øvrige avsendere må fortsatt avstemmes.

Shopify Admin `appInstallations` listet 20 apper, uten en synlig
Facebook/Meta-installasjon; Shopify-piksler kunne ikke leses med gjeldende
tilgang. Metas offentlige Pixel-konfigurasjon hadde `OpenBridge` opt-in,
et gateway-endepunkt og en blokkeringliste som ikke omfatter PageView,
mens datasettdetaljene fortsatt svarte `NOT_ONBOARDED / NO_UPSELL`.
En eldre, lokal [Meta-revisjonsfil](meta-audit-evidence-2026-10-14.json)
dokumenterer at Events Managers historikk 14. oktober kl. 07:59 UTC viste
frakobling fra Conversions API og kl. 08:01 UTC en ny tilkobling med det
eksakte navnet «Conversions API with Meta», fordi eierbedriften hadde valgt
denne integrasjonen. Samtidig ble `OpenBridge` avlest i Pixel-konfigurasjonen,
og en nettverksfangst registrerte en gateway-forespørsel med HTTP 200 før
en avbrutt lasting. En innlogget, read-only kontroll rett før
**29. oktober kl. 04:44 UTC** i
Events Manager → Settings → «Your Conversions API connections» viser nå
«Conversions API • Web-only: Active», med Utekos Pixel som tilkoblet datasett
og «Last received 28 minutes ago». «See details» åpnet Metas
`web_conversions_api`-side «Utekos Marketing Data Layer» med
«preferences for connecting to Conversions API with Meta» og
**Connected datasets (1): Utekos Pixel 1092362672918571**.
Den separate Meta-administrerte tilkoblingen er dermed bekreftet aktiv i UI,
men per-hendelse-volum, `fbc`-dekning og vellykket gateway-videresending er
ikke avlest. Test Events → Website → server viste bare instruks om å sende
en testhendelse; ingen eksisterende sample eller event-ID var tilgjengelig,
og ingen test ble sendt. Chrome ble returnert til Canva etter avlesningen.
`NOT_ONBOARDED`-feltet i datasettdetaljene har et uavklart, snevrere scope
enn denne tilkoblingsvisningen. GTM-API svarte 429 for dagskvote, og Stapes
utgående monitoring kunne ikke leses.

Formatkontroll: Alle **6 458** før-release PageViews med `fbc` hadde Meta
Parameter Builders femdelte format med et åtte tegn langt suffiks. Både
vedlagt Meta-tekst og den installerte Meta-pakken beskriver suffikset;
det er derfor ikke i seg selv en dokumentert ugyldig `fbc`.

For egen Meta-outbox i førperioden startet **70/10 878** PageView-forsøk
mer enn én time etter hendelsestidspunktet. Hos 68 var brukeragenten
Googlebot, med lagerdato 14.–16. oktober; de to øvrige hadde gamle
hendelsestidspunkt fra Edge-klienter og ble lagret 28. oktober. Alle 70
var forsinket **før** ledger-lagring; ingen ventet over én time mellom
ledger og Meta-forsøk. Dette er en liten, konkret lang hale, men forklarer
ikke alene Events Managers «Hourly»-etikett og brukes ikke som forklaring
på den lave ClickID-prosenten.

## Utvidet kjedeavstemming 29. oktober

En ny avlesning av samme 15 hele UTC-døgn (14.–29. oktober) ble gruppert per
kanonisk web-hendelse og koblet på `event_id` til egne Meta-forsøk. Dette er
andelen med `browser_id.fbc` **i egen ledger**, ikke Metas «Percentage of
events sending ClickID»:

| Kanonisk hendelse | Antall | Med `fbc` | Andel |
| --- | ---: | ---: | ---: |
| `page_view` | 10 878 | 6 458 | 59,4 % |
| `view_item` | 4 838 | 3 415 | 70,6 % |
| `add_to_cart` | 296 | 167 | 56,4 % |
| `begin_checkout` | 178 | 91 | 51,1 % |
| `add_to_wishlist` | 27 | 13 | 48,1 % |
| `view_cart` | 201 | 134 | 66,7 % |

Alle disse egne Meta-forsøksradene beholdt samme `fbc` som ledger-raden når
den fantes. For hver av de seks hendelsestypene var det **0** rader med
`fbclid` i lagret URL uten `fbc`, **0** med lagret `click_id.fbclid` uten
`fbc`, og **0** mismatch mellom lagret rått klikk og klikkdelen av `fbc`.
Dette avgrenser feilen: de lagrede, synlige klikkene tapes ikke generelt i
egen outbox. Det sier ingenting om klikk som mangler **før** ledger, om
browser Pixel, eller om andre sendere til samme Meta-datasett. For 43
`purchase`-webhooker var 18 lagret med både klikk og `fbc`; én rad hadde
ulik klikkdel og rått klikk. En read-only gjennomgang av samme besøkskjede
fant begge verdiene i ekte PageView-URLer; `fbc`-klikket var observert
senere, cirka 4,2 mot 6,7 minutter før kjøpet. Checkout-snapshotet hadde
fjernet URL-query før webhooken. Den lokale webhook- og GraphQL-mapperen
harmoniserer fremtidige kjøp mot en strukturelt og tidsmessig gyldig `fbc`
når lagret rå klikkverdi er eldre. Hvorfor Shopify-attributtet beholdt den
eldre verdien er en slutning fra kodekjeden, ikke direkte kildebevis.

Fra releasens READY-tid 02:40:03 UTC til omtrent 04:04 UTC kom 20 naturlige
PageViews i egen ledger, 18 med `fbc` og **ingen med nytt `fbclid` i URL**.
To PageView–`view_item`-par kom inn, heller ingen med ny URL-klikkverdi.
Alle 20 Meta-forsøk fikk HTTP 200 `accepted_unverified`, og ingen lagret
`fbc` ble endret i forsøksraden. Median fra hendelsestid til forsøksstart
var cirka 0,55 sekund, p95 cirka 4,23 sekunder. Utvalget kan ikke bekrefte
at den publiserte kontinuitetsrettingen virker på nye annonseklikk.

Metas Dataset Quality-avlesning rundt 04:04 UTC viste `fbc`-matchnøkkeldekning
PageView 26,1 %, ViewContent 30,2 %, AddToCart 15,4 %,
InitiateCheckout 13,8 %, AddToWishlist 8,3 %, ViewCart 75,0 % og Purchase
66,7 %. `fbp` var 100 % for disse hendelsene. `upload_frequency` var
`hourly` for PageView/ViewContent og `real_time` for de øvrige. Dette er
fortsatt egne Meta-aggregeringer, med et annet vindu og en annen nevner enn
ledger-tabellen. Tilgjengelig Meta-MCP gir ikke per-hendelse `fbc`, mottakstid
eller avsenderidentitet, så API-aksept og intern forsøkstid kan ikke
likestilles med Meta-mottak eller Events Managers Data Freshness.

En ny lokal test med installert Node Parameter Builder påviste en annen
konkret feil ved backendens PageView-inntak: et eldre event med komplett
`fbc` kunne behandles med en nyere request-cookie og få sin `fbc` mintet på
nytt ved backendens mottakstid. En asynkron collector- eller
parameter-context-respons kunne i tillegg sette en gammel `_fbc` etter at
neste landing hadde lagret et nyere klikk. Den nye **lokale, ikke publiserte**
backendrettingen lar eventets egne `fbc`/`fbp` styre dette eventet, daterer
en manglende `fbc` fra faktisk URL-klikk til opprinnelig hendelsestid og
fjerner cookie-skriving fra begge asynkrone responsene. Dokumentnavigasjonens
Proxy og den aktive nettleserfanen eier cookie-oppdateringene. Den nye
frontendkandidaten utvider full `fbc`/`fbp`-bevaring mellom faner, begrenser
alder ut fra Meta-ID-ens opprinnelige tidsstempel og isolerer ugyldig store
cookie- eller klikkfelt. Den beskytter også mot gammelt URL-klikk fra en
fortsatt åpen fane, sent SDK-resultat og cookie-skriving etter
samtykketrekking. Den første isolerte frontendkandidaten, som også hadde en
Pixel-gate, på produksjonsbasen
`f8ecc1bf29656b933111d272d5c3cfde7b91f393` bestod **91/91**
nettlesertester, **16/16** Proxy-/gatewaytester, full TypeScript-kontroll,
28 MDX-lenker, avgrenset ESLint uten feil og `git diff --check`. Lokal build
kom gjennom kompilering og typekontroll, men sidegenerering krevde
`SHOPIFY_STOREFRONT_PRIVATE_TOKEN`, som ikke finnes i den isolerte kopien.
Kontraktskontrollen feiler i fire uendrede baselinefiler; de endrede
ClickID-filene og Pixel har oppdaterte provenienshash i kontraktsoverstyringen.

Metas dokumenterte Pixel-grensesnitt gir ikke en støttet per-hendelse
overstyring av `fbc`/`fbp`; Pixel leser levende cookies. En forsinket
hendelse A kan derfor få klikkidentiteten til en senere landing B dersom den
sendes i Pixel etter B. Frontendkandidaten lar da A gå via CAPI med
hendelsens opprinnelige identitet og hopper over Pixel-kallet for akkurat A
når en nyere levende `_fbc` eller `_fbp` oppdages. Testene dekker direkte
dispatch, dataLayer-kopi, nytt URL-klikk og nyere `_fbp`; vanlig første
PageView bruker fortsatt Pixel. En egen isolert test med faktisk Meta-SDK
viste at SDK kan holde A i sin interne kø også **etter** `script.onload`,
mens den venter på sin konfigurasjonsrespons. Når B skrev nyere `_fbc`/`_fbp`
før konfigurasjonen ble frigitt, behandlet SDK A med B-verdiene. En ny
appventeliste hindrer den ytre `fbq`-stubkøen i å gjøre dette før skriptet
lastes, men er ikke en dokumentert barriere for SDK-ens interne kø.
Pixel-delen kan derfor ikke erklæres ferdig eller identitetssikker ut fra
de lokale 91 testene. En støttet transportbeslutning undersøkes før
en eventuell Pixel-PR. En egen **inkrementell kandidat uten Pixel-endring**
i `/private/tmp/utekos-meta-clickid-incremental.w0Of9Z` har nøyaktig ni
endrede filer og bestod isolert installasjon, **94/94** nettlesertester,
**16/16** gatewaytester, full TypeScript-kontroll, 28 MDX-lenker,
avgrenset ESLint uten feil og `git diff --check`. Den beholder den kjente
Pixel-racen som en åpen rest-risiko og endrer ingen browser/Meta-kanaler.
Etter en egen feilet før-test ble første bokstavelige URL-`fbclid`
validert før klientens SDK, Proxy og varig lagring: korrekt dekodbar,
ikke-blank og høyst 500 tegn. Ugyldig første duplikat gir ikke prioritet
til en senere verdi; kodet parameternavn forveksles ikke med bokstavelig
`fbclid`. Testene dekker 500/501 tegn, `%ZZ`, blank verdi, duplikater og
kodet nøkkel, og bekrefter at gyldig eksisterende `_fbc` beholdes mens
faktisk `page_url` bevares. Den installerte Meta-klientpakken v1.3.2
avviser over 500 tegn og kan kaste på ugyldig percent-koding; dette er
kilden til grensen. Backendkandidaten hadde samme reproduserte feil og
fikk en semantisk lik validering før Parameter Builder. Denne kandidaten
er pushet som [storefrontutkast PR #4](https://github.com/Team-Kelc-AS/utekos-v2/pull/4)
med nøyaktig ti filer inkludert denne rapporten; den er ikke slått sammen
eller publisert. Vercel preview `dpl_33dkunEPvBmgQJdjM8ebwBoHTiGS`
kompilerte, men stoppet ved sidegenerering med
`Missing environment variable: SHOPIFY_STORE_DOMAIN` for
`/produkter/[handle]`. De berørte Shopify-filene og `src/app` er uendrede
fra base; dette er en preview-miljøbegrensning, ikke en bestått full build
eller påvist ClickID-regresjon.
[Meta Pixel-referanse](https://developers.facebook.com/documentation/meta-pixel/reference/)
og [Meta CAPI-parametere for fbp/fbc](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/fbp-and-fbc/)
er kilder til denne grensen.

Den isolerte backendkandidaten bestod **130/130** fokuserte tester,
**4/4** manifesttester, full TypeScript-kontroll, avgrenset ESLint og
`git diff --check`. Lokal build kom gjennom kompilering og typekontroll,
men prerendering krevde `STORE_DOMAIN`. Tre feil i bredere
eventkontraktstester ble gjentatt identisk på ren produksjonsbase.
[Backendutkast PR #8](https://github.com/Team-Kelc-AS/utekos-tracking-backend/pull/8)
inneholder nøyaktig 30 avgrensede filer på head
`a75ee13cfa667eeb362c715b032cbf57f6acae9a` og er verifisert som
utkast i GitHub. Den nye URL-valideringen hindrer 501-tegns og feil
percent-kodede `fbclid` i å overstyre gyldig event-`fbc` på PageView,
Proxy eller parameter-context, mens opprinnelig `page_url` og andre
plattformers klikk-ID-er bevares. En syntetisk `fbclid` med punktum viser
fortsatt en separat formatgrense i installert Meta-SDK; den er ikke endret
uten dokumentert kompatibilitet og forekom ikke i den avleste produksjons-
kohorten. Vercel preview `dpl_EKLr2vmrq9AtERNoyAdhbieBwXkg` for denne
PR-en feilet i uendret `prebuild` før
Next-kompilering: `validate-build-env.mjs` krever
`NEXT_PUBLIC_KLARNA_CLIENT_ID`, som Vercels miljømetadata viser kun for
production-target og ikke preview. Bare variabelnavn og target ble lest,
ingen hemmelig verdi. Dette er en forhåndsbyggbegrensning, ikke bevis for
at PR-en bygges i produksjon. Ingen av disse nye backend- eller
frontendendringene er publisert.

Den gamle edge-helsekontrollen kan ikke brukes som bevis for fangst før
ledger: `ops.meta_landing_edge_health` hadde 69 630 rader ved kontrollen,
men **0** med `fbclid_present=true`. Dette er forventet etter
`operational_v1`-personvernregelen. `vercel-log-drain/sanitize.ts` setter
feltet til `false` og UTM-/annonsefelter til `null`; databasen håndhever
`operational_v1_no_attribution`. En monitor som bruker denne visningen får
dermed tom klikknevner og kan feilaktig unnlate å varsle. Overvåking må nå
bygge på samtykkede kanoniske hendelser; måling av tap **før** ledger krever
en separat personvernvurdert, aggregert observasjon. Dette er ikke grunnlag
for å begynne å lagre rå URL-er eller ClickID i edge-loggen.

En read-only kontroll av den nye aggregerte monitor-spørringen over de siste
24 timene til omtrent 04:17 UTC fant **1 038** samtykkede PageViews,
**288** med URL-`fbclid`, **460** med rått `click_id.fbclid` og **0**
URL-kjedefeil eller rå/fbc-mismatch. Den korrigerte SQL-sammenligningen
godtar både klassisk `fbc` og Meta Parameter Builders gyldige 8-tegns
suffiks. Blant **242** PageView→første `view_item`-par med samme rå klikk
hadde **12** endret full `fbc` og **11** endret `fbp`. Dette er et rullerende
24-timersvindu som blander før og etter den første releasen; det beviser
ikke en ny feil i den publiserte koden. Etter 02:49:20 UTC var det bare
**ett** sammenlignbart par og ingen ny URL-`fbclid` i det avleste utvalget.
De **28** relevante Meta-forsøkene i dette senere utvalget fikk HTTP 200,
og ingen brukte over 60 sekunder fra ledger til forsøksstart. For de tre
aggregerte spørringene brukte databasen indekser på ledgerens `created_at`
og Meta-forsøkenes `event_id`; alle kjørte under ett sekund i read-only
kontrollen. Dette er spørringskostnad for dette vinduet, ikke en generell
ytelsesgaranti.

En ny, separat rullerende 15-dagerskontroll kl. **07:27 UTC** fant
**210/3 239** PageView→første `view_item`-par med endret full `fbc` og samme
rå `fbclid`. I alle 210 var klikkdelen uendret og ingen `fbc` manglet;
tidssegmentet endret seg i alle, og 8-tegns-suffikset i 209. Fordelt på
PageView-dato var det 198/2 991 før 28. oktober, 12/239 den 28. og **0/9**
den 29. oktober. Disse ni parene er gruppert på dato, ikke nøyaktig
READY-tid, og er for få til å erklære feilen løst i produksjon. I samme
15-dagersvindu hadde **0/6 427** lagrede rå
`fbclid` punktum, semikolon, whitespace, prosent eller andre tegn utenfor
`[A-Za-z0-9_-]`; den separat påviste SDK-formatfeilen for punktum har altså
ingen observert forekomst i dette PageView-utvalget.

Den separate, planlagte lokale cron-ruten måler samtykket URL→kanonisk
ClickID→første påfølgende produktvisning→Meta-outbox samt hendelsestid og
ledger-tid til forsøksstart. Den rapporterer `no_sample` og `low_sample`
eksplisitt og sender ikke rå ClickID, URL eller event-ID til driftslogg.
Et invariantbrudd gir HTTP 503 og `console.error`; manglende/lite utvalg
gir HTTP 200 med synlig status. **17/17** fokuserte tester, full backend-
typekontroll, avgrenset ESLint og diffkontroll bestod i den delte
arbeidskopien. PGlite-testene kjører den faktiske PostgreSQL-spørringen,
inkludert gyldig Meta-suffiks, rå klikk med punktum og manglende klikk.
Vercel tilbyr Runtime Logs for cron-kjøringer, men ikke automatisk retry
eller varsling for denne nye ruten. En dedikert alarm og faktisk Meta-
mottaksbevis gjenstår. Ingen cron er publisert ennå.
[Vercel Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs) og
[Runtime Logs](https://vercel.com/docs/logs/runtime) er de avleste
driftskildene for denne begrensningen.

## Kanalvalg og separat Meta-kilde

En separat read-only kontroll av siste Meta-forsøk per samtykkede hendelse
for omtrent **14. oktober kl. 04:39 til 29. oktober kl. 04:39 UTC** viste:

| Egen hendelse | Siste forsøk HTTP 200, `accepted_unverified` / hendelser | p95 ledger → forsøksstart |
| --- | ---: | ---: |
| PageView | 10 862 / 10 862 | 1,31 s |
| ViewContent | 4 835 / 4 835 | 0,68 s |
| AddToCart | 294 / 294 | under 0,4 s |
| InitiateCheckout | 176 / 176 | under 0,4 s |
| AddToWishlist | 26 / 26 | under 0,4 s |
| ViewCart | 197 / 197 | under 0,4 s |
| Purchase-webhook | 39 / 39 | under 0,4 s |

Det var ingen manglende, ventende eller terminale forsøk i dette uttrekket;
én PageView hadde et nytt forsøk. Dette støtter at **egen** CAPI-transport
er rask og når HTTP 200, men `accepted_unverified` er ikke en per-hendelse-
kvittering på Metas endelige mottak, deduplisering eller attribusjon.
Det er heller ikke tilstrekkelig grunnlag alene for å skru av Pixel i
produksjon. Metas dokumenterte anbefaling er å bruke Pixel og CAPI sammen
med samme hendelsesnavn og event-ID for deduplisering.
[Meta om Pixel/CAPI-deduplisering](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events/)
er kilden til denne avveiningen.

Metas Stats-svar for et tilsvarende, men ikke identisk 15-dagersvindu viste
**17 483** `SERVER_ONLY` PageViews og **9 837** `WEB_ONLY` PageViews. Det
brukerleverte Events Manager-utdraget oppgir **10 362** «Conversions API
direct» og **7 186** «Conversions API with Meta» for PageView. Summen av de
to UI-linjene er 17 548; den ligger nær Stats-tallet, og egen ledger ligger
nær direct-linjen. Tallene er **forenlige med** at en separat Meta-administrert
serverkanal bidrar betydelig til totalen, men tidsvindu, Stats-kategorier og
kildeidentitet er ikke likt definert eller parbart per event-ID. Verken
ClickID-andel eller årsak til den lave Meta-prosenten kan fordeles mellom
kanalene med dette grunnlaget. Den historiske tilkoblingshendelsen fra
14. oktober over bekrefter at integrasjonsnavnet ikke bare er en generisk
etikett; dagens volum og videresending må fortsatt bevises.
[Metas Stats API-dokumentasjon](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/stats.md)
beskriver `WEB_ONLY`/`SERVER_ONLY` som kildefiltre for «pixel fires», ikke
som unike dedupliserte konverteringer eller som navn på serverintegrasjonen.
Den publiserte dokumentasjonen oppgir syv dagers datagrense, mens den
tilgjengelige Meta-MCP faktisk returnerte timebøtter for det spesifiserte
15-dagersintervallet; det er avlesningsresultatet, ikke en antatt API-garanti.
Metas gjeldende Pixel-konfigurasjon laster `openbridge3` med opt-in og et
gateway-endepunkt. En mulig Pixel-speilet CAPI-strøm kan derfor også falle
bort dersom kanoniske Pixel-hendelser slås av. Dette er en **hypotese om
kanaleffekt**, ikke identifisert per hendelse; datasettdetaljene rapporterer
samtidig `NOT_ONBOARDED` for gatewayen. Ingen CAPI-only-endring bør publiseres
før denne motstriden og Meta-mottaket er avklart.

Den sporede Shopify custom pixel-filen
`config/shopify/customer-events/meta-purchase-pixel.js` abonnerer bare på
`checkout_completed`, og kan ikke produsere PageView fra den filen.
Shopify Admin avviste både `webPixel` og `serverPixel`-oppslag med manglende
`read_pixels`/`read_server_pixels`-scope, så andre app-piksler er fortsatt
ukjent. Server-GTM v45 har som nevnt ingen Meta-tagg.

En separat, lokal CAPI-only-kandidat for kanoniske browserhendelser
undersøkes fordi den faktiske Pixel-SDK-køen ikke tilbyr en dokumentert
per-hendelse `fbc`/`fbp`-overstyring eller sendbarriere. Dette er et
bevisst bortfall av browser Pixel-kanalen og må vurderes mot kildeidentitet,
Meta-mottak og hendelsesdekning før eventuell produksjonsendring. Den
separate review-kandidaten i
`/private/tmp/utekos-meta-capi-only-review.HMMfq3` bestod **92/92**
nettlesertester, **16/16** gatewaytester, full TypeScript-kontroll,
28 MDX-lenker, avgrenset ESLint uten feil og `git diff --check`. Fire
uendrede baselinefiler feiler fortsatt i kontraktskontrollen. I en
isolert test av kandidaten fikk første PageView `_fbc` fra URL og `_fbp`
fra Parameter Builder/Pixel-init uten en Pixel-track-hendelse. PageView nådde
førsteparts CAPI-broen på under 1,8 sekunder før forsinket Pixel-SDK var
klart. Produktvisning, kasse og en egendefinert interaksjon nådde samme bro
med bevart event-ID, hendelsestid og samtykke. En separat test med faktisk
Meta-SDK og forsinket konfigurasjon viste ingen `trackSingle` eller
`trackSingleCustom`, bare `consent` i SDK-køen. Dette er lokal transport- og
fraværskontroll, ikke Metas kvittering eller produksjonseffekt. Kandidaten
er verken pushet eller publisert. Den skal ikke velges bare fordi de lokale
testene er grønne: den aktive «Conversions API with Meta»-tilkoblingen kan
være avhengig av Pixel-hendelser, og dens faktiske volum og dekning er ikke
kildeavlest.

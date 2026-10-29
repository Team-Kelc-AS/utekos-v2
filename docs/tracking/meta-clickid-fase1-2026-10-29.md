# Meta ClickID og dataferskhet, fase 1 — 29. oktober 2026

## Status og bevisgrense

Dette er en avstemming av **produksjonskjeden før release** og dokumentasjon
av den avgrensede rettingen. Rapportens SQL- og provideravlesninger er
førmålinger; de er ikke bevis for at Meta har mottatt rettingen, at alle
hendelser er klassifisert «Real Time», eller at Events Manager-prosentene har
endret seg. Ingen testhendelser, replay eller providerendringer inngår i
undersøkelsen.

Brukerens [Events Manager-utdrag](../../../email/event-manager.md) er behandlet
som en avlesning: PageView 33,19 % «Percentage of events sending ClickID» og
«Hourly»; ViewContent 39 % og «Hourly»; AddToCart 15 % og «Real Time»;
InitiateCheckout 13 % og «Real Time». Utdraget gjentar enkelte volumer under
flere hendelsesnavn, så de tallene brukes ikke som en felles SQL-nevner.
[Meta-teksten om ClickID/fbc/fbp](../../../Markdown/click_id_fbp_fbc.md) er
kildemateriale, ikke en ny instruks eller autorisasjon. Den beskriver fangst
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

Gjeldende Meta Dataset Quality-snapshot oppgir PageView `fbc`-matchnøkkeldekning
**24,7 %** og `upload_frequency: hourly`. Det siste API-feltet betyr
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

1. Bekreft den avgrensede releasens commit og Vercel READY mot faktisk
   frontend-SHA. Observer deretter
   naturlige Meta-klikk i produksjon: identisk full `fbc`/`fbp` fra PageView
   gjennom Pixel, collector, Meta-forsøk og senere hendelser.
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

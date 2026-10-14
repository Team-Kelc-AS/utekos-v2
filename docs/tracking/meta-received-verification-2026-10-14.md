# Hva Meta mottar, 14. oktober 2026

## Nyeste mottaksbevis, 14. oktober kl. 14:09 norsk tid

Metas native statistikk, avlest kl. 14:01:09 for **kl. 12:00–14:01:09**, viser **2 server-Purchase, 1 server-AppendAttribution og ingen browser-Purchase-rader**. Purchase ligger i hver sin timebøtte, kl. 12 og 13; AppendAttribution ligger i kl. 13-bøtten. Dette bekrefter mottak av det rettede hendelsesnavnet, men timebøttene identifiserer ikke enkeltkjøp.

Et separat Graph API-kall, fullført kl. 14:09 med samme vindu, viser `content_type`, `content_ids`, `contents`, `currency`, `net_revenue` og `value`: **2 forekomster av hvert felt for Purchase og 1 for AppendAttribution**. Begge pagineringer er fullført. Kallet har ikke kildeskille. **Felttilstedeværelse hos Meta er nå bevist; konkrete beløp er ikke eksponert.** Metas gjeldende CAS-kvalitetssnapshot inneholder nå AppendAttribution med EMQ **9,3/10** og **100 % fbc-feedback**. Kvalitetssnapshotet har egne målevinduer.

Live Events Manager viser Purchase som «Conversions API», EMQ 9,3 og aktiv verdidiagnose. Oversiktens 45 gjelder et UI-vindu som ikke ble lest i denne kontrollen og sammenlignes derfor ikke med API-vinduet. Åpning av detaljene stoppet i nettleserstyringen; ingen innstilling ble endret.

**Åpent:** nettleser-Purchase, individuell browser/server-deduplisering, konkrete mottatte value/net_revenue og endelig attribusjon. Den naturlige annonseklikkreisen har tidligere dokumentert identisk full fbc fra første registrerte PageView gjennom 13 kildehendelser til betalt kjøp; dette er et annet bevisnivå. Komplett samtykkeoppsett og v2→Shopify-overføring utsettes etter brukerens beslutning.

Bevis: `/tmp/utekos-meta-purchase-receiver-1201-20261014.json`, `/tmp/utekos-meta-natural-purchase-fields-20261014.json`, `/tmp/utekos-meta-cas-quality-1210-20261014.json` og `naturalPurchaseReceiverVerification1201` i [JSON-avstemmingen](meta-audit-evidence-2026-10-14.json). Eldre daterte avlesninger nedenfor beholdes som historikk; denne statusen går foran eldre formuleringer om manglende AppendAttribution/net_revenue-felttilstedeværelse.

Fasit for mottak er Metas egne svar og Events Manager. Kode, ledger og transportspor forklarer avvik, men lukker ikke mottakskontrollen alene.

**Siste fokuserte avstemming, 14. oktober 12:39 norsk tid:** [PageView → fbc → checkout](meta-fbc-reconciliation-2026-10-14.md). Ny 20-timersrapport: 4 442 mottatte hendelser, 17 navn, fullført paginering. Fersk aggregert Meta-deduplisering: PageView 95,49 %, ViewContent og InitiateCheckout 100 %; Purchase-feedback mangler. Kvalitetssnapshotet er et eget målegrunnlag fra 20-timersvinduet. Den følgende historikken beholdes som datert bevis.

## API-er og bevisgrenser

| Kall | Hva Meta returnerer | Avlest status / begrensning |
| --- | --- | --- |
| `GET /v26.0/{dataset}/stats?aggregation=event&event_source=WEB_ONLY eller SERVER_ONLY` | Hendelser per kilde/time | Begge kilder lest for samme forespurte 20-timersvindu. Timebøtter er ikke eksakt hendelsestid; kildeantall skal ikke summeres som unike konverteringer. |
| `GET /v26.0/{dataset}/stats?aggregation=custom_data_field&event={event}` | Registrerte parameterfelter per hendelse/time | Alle18 navn lest ferdig. Kildeskille er ikke bevist for denne aggregasjonen. Tomme svar beviser ikke at alle egendefinerte parametre er borte. |
| `GET /v26.0/dataset_quality?dataset_id={dataset}&fields=web{...}` | EMQ, match-nøkler, dekning, dedupliseringsfeedback, freshness |18 kvalitetsrader,11 med dedupe,10 med dekning,8 med freshness,0 med diagnostikkfelt. Manglende er ikke godkjent status. Dekning er7-dagersdata. |
| Dataset Quality, `query_type` alle kanaler via native MCP | Kanaldata | web18, custom_attribution1 med AppendClickAttribution. offline/crm ikke returnert; dette er ikke bekreftet null. |
| `GET /v26.0/{catalog}/event_stats` | Mottatte content-ID-er som matcher/ikke matcher katalog | Native kataloghelse gir988/1000 treff=98,8%, for14. september–11. oktober. Ikke samme vindu som replay. |
| `GET /{pixel}/da_checks` | Dokumenterte katalogkontroller på pikselnivå | Referansen er lest. Native katalogkontroll med13 sjekker er også lest; konkrete varsler undersøkt nedenfor. |
| `raw_fires`, `recent_events` | Dokumenterte rå-/nylige hendelser | Nåværende v26-token får400/code100. Ingen råpayload-kvittering er hentet med disse kallene. |
| Events Manager: Test events / Sampled activities / CAS-export | Mottatte prøver, behandling/dedupe og attribusjonsrapporter | Ny avlesning05:04UTC viser19 forekomster,11 Deduplicated og8 Processed. De11 er forekomster, ikke11 hendelsestyper. Alle11 dedupliserte er korrelert til server200/events1. Purchase-prøver viser0 rader og varsel om fjernede custom data. Full dedupe-, Purchase- og CAS/attribusjonsavstemming gjenstår. |

## Lenker til rapportene

[Stats for20-timersvinduet13. oktober10:23–14. oktober06:23 norsk tid](https://utekos.no/api/meta/meta-stats?start=1791879821&end=1791951821) svarte200, no-store, generert2026-10-14T04:23:45.259Z. Hendelses- og behandlingsmetadata-paginering er fullført med2 sider hver. Totalfeltet4211/17 typer kommer fra egen span-aggregasjon, som ikke summeres over paginering. Det er et eget vindu fra kildefordelingen nedenfor.

[Kvalitetssnapshot](https://utekos.no/api/meta/meta-quality) har ikke et eget20-timersfilter. Rapporten angir gjeldende snapshot og blant annet7-dagersdekning eksplisitt.

## Metas kildefordeling

Avlesning: 2026-10-14 03:56:39 UTC. Forespurt vindu: 2026-10-13T07:56:39+00:00 til 2026-10-14T03:56:39+00:00.
Parameterstatistikken er en egen avlesning avsluttet 2026-10-14T03:34:12.106Z for det tidligere faste 20-timersvinduet i JSON-beviset. Kvalitet er gjeldende snapshot med egne målevinduer.

| Hendelse | Browser | Server | EMQ | Browser-dekning via event_id (%) | Registrerte parameterfelter i separat API-avlesning |
| --- | ---: | ---: | ---: | ---: | --- |
| AddToCart | 5 | 13 | 6.1 | 80 | country, content_type, content_ids, contents, currency, value, product_catalog_id |
| AddToWishlist | 1 | 2 | 6.1 | Ikke returnert | country, content_type, content_ids, contents, currency, value |
| AppendClickAttribution | 0 | 1 | 9.3 | Ikke returnert | content_type, content_ids, contents, currency, value |
| FormError | 0 | 6 | 4.4 | Ikke returnert | Tomt svar |
| FormStart | 0 | 4 | 4.4 | Ikke returnert | Tomt svar |
| HeroInteract | 4 | 8 | 6.1 | 100 | Tomt svar |
| InitiateCheckout | 3 | 6 | 6.1 | 100 | country, content_type, content_ids, contents, currency, num_items, value, product_catalog_id |
| InteractWithAccordion | 1 | 2 | 6.1 | Ikke returnert | country, content_type, content_ids, contents, currency, value |
| LandingScrollDepth | 317 | 713 | 6.1 | 92.33 | Tomt svar |
| Lead | 1 | 2 | 6.1 | Ikke returnert | content_ids |
| PageView | 418 | 1065 | 6.1 | 95.76 | Tomt svar |
| Purchase | 0 | 1 | 9.3 | Ikke returnert | content_type, content_ids, contents, currency, value |
| RemoveFromCart | 3 | 8 | 6.1 | 100 | country, content_type, content_ids, contents, currency, product_catalog_id, value |
| SelectItem | 34 | 82 | 6.1 | 84.93 | country, content_type, content_ids, contents, currency, value, product_catalog_id |
| ViewCart | 6 | 16 | 6.1 | 100 | country, content_type, content_ids, contents, currency, value, product_catalog_id |
| ViewCategory | 51 | 110 | 6.1 | 94.29 | Tomt svar |
| ViewContent | 174 | 400 | 6.1 | 100 | country, content_type, content_ids, contents, currency, value, product_catalog_id |
| ViewItemList | 301 | 653 | 6.1 | 95.14 | country, content_type, content_ids, contents, currency, value, product_catalog_id |

## Viktige funn

- Purchase finnes på serversiden i dette vinduet. Browser-Purchase og endelig dedupe er fortsatt åpne. Metas UI viser EMQ9,3/10 og100% event-ID-, external-ID- og verdidekning; profittdekning er ikke tilgjengelig.
- Metas API og UI mottar navnet AppendClickAttribution, også i custom_attribution-kanalen. Gjeldende guide/referanse krever AppendAttribution. Det dokumenterer et navneavvik; det beviser ikke alene at all eldre attribusjon er ubenyttet. CAS-widgetene viser1/2 trinn, og attribusjonsrapporten er ikke avstemt.
- Aktuell profittguide bruker net_revenue som margin i tillegg til vanlig Purchase-verdi. Omsetning uten mva. er ikke automatisk profitt. Backend hadde bare et egendefinert profit-felt. Lokal retting legger til korrekt standardfelt fra eksisterende marginberegning. Ukjent kostgrunnlag gir ingen oppdiktet margin.
- Katalogens98,8% gjelder mottatte content-ID-referanser i returnert historikk, ikke de nye kjøpene etter11. oktober. Sju utsolgte varer må sammenholdes med lagerfasit. To image-oppdateringer blokkeres av en annen kildes prioritet. Alle fire returnerte feedkjøringer lyktes med advarsler og0 feil. Det generelle health-flagget er ikke grunnlag for å kalle siste opplasting mislykket.
- Metas28-dagers UI viser OpenQuickView87, AddShippingInfo23 og AddPaymentInfo17. Fravær i dagens kodefunn eller det valgte20-timersvinduet er derfor ikke bevis på at Meta aldri har mottatt disse. Gjeldende utløsere og kildesammenheng er fortsatt åpne.

## Parameter Builder

Begge kodebasene bruker klient/server SDK1.3.2. Koden inneholder await processAndCollectAllParams, eget førstepartsendepunkt for IP, processRequestFromContext på serveren og videresending av Set-Cookie gjennom v2-proxyen.

Faktisk nettleserkontroll14. oktober04:02UTC på Comfyrobe Fjellnatt/XS:

- Ett POST-kall til /api/meta/client-ip svarte200 med offentlig IPv4 før page-view/capture. Ingen IP-verdi er lagret i beviset.
- _fbp og _fbi finnes på .utekos.no, sti /, SameSite=Lax og dokumentert SDK-appendiks. Begge er lest med secure=false og httpOnly=false; cookie-attributtene er dokumentert, ikke endret. _fbc mangler på dette organiske besøket; ingen annonseklikk-ID er konstruert.
- page_view og view_item svarte202. Nettleserpayload har fbp; serverens lagrede kanoniske payload har både fbp og client_ip_address. Backendens korrelerte Meta-svar er200/eventsReceived1 for begge. Dette er teknisk aksept, ikke endelig dedupe.
- Metas egne Test Events viser begge nettleserhendelsene som Processed. ID-hashene er f1131996393682fe8288368f3a2ae2ff og1ed684c646d032a7238944fac7bb05fb. Pixel-kallene svarte200 med samme ID-er og datasett1092362672918571.
- Meta viser ViewContent med value845, currencyNOK, content_ids43959919051000, content_typeproduct, contents med quantity1/item_price845, countryNorway, content_nameComfyrobe™, content_categorySkalljakke, gross_value845, tax_value169 og net_value676. Advanced matching viser IP address/User agent. Dette bekrefter at disse11 feltene vises i Metas mottak, selv om parameterstatistikkens feltliste er smalere.
- Meta viser URLhttps://utekos.no/ for begge og merker PageView som Custom event. Nettverksopptaket viser full produkt-URL i begge dl-feltene. Kildekoden velger trackSingle for PageView. Årsaken til Metas URL-/klassifiseringsvisning er uavklart; ingen kodeendring eller sikker konklusjon om datatap er gjort.
- Settings-avlesning etter testen viser Core setup Off og dataset category None. Automatisk ekstra side-/produktinfo og advanced matching er On; automatiske webhendelser er Off. Core setup er derfor ikke en observert forklaring på URL-avkortingen. Begge CAS-kildene ClickToAddAttribution og Custom attributions er merket Not in use for active ad sets. Det beskriver disse to kildenes nåværende bruk, ikke all historisk attribusjon.
- Historisk ved04:02 var Manage parameter blocking avgrenset av en Acknowledge to continue-avtale. Dette er senere avklart etter faktisk JA: avlesningen06:37 viser alle fire kategorier tomme; se blokkeringsinventaret nedenfor.
- Nettverksopptaket har247 hendelser, hasMore=false/truncated=false. Serverhendelsene er ikke vist i denne Test Events-økten. Ingen testkode er lagt til produksjonspayload eller akseptert hendelse gjenlevert.

Gjeldende GitHub README, sist endret13. oktober, krever én await per innsamlingsflyt og bruk av returverdiene. Den forklarer at getters før fullføring kan gi tom/stale verdi. Client1.3.3 retter AMD/RequireJS-globalen; det er ikke dokumentert at denne endringen gir gevinst for butikkens dynamiske import. Ingen SDK-versjon er endret.

## Faktiske interaksjoner avlest hos Meta 14. oktober 04:39 UTC

Den faktiske reisen på Comfyrobe™ Fjellnatt/XS åpnet Materialer, la til i ønskeliste og
handlekurv, åpnet checkout og fjernet deretter varen. Ingen kundedata ble lagt inn og
ingen ordre eller betaling ble fullført. Ønskeliste, tom handlekurv og lukket akkordeon
er tilbakeført. Alle sju utvalgte hendelser har korrelert Meta-serverkvittering med
HTTP 200 og eventsReceived=1, kontrollert med native Supabase MCP.

| Hendelse hos Meta | Parametre synlige hos Meta | Status i Test Events | Event-ID, MD5 |
| --- | ---: | --- | --- |
| LandingScrollDepth | 3 | Deduplicated | a28c36948125b4d32813e886bcff6751 |
| InteractWithAccordion | 15 | Deduplicated | c111ecec3ece2bb0487d7c33f35eacfc |
| AddToWishlist | 11 | Processed | 10e64e740b022e83caf7197720befc62 |
| AddToCart | 12 | Processed | c87ced52025228e2bd246476705460a1 |
| ViewCart | 13 | Deduplicated | e166cfa1b7912f58dd60d377f4881d39 |
| InitiateCheckout | 13 | Processed | 4e9aa2a1419a066ac3325cc48813d023 |
| RemoveFromCart | 12 | Deduplicated | 79748ed715ec25770ad352f0440f1558 |

Dette er Metas egen dedupliseringsstatus for fire bestemte forekomster. Den beviser
ikke at alle historiske hendelser eller Purchase dedupliseres, hvilken kilde Meta
beholdt, eller endelig annonseattribusjon. Processed alene avklarer ikke deduplisering.
Metas Test Events varsler at testatferd kan avvike fra live-miljøer.

Handelsfeltene viser riktig variant-ID 43959919051000, quantity 1, value/gross_value
845, tax_value 169, net_value 676 og NOK. InitiateCheckout viser dessuten num_items=1;
kart-ID samsvarer gjennom de avleste stegene. Akkordeon har materialer/Materialer,
interaction_type=open og interaction_sequence=1. Scroll har threshold=25,
percent_scrolled=47 og document_height=3992. Feltene er mottaksbevis, ikke en påstand
om at samtlige ønskede standard-, identitets- eller profitparametre er verifisert.

Nettleseropptaket før checkout og etter retur er komplett for de valgte segmentene.
Checkout-navigasjonen avkortet opptaket; denne hendelsen er i stedet korrelert mellom
Meta UI og serverkvitteringen. Utvalgte førstepartskall har observert HTTP 202 og
senere ERR_ABORTED i nettverksloggen; det overstyrer ikke de korrelerte Meta-kvitteringene.
Ingen mottaksfravær utledes av det avkortede segmentet. Meta viser fortsatt rot-URL i
de ekspanderte prøvene; URL-visning og standardhendelsenes deduplisering står åpne.

Bevis: /tmp/utekos-meta-interactions-received-20261014.json,
/tmp/utekos-meta-interactions-server-receipts-20261014.json og
/tmp/utekos-meta-interactions-deduplicated-20261014.png.

## Kategori og produktvalg, Meta-avlesning 14. oktober 04:46 UTC

Faktisk navigasjon via Produkter og Se Utekos TechDown™ Stor ga fire korrelerte
forekomster i Meta Test Events: ViewCategory (5 parametre), SelectItem (13) og
ViewItemList for overview-techdown (16) og overview-color-Vargnatt (15). Alle 49
sendte custom-data-felter samsvarer med Metas synlige felter og verdier for disse
forekomstene. Alle fire serverforsøk har HTTP 200/eventsReceived=1. Ingen manglende
eller avvikende custom-data-felt ble funnet i akkurat denne sammenligningen.

SelectItem viser variant 46944403915000, NOK 1990, quantity 1, tax_value 398,
net_value 1592 og product_catalog_id 690208780604782. Begge listeforekomstene viser
tre faktisk sendte variant-ID-er og total_item_count=4; disse feltene beskriver
forskjellige størrelser og er ikke automatisk et avvik.

**Transportavviket er åpent:** ViewCategory og SelectItem fikk Pixel GET/200.
Begge ordinære ViewItemList POST-kall til www.facebook.com/tr/ feilet med
ERR_BLOCKED_BY_CLIENT, blockedReason=inspector, type=Document, canceled=false.
Nettverksopptaket har 676 hendelser, hasMore=false/truncated=false. Samtidig viser
Meta begge listehendelsene som Processed, Browser, Manual Setup med identiske
hendelses-ID-er og parametre. Det beviser den synlige Test Events-registreringen,
men forklarer ikke transportveien. Den ordinære browser-produksjonsleveringen for
listehendelsene er derfor ikke godkjent; årsaken eller eventuell testkanal er
uavklart. Ingen bestemt utvidelse eller sikkerhetsinnstilling er utpekt eller endret.
Dette skjer også i nåværende Chrome-profil, ikke bare den tidligere profilen.

Bevis: /tmp/utekos-meta-category-received-20261014.json. Ingen kjøp, ønskeliste-
eller handlekurvendring ble gjort i denne reisen. Ny avlesning04:52UTC viser alle fire som Deduplicated, med samme event-ID-er.
Totalt åtte forekomster har nå Metas dedupliseringsstatus. Dette forklarer fortsatt
ikke blokkeringen av de ordinære POST-kallene. Den synlige DevTools-listen Request
conditions er tom, Enable blocking and throttling er avslått; ingen regel er endret.

## Implementert, testet og publisert

- Rapportrettingen i v2 er publisert i50f2647 og avlest200 på utekos.no.
- Backendrettingen ligger lokalt i ti filer.40 tester, TypeScript, scoped ESLint og diff-check består. Seks regresjonstester feilet før rettingen.
- Patch: /tmp/utekos-meta-backend-protocol-fix-20261014.patch, SHA256 27d10fae992590fefd85afdf6c0927c2aebac75a0695993033589f14c1b2f0c3.
- Publisering er forespurt og avventes. Ingen backend-commit/push, nytt kjøp eller ny replay er utført.
- Fullt35-hendelsesmål, relevante parametre, samtykke, dedupe, attribusjon, nettlesere og plattformflyt gjenstår.

## Primærkilder

- [Verifying setup](https://developers.facebook.com/documentation/ads-commerce/conversions-api/verifying-setup)
- [Dataset Quality](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api)
- [Ads Pixel Stats](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/stats/)
- [AppendAttribution guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/append-attribution), [referanse](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/append-attribution/reference) — live nettleser, oppdatert15. mai2026.
- [Profit overview](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/overview), [catalog integration](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/catalog-integration) — live nettleser, oppdatert6. august2026.
- [Catalog signals quality](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/cat-signals-quality), [original-event](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/original-event).
- [SDK README](https://github.com/facebook/capi-param-builder/blob/main/client_js/README.md), [changelog](https://github.com/facebook/capi-param-builder/blob/main/client_js/CHANGELOG.md), [workflow](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library/workflow-and-examples).
- [MDN Request.credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials).

## Lokale bevis

/tmp/utekos-meta-received-latest-source-counts-20261014.json,
/tmp/utekos-meta-received-initial-20261014.json,
/tmp/utekos-meta-received-parameters-20261014.json,
/tmp/utekos-meta-catalog-received-evidence-20261014.json.
/tmp/utekos-meta-sdk-receiver-proof-20261014.json og
/tmp/utekos-meta-test-events-received-20261014.png dokumenterer den korrelerte nettleser-/SDK-kontrollen og Metas synlige parametre.
Ingen credentials, rå kundeidentifikatorer eller ordrerader inngår i disse bevisfilene.

## Kataloglager avstemt mot Shopify

Native Meta-kall returnerte nøyaktig de sju variantene med PRODUCT_OUT_OF_STOCK,
uten flere sider. Native Shopify Admin GraphQL bekreftet produksjonsbutikk
erling-7921.myshopify.com og samme sju variant-ID-er. Alle har inventoryQuantity=0,
sellableOnlineQuantity=0 og inventoryPolicy=DENY. Utsolgt-statusen er korrekt for
denne avlesningen; å sette dem til in stock ville gi feil informasjon. Én Meta-variant
er published og seks hidden; statusen påvirker dynamiske annonser som beskrevet i
diagnostikken. Ingen tilgjengelighet eller synlighet er endret.

Siste suppleringsopplasting har fortsatt to image-prioritetsvarsler, to registrerte
varer og null feil. Feedens regelliste er tom og fullstendig avlest. API-et tilbyr
ikke filter på denne feiltypen, og utvidet avlesning gir verken berørte ID-er,
eksempelverdi eller en dokumentert automatisk retting. Kildeprioritet og de to
konkrete bildene er fortsatt åpne; ingen blind regelendring er utført.

Bevis: /tmp/utekos-meta-catalog-stock-reconciliation-20261014.json og
metaCatalogImageSourceFollowup i audit-JSON.

Chrome-dokumentasjon: [Request conditions](https://developer.chrome.com/docs/devtools/request-conditions),
sist oppdatert7.januar2026, avlest live. GoogleDev Knowledge MCP krevde ny innlogging;
den offisielle nettsiden ble lest som fallback. Synlig DevTools-regelliste er ikke
et fullstendig innsyn i andre klienter som bruker debuggerprotokollen.

## Fortsettelsens mottaksavlesning 14. oktober 05:04 UTC

Ny, separat Events Manager-fane viser den eksisterende testhistorikken. Ingen
hendelser er sendt på nytt. Den opprinnelige fanen tilhører forrige nettleserøkt og
er beholdt.19 forekomster er synlige:11 Deduplicated og8 Processed. De opprinnelige
åtte dedupliserte forekomstene har uendret status. I tillegg vises:

| Hendelse | Faktisk hendelsestid UTC | Event-ID, MD5 | Meta UI | Korrelert Meta-serverkvittering |
| --- | --- | --- | --- | --- |
| PageView |04:33:08.190|ff1d16b971c82d64395e75810b47ced0|Deduplicated|200/events1|
| ViewCart |04:33:25.813|2111f38a2d9f79581a44fb369d367749|Deduplicated|200/events1|
| PageView |04:43:35.165|e0c76e01ba1a97f19138953b42d884eb|Deduplicated|200/events1|

Serverkvitteringene er lest med native Supabase MCP; dette er støttende korrelasjon
til Metas synlige status. PageView er fortsatt merket Custom event i dette UI-et.
ViewContent ×3, AddToWishlist, AddToCart, InitiateCheckout og to andre PageView står
fortsatt som Processed. Mottak er bekreftet for de synlige prøvene; Processed
beviser verken endelig deduplisering eller manglende deduplisering. De11 dedupliserte
forekomstene beviser ikke ordinær produksjonslevering av de to blokkerte liste-POSTene,
alle historiske hendelser, Purchase eller annonseattribusjon.

Bevis: /tmp/utekos-meta-continuation-status-20261014.json og
/tmp/utekos-meta-additional-deduped-receipts-20261014.json.

## De to bildekonfliktene lokalisert 14. oktober 05:09 UTC

Native Meta API bekrefter at suppleringsfeed1587905152818228 er koblet til
hovedkilden25304523395872924, App1154247890253046. Commerce Manager viser Image-
prioritet1 App1154247890253046,2 Manual Creation,3 Utekos supplerende
produktattributter. Innstillingen gjelder alle produkter med flere datakilder.
Ingen prioritet eller produktverdi er endret.

UI-filteret for suppleringsfeeden viser nøyaktig to varer på én side:

| Variant-ID | Produkt hos Meta | Meta-produkt-ID | Synlig status | Image-fetch-status fra API |
| --- | --- | --- | --- | --- |
|42903231037688|Utekos Fjellblå - Medium|32878967075052402|Eligible, bilde synlig|direct_upload|
|42903231103224|Utekos Fjellblå - Large|25781244178146916|Eligible, bilde synlig|direct_upload|

Begge lenker til Mikrofiber Fjellblå. API-et returnerer tom image_url, mens UI-et
viser produktbildet. Det er derfor ikke bevis på manglende bilde. Den eksakte
forskjellen mellom suppleringsfilens bilde og gjeldende prioriterte bilde er fortsatt
åpen. En lesende åpning av produktmenyen viste at Commerce Manager-endringer vil
overskrives ved neste oppdatering fra Utekos App Master. Varselet ble lukket uten
å gå videre med redigering.

Bevis: /tmp/utekos-meta-image-source-priority-20261014.json og tilhørende PNG.
Primærkilder lest via native Meta Developer Tools MCP:
[Product Feed](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed)
og [Supplementary Feeds](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/supplementary-feeds).

Suppleringsfilens synlige Download file-lenke ble forsøkt lest. Metas genererte-feed-
CDN svarte Unauthorized / Denied permission for read requests; ingen fil ble lastet
ned. Signert lenke og interne feildetaljer er ikke lagret. Eksakt opprinnelig
bildeverdi krever en lesbar kopi av kildefilen eller fungerende leverandørnedlasting.

## Avgrenset standardhendelses- og senderkontroll, 14. oktober 05:12–05:18 UTC

ViewContent, AddToWishlist, AddToCart og InitiateCheckout fra de eksisterende
04:02–04:32-forekomstene står fortsatt Processed ved05:12:35.960 UTC, omtrent
40–70 minutter senere. Ingen hendelser er sendt på nytt. Samlet testhistorikk er
fortsatt19 forekomster,11 Deduplicated og8 Processed. Processed alene avgjør ikke
om en forekomst senere dedupliseres eller om historisk CAPI nådde riktig datasett.

Browser-wire er bevart for ViewContent/AddToWishlist/AddToCart med forventet Meta-
navn, samme kanoniske eventID og dataset 1092362672918571. Checkout-capturen er
avkortet. Native Supabase viser for alle fire samme ID i kanonisk payload og
forsøksrad, HTTP200/events_received1. Lagret payload er kanonisk. Response har bare
messages/fbTraceId/httpStatus/eventsReceived, payload_summary er null, og endelig
CAPI-navn/ID/pixel er ikke lagret. Den historiske sluttforsendelsen er derfor et
konkret bevishull.

Native Vercel bekrefter backend-prosjekt prj_EHFI28tMUlIQsNguxjcKHPlLAlFE,
deployment dpl_hD5jVde1XRmHRnf1xxohoaK7zeku, READY på main-
SHA 6e8350c86e392b1dc873e788a9611e55c859d3ba med alias backend.utekos.no.
De relevante mapperfilene er uendret mot denne SHA-en: ViewContent/AddToWishlist/
AddToCart/InitiateCheckout og setEventId(event.event_id). Vendoret SDK 26.0.1 kopierer
navn/ID ved normalisering. Dette gir ingen påvist navne-/ID-feil i publisert kode,
men erstatter ikke historisk wirebevis. Et avgrenset runtime-loggsøk04:02–04:03
fant bare to client-ip-operasjoner. Metadata for META_PIXEL_ID finnes i produksjon;
selve verdien ble ikke returnert og er ikke antatt. Ingen ny deployment.

Metas AddToCart-detaljer viser et sjudagers gjennomsnitt for dedupliseringsnøkler:
browser7/server14 med event_id på100% i begge kilder. Inkrementell hendelsesdekning
er80% event_id,20% external_id og0% fbp; total100%. Dette er aggregert nøkkeldekning,
ikke bevis for den valgte forekomstens endelige dedupe eller20% dobbelttelling.

Separat native Meta-kall med event_source/AddToCart for7.oktober05:00–14.oktober
05:00 UTC gir22 timebøtter, SERVER76 og BROWSER38. Dette er volum med en annen
avgrensning/statistikk enn UI-ets gjennomsnitt. Ingen senderidentitet følger med.
UI-grafen eksponerer også serienavnet metaHostedCapiProcessedCount; serienavnet
alene beviser verken trafikk i den serien eller hvilken integrasjon som sender.

Stapes innloggede dashboard05:18 viser Utekos sGTM Container Running/Pro, ingen
Signals Gateways og ingen andre gateways. Native kontoavlesning er active/ikke
blocked; produktavlesning gir0 av5 gratis Signals Gateways. Kontoinventaret er
avklart for denne kontoen. Historisk SERVER-eierskap er fortsatt åpent, og det er
ikke grunnlag for å slå av eller flytte en sender.

Primærkilder lest via native Meta Developer Tools:
[deduplisering](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events),
[verifisering](https://developers.facebook.com/documentation/ads-commerce/conversions-api/verifying-setup)
og [AdsPixelStats](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/stats).
Felles navn/ID på samme pixel er krav; kode og nøkkeldekning alene beviser ikke at
de to konkrete forsendelsene oppfylte dem.

Bevis: `/tmp/utekos-meta-standard-dedupe-investigation-20261014.json`,
`/tmp/utekos-meta-standard-status-followup-20261014.json`,
`/tmp/utekos-meta-addtocart-dedupe-ui-20261014.json` og tilsvarende PNG,
`/tmp/utekos-meta-stape-sender-inventory-20261014.json` og tilsvarende PNG.

## PageView-klassifisering kontrollert uten ny hendelse, 05:21 UTC

Produksjonsfilen `/analytics/meta-pixel-canonical-v1.js` svarer200 og har samme
SHA256 som arbeidsfilen og publisert HEAD50f2647. `page_view` mappes til PageView,
er ikke med i CUSTOM_EVENTS og velger dermed `trackSingle`. Metas gjeldende
[konverteringsdokumentasjon](https://developers.facebook.com/documentation/meta-pixel/implementation/conversion-tracking)
beskriver PageView som standardhendelse;
[flerpixel-guiden](https://developers.facebook.com/documentation/meta-pixel/guides/track-multiple-events)
skiller `trackSingle` fra `trackSingleCustom`.

Den allerede lagrede browserforespørselen har PageView, riktig datasett og ID,
HTTP200 og ingen avlest custom-flagverdi. Meta UI viste likevel Custom event.
En historisk logg over selve fbq-argumentlisten finnes ikke i beviset. Vi har ikke
påvist at en custom-kalltype forårsaket visningen, og gjør ingen endring av sender
eller navn på dette grunnlaget. Bevis:
`/tmp/utekos-meta-pageview-classification-20261014.json`.

## Google-mottak for resten av 35-scope, avlest 05:20–05:24 UTC

Dette er Google-bevis, ikke Meta-mottak. Native Analytics MCP finner property
489598217. Standardrapport for13.–14.oktober i Europe/Oslo viser video_progress38,
view_promotion38, select_promotion2, variant_select13 og size_guide_view17.
Dagens rapport er ufullstendig. Separat realtime-avlesning viser blant annet
variant_select1 og size_guide_view2 i standardens siste30minutter.

Hero/NBCC promotion-markup og HomeVideo/produktvideo er lokalisert i dagens src.
Derimot er ingen gjeldende UI-produsent for filter_apply/sort_apply/open_quick_view
funnet i avgrenset src-søk; schema/bridge/catalog beviser ikke en aktiv brukerflate.
GA4 har bare customEvent:audience og customEvent:form_id registrert. Event-ID og
videomilepæl kan dermed ikke avstemmes som custom dimensions i disse rapportene;
Realtime støtter heller ikke event-scoped custom dimensions. Tallene beviser
aggregert mottak, ikke at hver operatørforekomst er ferdig korrelert.

**Promotion-avvik:** Alle63 avleste view/select_promotion-forsøk mangler
custom_data.items. Dagens observer sender bare promotion-/kreativmetadata, og
backendmapperen utelater cartData når items mangler. Direkte offisiell
[GA4-referanse](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#view_promotion)
krever items for view_promotion. For select_promotion er items valgfritt, men
fravær utelater hendelsen fra enkelte promotion-rapporter og metrikk.
Utekos Docs `data-manager-api/google-analytics-recommended-events` bekrefter dette
for Data Manager-ruten. Et Context7-utdrag merket view-items valgfritt; dette er
forkastet til fordel for direkte primærkilde. Ingen krav er fjernet for å få grønn status.

Bred hero-/NBCC-fordel har ingen avlest valgt produktvariant. En korrekt retting
krever en faktisk produktkobling, eller et begrunnet skille mellom generell
promotion-observasjon og produktspesifikk Google-eksport. Ingen SKU, pris eller
variant er funnet på, og ingen eksport/navn er endret. Dagens kanoniske kilde,
observer, mapper og eksisterende promotion-tester er gjennomlest. Avviket er
reprodusert i lagrede produksjonspayloads; runtime-retting er ikke implementert.

En separat historisk rapport16.september–14.oktober viser open_quick_view38,
generate_lead12 og refund1. Alle25 rader er avlest uten rapportert sampling eller
data_loss_from_other_row. Dette er en annen periode enn Meta-baseline og kan ikke
sammenlignes direkte med den. Ingen ny lead, innsending eller refusjon er produsert.

**Refund-avstemming:** To faktiske produksjonsforsøk fra29.september og5.oktober
har lagret Data Manager SUCCESS, recordCount1, null feil-/advarselskategorier og
destinasjon som matcher samme GA-property. Begge har analytics granted/cookiebot,
ulike event-/transaksjons-/refund-ID-er og validate_only=false. Den første har
null varelinjer, den andre én. GA4s dagfordelte rapport viser bare én refund,
29.september. Årsaken til forskjellen er uavklart; verken automatisk replay eller
en påstand om endelig GA-rapportmottak for begge følger av Data Manager-statusen.

I den samme avgrensede forsøksavlesningen finnes sju form_submit, alle
skipped_unqualified hos Google/Meta/Microsoft. Ingen app/offline-, filter/sort-
eller checkout/payment-error-rader ble returnert. Dette gjelder det avleste
lageret og tidsvinduet; det beviser ikke fravær av andre faktiske kilder.

Dokumentasjon via Context7-fallback etter kjent GoogleDev MCP-innloggingsblokk:
[Realtime](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runRealtimeReport),
[Realtime-felter](https://developers.google.com/analytics/devguides/reporting/data/v1/realtime-api-schema)
og [custom dimensions](https://developers.google.com/analytics/devguides/reporting/data/v1/advanced).
Bevis: `/tmp/utekos-nonmeta-source-receiver-20261014.json` og
`/tmp/utekos-remaining-source-gates-20261014.json`.


## Godkjent backendpublisering og avgrenset buildfeil, 06:36–06:40 UTC

De nøyaktig ti godkjente backendfilene ble committet og pushet med `pnpm run sync`
i cc32139c880ae2a3230691d0a01cf884467069ee. Native Vercel viser ERROR for
`dpl_9Cz5nVqeDkbV9Cn2fZqKiBSi8Sxv`: obligatorisk prebuild fant generert manifestdrift.
Miljøvalideringen i Vercel hadde bestått; Next-build startet ikke.
Produksjonsalias backend.utekos.no ble deretter avlest READY på tidligere
6e8350c86e392b1dc873e788a9611e55c859d3ba / dpl_hD5jVde1XRmHRnf1xxohoaK7zeku.
Push er dermed bekreftet, ny produksjonsretting er ikke bekreftet.

Feilen er reprodusert lokalt og de to genererte manifest-/checksum-filene rettet.
Endringen er bare3+/3− i kildehashene og checksum, uten runtime- eller
hendelsesdefinisjonsendringer. Manifestcheck, fire eksisterende tester, diffcheck
og hele lokale prebuild-kjeden består. Vercel-miljøvalideringen hopper lokalt over
Vercel-spesifikke krav når VERCEL ikke er1, etter scriptets dokumenterte betingelse.
Disse to ekstra filene venter på separat konkret publiseringsgodkjenning.
Bevis: `/tmp/utekos-meta-backend-deployment-failure-20261014.json`,
`/tmp/utekos-meta-backend-manifest-review-20261014.json` og tilhørende patch.

## Metas blokkeringsinventar etter godkjent avtaleaksept, 06:37–06:45 UTC

Parameterinventaret viser0 Action required,0 Unblocked,0 Blocked by user og0
Blocked by Meta, uten eventfilter. Hendelsesinventaret viser2 Action required
(FormError og FormStart, begge Active/Website),1 Blocked (__missing_event,
Inactive/Website/Blocked by you) og13 Confirmed by you (10aktive/3inaktive).
Ingen parameterblokkering, hendelsesstatus eller annen sporingsinnstilling er endret.

Metas [gjennomgangsveiledning](https://business.facebook.com/business/help/344247017987537)
skiller dette fra standardhendelser, som ikke trenger denne gjennomgangen.
Bekreftede custom events kan brukes med annonsefunksjoner; blokkerte kan ikke.
[Prosedyren](https://business.facebook.com/business/help/642275438032995) er lest
via innlogget primærkilde etter native dokumentasjonssøk. Godkjenning forutsetter
at hendelsen er tilsiktet, korrekt formatert og følger vilkårene. Statuslisten
alene beviser ikke at Action required betyr tapt mottak eller forklarer standard-dedupe.

De tidligere avstemte forhandlerforekomstene har FormStart-/FormError-kilder fra
`/bli-forhandler`, kategoriske skjemametadata og tilfeldig attempt_id,
uten feltinnhold. Begge har samme kanoniske ID/tid gjennom ledger og Meta200/events1.
Kontaktskjema ble korrekt hoppet over utenfor dealer-funnel. Publisert historisk
sluttpayload er fortsatt ikke tilgjengelig som wirebevis. Ingen ny skjemahendelse
eller innsending er laget under denne lesingen.
Bevis: `/tmp/utekos-meta-blocked-parameters-readback-20261014.json`,
`/tmp/utekos-meta-event-blocking-readback-20261014.json` og tre event-status-PNG-er.

## Eksakt Google-mottak i BigQuery, 06:44–06:47 UTC

GA4-property489598217 har lesbar råeksport i EU-datasettet analytics_489598217.
Dagens intraday-tabell inneholder de fire allerede kjente ID-ene som view_item,
add_to_wishlist, add_to_cart og begin_checkout, én rad og én varelinje hver.
To ekstra poas_estimate-rader deler ID med henholdsvis cart/checkout, men har annet
hendelsesnavn; de er ikke doble standardevent-rader. Dette er Google-mottak og
lukker ikke Metas standarddeduplisering.

Samme intraday-snapshot viser view_promotion13/select_promotion1 med event_id hos
alle, men items hos ingen. video_progress28, variant_select9 og size_guide_view8
har også event_id. Snapshotet er ufullstendig, og tallene er ikke et nytt20t-vindu.
Googles [eventguide](https://developers.google.com/analytics/devguides/collection/ga4/events)
dokumenterer custom events når anbefalte hendelser ikke passer; en eventuell
separat eksport for generelle merke-/medlemsfordeler krever vurdering av navn,
rapportavhengigheter og reell produktkobling. Ingen eksport er endret.

Refusjonen5.oktober ble søkt både etter navn refund og eksakt hashet event_id i
alle daglige råtabeller2.–12.oktober:0rader. Sammen med DataAPI-fraværet står dette
mot lagret Data Manager SUCCESS/recordCount1 for riktig property. Det er et konkret
åpent avvik, uten kjent årsak. Refusjonen29.september predaterer dette datasettets
opprettelse2.oktober og kan ikke avstemmes her. Ingen refusjon er sendt på nytt.
[Googles eksportskjema](https://support.google.com/analytics/answer/7029846) og
[eksporttyper](https://support.google.com/analytics/answer/9358801) skiller intraday
fra dagstabeller og beskriver sen oppdatering; avlesningen er avgrenset deretter.
Bevis: `/tmp/utekos-ga4-receiver-parameter-counts-20261014.json`,
`/tmp/utekos-ga4-standard-exact-id-20261014.json` og
`/tmp/utekos-ga4-refund-raw-reconciliation-20261014.json`, med eksakte SQL-filer.


## Godkjent bekreftelse av FormStart og FormError, 06:55 UTC

Etter separat faktisk JA ble bare FormStart og FormError bekreftet i datasett
1092362672918571. Meta viste Success; begge navn er deretter lest som
Active/Website/Confirmed by you. Nye totaler er0 Action required,1 Blocked og15
Confirmed. __missing_event er kontrollert fortsatt Inactive/Blocked by you.
Ingen kampanje, custom conversion eller ny skjemahendelse er opprettet.

Gjennomgangen av publisert mapper skiller kanonisk input fra eksport: FormStart
sender custom data form_id, entry_point og en tillatt field_category; FormError
sender form_id, entry_point og en tillatt error_category. form_name, attempt_id
og innskrevet skjemainnhold eksporteres ikke som Meta custom data av denne mapperen.
Disse kildefilene er uendret fra verifisert produksjons-SHA6e8350c. Historisk wire
kan fortsatt ikke rekonstrueres fra mapperen. Bekreftelsen gjelder mulighet til
bruk med ads features, ikke dokumentert attribusjon eller standard-dedupe.
Bevis: approvedConfirmationResult i `/tmp/utekos-meta-event-blocking-readback-20261014.json`
og `/tmp/utekos-meta-form-events-confirmed-readback-20261014.png`.

## Tillegg utenfor de 35 kanoniske oppføringene, 06:54 UTC

GA4-råeksporten viser5 poas_estimate i dagens snapshot. To er eksakt-ID-korrelert
med henholdsvis add_to_cart og begin_checkout. Hvert forventet standardpar
(event_id,event_name) finnes én gang; IDene er dermed ikke globalt unike på tvers
av hendelsesnavn i mottaket. poas_estimate har blant annet estimated_profit,
poas_source_event, event_source og event_time i parameterinventaret. Sender og
beregningsgrunnlag er fortsatt uavklart. Avgrenset src/public/scripts-søk i v2,
backend og headless finner ikke navnet; offentlig GTM-script har heller ingen
bokstavelig poas_estimate-streng. Det utelukker ikke dynamiske GTM-produsenter.
De5 tilleggene beholdes i mottakerinventaret ved siden av de35; ingen Meta-levering
av poas_estimate er påstått. Bevis:
`/tmp/utekos-ga4-extra-parameter-inventory-20261014.json`.

## SDK, Stape og en faktisk ekstra Meta-rute, 07:04–07:10 UTC

Et vanlig organisk forsidebesøk produserte page_view07:04:38.981UTC,
event-ID MD5 e436aabaf964d55d9e15819a7fa002e4. Ingen klikk-ID eller kundeidentitet
ble konstruert. Nettverksopptaket er komplett for de avleste segmentene, uten
avkorting. Samme hendelse har tre observerte ruter:

1. Direkte Pixel GET til facebook.com/tr: PageView, datasett1092362672918571,
   HTTP200, samme ID, fbp og SHA256(external_id).
2. Nettleser-POST til et AWS ECS-endepunkt: samme PageView/ID/datasett/fbp og
   hash av external_id. Responsmetadata viser HTTP200, etterfulgt av ERR_ABORTED.
   Responsbody er ikke tilgjengelig. Fullført gatewaybehandling eller senere
   Meta-mottak er derfor ikke bevist av dette svaret.
3. Kanonisk page-view til backend: nettleseren har202 etterfulgt av ERR_ABORTED,
   men uavhengig Supabase-avlesning bekrefter ferdig providerforsøk07:04:40.726UTC,
   Meta200/eventsReceived1. Lagret fbp og external_id er eksakt like nettleserens,
   client_ip_address finnes, fbc/fbclid mangler. Endelig utgående CAPI-payload
   er fortsatt ikke lagret som wirebevis.

Metas eget lastede `/signals/config/1092362672918571` konfigurerer
openbridge/openbridge3 med det samme AWS-endepunktet og en Cloud Run-fallback.
enrichmentDisabled=true, alwaysRetry=true og useSGWUserData=false er avlest,
ikke endret. Stacken inneholder både Stapes loader og Metas config-script;
OpenBridge-konfigurasjonen er konkret synlig i Meta-scriptet. Metas gjeldende
[Gateway-dokumentasjon](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway)
beskriver at Pixel kan sende parallelt til Meta og en gateway, som deretter
videresender via CAPI. Det forklarer arkitekturen, men beviser ikke historiske
volumer eller eierskapet til denne instansen.

**Motstrid som ikke er løst:** Native dataset_details viser NOT_ONBOARDED/NO_UPSELL.
Metas Integrations viser9 Gateway-applikasjoner, men aktuell pixel1092362672918571
er ikke blant dem. Den dokumenterte adminstien `/hub/capig` på observert AWS-host
viser Resource not found. Ingen alternative stier ble gjettet, og ingen gateway
ble opprettet, deaktivert eller endret. Den aktive nettverksruten skal beholdes
i avsenderinventaret selv om Stape-kontoen ikke viser gateways.

Test Events viser fremdeles de tidligere19 forekomstene fra sin eksisterende
testøkt; den nye ordinære sidevisningen er ikke avlest der. Den legges derfor
ikke til antallet11 Deduplicated, og fraværet i testøkten er ikke tapsbevis.

### Ti trinn i Metas kombinerte Parameter Builder-flyt

Trinnene følger den offisielle [arbeidsflyten](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library/workflow-and-examples),
oppdatert26.mars2026 og hentet via native Meta Docs. Tabellen nedenfor bevarer avlesningen før21c1ad4. SDK-versjonen er fortsatt1.3.2, mens den senere første-dispatch-rettingen og separat upublisert trefilsoppfølging er dokumentert i fbc-avstemmingen.

| Trinn | Faktisk bevis | Status / gjenværende grense |
| --- | --- | --- |
|1. Last klient-SDK og await processAndCollectAllParams|Dynamisk import og await er avlest i publisert kilde; ordinær sidevisning viser resulterende parametre.|Kode og effekt avlest; selve funksjonskallet er ikke instrumentert i produksjon.|
|2. Kall eget IP-endepunkt|Nøyaktig én POST /api/meta/client-ip, HTTP200.|Bekreftet for dette dokumentet.|
|3. Returner IP til SDK|Gyldig IPv4-respons før page-view-kallet.|IPv4 observert; IPv6-grenen krever faktisk IPv6-forbindelse.|
|4. Lagre IP i _fbi|Cookie finnes og inneholder eksakt IP fra responsen, sammenlignet bare i minnet.|Likhet bekreftet; ingen IP eller cookieverdi lagret.|
|5. Send normale backendkall med førstepartscookies|Kanonisk request har _fbp, _fbi, utekos_external_id og user_id i ublokkerte cookie-headerdata.|Bekreftet for én organisk page_view.|
|6. Behandle request med server-SDK|processRequestFromContext/ensureCanonicalMetaBrowserIds er avlest; serverpayload har fbp og IP.|Runtime-effekt avlest, ikke intern funksjonstrace.|
|7. Motta SDK-listen med cookies som skal settes|Publisert kode bruker cookiesToSet og proxyvideresending.|Dette besøket hadde eksisterende _fbp og ingen ny fbclid; en ny SDK-cookieinstruksjon er ikke observert.|
|8. Sett anbefalte cookies i HTTP-svar|Proxyen har eksplisitt Secure/Lax/sti/domene. Dette besøket viser _fbp/_fbi secure=false etter klient-SDK.|Eksisterende attributter er avlest; hele fornyelsesløpet er ikke bevist. Ingen cookie slettet for å tvinge det.|
|9. Les fbc/fbp/IP og normaliser/hash PII|fbp og ekstern-ID matcher browser/backend; Pixel og OpenBridge har SHA256 av samme ekstern-ID. Servermapper bruker SDK for external_id.|fbc mangler korrekt uten reelt annonseklikk. Kunde-PII og SDK-appendiks i endelig CAPI-wire krever legitim kilde.|
|10. Send til Meta og kontroller mottak|Direkte Pixel200; backend Meta200/events1; ekstra OpenBridge-rute påvist.|API-aksept bekreftet. Endelig behandling/dedupe/attribusjon for denne nye forekomsten er åpen.|

`externalIdEqualsUserIdCookie=false` er ikke et påvist korrelasjonsbrudd:
den kanoniske external_id er eksakt lik cookie `utekos_external_id`, som er den
publiserte kontrakten. `user_id` er en separat tilfeldig32-heks master-ID for
Cookie Keeper. Begge cookies finnes; de skal ikke antas å være samme identitet.
Den faktiske likheten mellom kanonisk browser og backend er kontrollert separat.

### Stape: observerte virkninger og åpne grenser

Native avlesning bekrefter Cookie Keeper aktiv og Enricher automatic, med cookie-
og storekilde aktive/requiresConsent=false. To faktiske __sgtm-POST (page_view og
view_promotion) fikk200 og satte _sbpee med90d, Secure, HttpOnly og SameSite=Lax.
Browserbody hadde ikke fbp/fbc/email-felt, men requestens cookies inkluderte _fbp,
_ga og _sbpee. consent_state var true for alle sju formål, samtidig som kanonisk
consent var operator_policy/granted. Dette er faktisk cookieadferd, ikke bevis
for hvilken beriket sluttpayload en downstream-tag sender.

Stapes [Enricher-veiledning](https://stape.io/helpdesk/documentation/enricher-power-up)
(31.august2026) beskriver _sbpee og automatisk berikelse av /g/collect og /data.
Vår observerte rute er den genererte __sgtm-ruten; vi har ikke avlest transformert
server-event eller dokumentert at Enricher beriker den direkte Meta-CAPI-ruten.

Custom Loader hentet apgqnrnczg.js uten kp-prefiks i Chrome. Generert publisert
loader aktiverer kp-grenen bare ved Safari16.4+ og tilgjengelig user_id.
Det er dermed ikke bevis på Cookie Keeper-feil. Stapes [Cookie Keeper-veiledning](https://stape.io/helpdesk/documentation/cookie-keeper-power-up)
(2.oktober2026) beskriver en separat Safari-gjenopprettingstest. Denne er ikke
utført; ingen cookies er slettet, ingen annonse-ID laget og intet nettleservern
endret. Besøkendes avslag/tilbaketrekking er heller ikke testet; operator_policy
forblir eksplisitt forskjellig fra et registrert besøkervalg.

Etter denne avlesningen stoppet brukeren gateway-sporet uttrykkelig: «Vi skal
ikke ha noe gateway-rute. Så det må du ikke fortsette». Eier-/loggjakten ble
stoppet. Brukeren ga deretter et særskilt mandat: «Fjern også den eksisterende
koblingen», kun OpenBridge/gatewaykoblingen for1092362672918571. Nødvendig
avgrenset lokalisering av denne frakoblingen er utført nedenfor. Ingen gateway
er opprettet, fjernet eller endret av agenten. Reelt fbclid, faktisk kunde-PII,
IPv6, Safari og pagehide har fortsatt åpne bevisgrenser.

Avgrenset lesing før stopp: Cloud Run-koblingene svarte UNAUTHORIZED/UNAVAILABLE.
Eksisterende gcloud viste6 tilgjengelige prosjekter; ingen prosjektnummer matchet
tallsekvens1053047382554 i observert fallbackhost. To prosjekter returnerte tomme
Cloud Run-lister i us-central1; fire returnerte SERVICE_DISABLED. Dette er bare
avlest prosjekt/region, ikke globalt fravær. AWSCLI-sesjonen var utløpt før
identitetslesing; det er ikke bevist at profilen eier gatewayen. Ingen API ble
aktivert, ingen innlogging startet og ingen mottakslogger lest.

Bevis: `/tmp/utekos-meta-identity-openbridge-observation-20261014.json`,
`/tmp/utekos-meta-identity-provider-readback-20261014.json` og
`/tmp/utekos-meta-gateway-integration-inventory-20261014.png`.

### Historisk tilgangsvurdering 07:22–07:31 UTC — motbevist og supersedert

**Denne tilgangsgaten gjelder ikke lenger.** Brukerens skjermbilder viste riktig kontroll i delt business538548380599665, og brukeren utførte frakobling07:59UTC. Etterkontrollen nedenfor08:13 erstatter konklusjonen. Avsnittet bevares kun som historikk.

**Koblingen er ikke fjernet.** Native Meta-dokumentasjon beskriver
[Events Manager → Data Source settings → Conversions API → See Details → Settings → Disconnect](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/uninstall)
(oppdatert2.februar2025, kun trinn1–3). Mål-piksel1092362672918571 er avlest både
under annonsekonto772268237116474 og eierporteføljen Utekos Marketing Data Layer,
business1384717111999921. Begge viser bare **Conversions API • Web-only,
Connected/Active**, ett datasett med korrekt ID. Ingen gatewaykort, See Details
eller Disconnect er tilgjengelig. Datasettets Manage integrations har CAPI,
Meta Pixel og Lead Ads; CAPI-menyen tilbyr bare Start sending events from server.

Eierporteføljens gatewayinventar inneholder9 applikasjoner, med pikslene
1778902539655793,2052786378821987,2174282979765462,851856784457835,
745055865287850,897063376193007,1376489127817118,2015929569140612 og
594494633749755. Mål-pikselen finnes ikke. Ingen av de ni er endret.

[OpenBridge-konfigurasjonskanten](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/openbridge_configurations)
(18.mars2026) støtter lesing, men ikke create/update/delete på akkurat denne
kanten. Det betyr ikke at enhver annen offisiell API er umulig.
[Gatewayens kildeadministrasjon](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/data-source-management)
har Remove data source for en identifisert piksel, og
[Control Plane API](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/pixel-management)
har målrettet deleteDataSource. Sistnevnte krever riktig administrasjonsdomene,
tenant og autentisert kontekst, som ikke er identifisert. Data-endepunktet i
Pixel-config er ikke dokumentert som administrasjonsdomene.

Neste nødvendige tilgang er en støttet frakoblingskontroll for akkurat denne
pikselen i Meta eller dens faktiske gateway-administrasjon. Ingen endepunkt,
tenant eller eierskap gjettes. Ingen ny AWS/GCP-innlogging, API-aktivering,
infrastruktursletting eller endring av direkte Pixel/CAPI/Stape er utført.
Etter faktisk frakobling gjenstår provider-readback, nyinnlastet Pixel-config,
komplett ordinært nettverk uten gatewayrute og fortsatt direkte Pixel/CAPI-aksept.
Tidligere200+ERR_ABORTED er fortsatt bare historisk transportbevis.

Bevis: `/tmp/utekos-meta-gateway-disconnect-gate-20261014.json`,
`/tmp/utekos-meta-gateway-disconnect-settings-gate-20261014.png` og
`/tmp/utekos-meta-gateway-disconnect-owner-inventory-20261014.png`.
Skjermbildene er åpnet og avlest. Ingen mutasjon er påstått.

Lokal supportsak er klargjort i
`/tmp/utekos-meta-openbridge-removal-support-draft-20261014.md`.
Den ble ikke sendt. Supportsporet er lagt bort etter brukerens frakobling; det avventes ikke lenger svar om innsending. Ingen ny disconnect skal utføres som del av etterkontrollen.

### Lokal lifecycle-kontroll, avsluttet 07:35 UTC

Åtte eksisterende retry-/aksepttester og åtte avgrensede lifecycle-/identitetstester
bestod, inkludert Chromium/WebKit. Offline-fixturen oppfyller eller avviser alle
requests og sender ingen produksjonshendelse. MDNs native dokumentasjon for
[pagehide](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event)
og [visibilitychange](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event)
ble avlest sammen med kompatibilitetsdata og installerte Next16.4-dokumenter.

Et separat forsøk viste i begge motorer at en blokkert Google-ID-venting ikke
slipper collector innen 1,5 sekunder etter syntetisk hidden. Samtidig bestod
hidden→visible etter100ms: den ene kanoniske hendelsen beholdt gyldig client_id/
session_id som kom etter1,5sekunder. Dette viser venting og en identitetsavveining,
ikke faktisk mobilt prosesstap eller manglende Meta-mottak. Umiddelbar flush på
hidden kan tape de forsinkede Google-ID-ene ved vanlig fanebytte.

Ingen runtimeendring ble gjort. De eksperimentelle testtilleggene er fjernet,
og tracked diff-hash er eksakt opprinnelig3bdc3079ba180024bd5b9187eefddc06e28eec0a97915328b851e522a6fc487b.
Bevis: `/tmp/utekos-tracking-hidden-lifecycle-experiment-20261014.json` og
tilhørende `.patch`. Det ble ikke kjørt en ny bred suite etter tilbakeføringen.

Restarbeidsvurderingen07:40 dekker alle35 rader, de fem mottatte poas_estimate-
forekomstene og SDKs10trinn i
`/tmp/utekos-tracking-remaining-scope-assessment-20261014.json`.
Seks kanoniske rader har fortsatt ny legitim lesing av eksisterende GA4-/GTM-data;
ingen er erklært fullt verifisert. Uobserverte SDK-grener krever faktisk IPv6,
legitim cookieopprettelse/-fornyelse, reelt annonseklikk/kundegrunnlag eller bedre
observasjonstilgang. Det tidligere ufullstendige Safari-opptaket gjentas ikke uten
en konkret ny metode.

### Avsluttet avgrenset Google-oppfølging, 06:59–07:00 UTC

De to kjente poas_estimate-parene har event_source=web og poas_source_event
add_to_cart/begin_checkout. estimated_profit er numerisk, men forskjellig fra
value. Dette er mottatte etiketter, ikke uavhengig senderidentifikasjon.
GA4 UI viser bare én create-event-regel (signup_newsletter fra generate_lead/
newsletter_signup), ingen modify-event-regler og Internal Traffic-filter i
Testing. Ingen av disse avlesningene forklarer den manglende5.oktober-refusjonen.
Data Manager-records har korrekt property, client/session til stede, gyldig
format, positiv NOK-verdi og én levering per transaksjon. Ingen replay er gjort.
Bevis: `/tmp/utekos-ga4-poas-source-readback-20261014.json` og
`/tmp/utekos-ga4-refund-poas-bounded-followup-20261014.json`.


### Utvidet mottakskorrelasjon og publisert GTM, 07:47–07:57 UTC

GA4-råeksporten inneholder alle 11 utvalgte (event_name, event_id)-par: to
variant_select, én size_guide_view, seks video_progress og to kvalifiserte
product_reservation generate_lead. Hvert forventet par har én rad i de avleste
12.–14. oktober daily/intraday-tabellene. Alle 33 kontrollerte ikke-tomme feltverdier
samsvarer: variant/interaction_id, guide_id/open_sequence, videoandel/varighet,
form-/leadkategori og page_view_id. Ingen kontaktverdier eller bruker-ID-er er
lagret; korrelasjons-ID-er er hashet. De egne event_time/event_source-parametrene
finnes ikke i disse 11 råeventradene; event_timestamp er avlest separat og hevdes
ikke identisk med kildehendelsens millisekunder. Én råeventrad identifiserer ikke
avsender eller browser/server-dedupe. Intraday er foreløpig, som forklart i
[Googles eksportskjema](https://support.google.com/analytics/answer/7029846).

De to faktiske leadene har også Meta accepted_unverified/HTTP200/eventsReceived1,
uten skip eller feil i de to endelige forsøksradene. Kanonisk user_data har én
gyldig SHA256-verdi i hver email_sha256-/phone_sha256-array. Faktiske hashverdier
er ikke hentet ut. Publisert SHA6e8350c mapper til Lead, beholder event_id og
setter website; dette er kodebevis, ikke bevart sluttpayload. Metas egne kildefiltrerte
statistikker viser Lead WEB1/SERVER2 i både12.oktober06–07UTC og13.oktober07–08UTC.
Statistikkens -0700-tidsstempler er avstemt mot disse UTC-vinduene. Bøttene har ingen
ID-er, så de tilordnes ikke sikkert til akkurat disse kildene og er ikke dedupebevis.
Andre lead ble sist behandlet14.oktober02:36:14 med attempt_count2. Ingen ny sending.

Native GTM-MCP fungerer igjen i denne avlesningen. Komplette publiserte ressurser
viser web175 (15tagger/11triggere/27variabler) og server44 (1tagg/5triggere/
6variabler/3transformasjoner/3klienter). Servertransformasjon55 aktiveres for
Data Client og add_to_cart/begin_checkout, setter event_name=poas_estimate,
poas_source_event=opprinnelig navn og estimated_profit={{POAS - Stape margin}}.
Den eneste servertaggen er GA4 til G-FCES3L0M9M. Dette forklarer definisjonsmessig
at backendens separate standardhendelse og den avledede poas_estimate kan ha
samme ID med to forskjellige navn. De to tidligere eksakt korrelerte råparene
samsvarer med ruten. Det er ikke deduplisering, og ingen Meta-levering er bevist.
Transformasjonens virkemåte er kontrollert mot
[Googles dokumentasjon](https://developers.google.com/tag-platform/tag-manager/server-side/transformations).

Variabel54 bruker samme containers POAS-feed og GA4 item_id, fjerner et eventuelt
Shopify ProductVariant-GID-prefiks, cacher hvert oppslag i15minutter og runder
summen til to desimaler. Quantity har standard1, rabatt standard0. Absolutt margin
beregnes som (feedmargin−varerabatt)×antall; prosentmargin som
(pris×feedprosent/100−varerabatt)×antall. Ingen prisfallback er aktiv. Tom items eller
manglende/nonnumerisk margin for én vare returnerer undefined, ikke oppdiktet
nullfortjeneste; negative resultater klampes ikke. Malen gjør ikke eget mva-fradrag.
Om historisk feedmargin allerede er uten mva., og de konkrete historiske
marginverdiene, er ikke verifisert. [Stapes dokumentasjon](https://stape.io/helpdesk/documentation/poas-data-feed-power-up)
bekrefter feedoppslaget; det erstatter ikke faktiske historiske feedverdier.

Promotion er med i web Data Tag-trigger183, men den aktive serverens Data Client-
trigger53 videresender bare page_view/add_to_cart/begin_checkout. Web GA4-eventtaggene
er pauset. Data Tag-feltlisten inkluderer heller ikke promotion_id/name/creative_name/
creative_slot. Dette beskriver denne GTM-ruten; backendens separate Google Data
Manager-rute stopper ikke av den grunn. De tidligere 13 view_promotion +1
select_promotion-råmottakene og items-avviket består. Konkrete Google-rapportbehov
og semantisk korrekt eksport for generelle hero/NBCC-fordeler må fortsatt avklares.
Ingen navn, mapping, tagg eller innstilling er endret.

Bevis: `/tmp/utekos-ga4-extended-exact-id-verification-20261014.json`, kilde- og
råfilene den lenker, `/tmp/utekos-meta-existing-leads-receiver-20261014.json` og
`/tmp/utekos-gtm-published-poas-promotion-20261014.json`. Alle35 katalograder,
én ekstra poas_estimate-type (fem tidligere forekomster), SDKs10trinn og åpne
Meta-/tilgangs-/naturlig-kildeporter er beholdt.

## Statuskorreksjon 14. oktober 08:13 UTC

Backend e9b4b05 er nå Vercel READY og produksjonsalias backend.utekos.no peker på samme SHA. Bare nødvendige genererte manifestfølgefiler ble publisert etter den allerede godkjente ti-fils rettingen; nytt faktisk Purchase-mottak gjenstår.

Den tidligere gateway-tilgangsgaten er motbevist: brukerens frakobling er registrert i korrekt delt business 538548380599665 (eier1384717111999921). History har frakobling07:59 og generisk CAPI-tilkobling08:01. Generisk historikk beviser ikke gateway-reonboarding. Fersk Pixel-config08:01:54 har likevel OpenBridge og ny AWS-host; faktisk POST200+ERR_ABORTED. Direkte Pixel200/fullført og backend200/events1 er korrelert for ny PageView. Ingen gatewayinnstilling er endret av agenten. Supportsaken er ikke sendt. Se `/tmp/utekos-meta-gateway-after-user-disconnect-20261014.json`.

Aktiv Meta-diagnose om identiske web Purchase-priser er bekreftet; først oppdaget22.september og aktivliste siste3d uten eksakt sistetid. Den avgrensede historiske avstemmingen og GTM/Stape-kontrollen er nå avsluttet som beskrevet nedenfor. Se `/tmp/utekos-meta-purchase-value-diagnostic-20261014.json`.

## Purchase-prisavstemming, avsluttet 08:26 UTC

Metas aktive diagnose er fortsatt uavklart. Den tilgjengelige kildehistorikken har
varierende verdier, men Events Manager eksponerer ikke de faktiske mottatte
Purchase-verdiene eller diagnosekohorten. Ingen hardkodet prisfeil er reprodusert,
og ingen prispatch, ny handel eller replay er gjort.

Native Supabase returnerte 44 forsøksrader fra 16. september til avlesningen
14. oktober 08:22 UTC, under grensen 100 og uten videre paginering. Av disse har
42 komplette kanoniske Purchase-payloads og 42 unike event-ID-hasher. Alle har
HTTP200/accepted_unverified. De to separate forsøksradene fra 21. september har
ikke bevart kanonisk payload og inngår ikke i pris-/betalingskonklusjonen.

| NOK-verdi | Komplette kanoniske payloads |
| --- | ---: |
| 944 | 3 |
| 1 690 | 3 |
| 1 790 | 4 |
| 1 890 | 3 |
| 1 990 | 21 |
| 2 089 | 1 |
| 2 169,10 | 3 |
| 3 980 | 4 |

Alle 42 er numeriske og positive. Kobling på kanonisk order_name til Shopify-
snapshot gir 42/42 like beløp og valuta; rå koblingsnøkkel er utelatt fra beviset.
Alle snapshots er PAID, men teststatus var ikke tilgjengelig der. Derfor ble
Shopify lest separat med filter created_at fra 16. september 00:00 til før
14. oktober 08:00 UTC, test:false og financial_status:paid. To komplette sider
inneholder 43 unike ordre, alle ikke-test og betalt; hver har én SUCCESS SALE
lik ordretotalen. De 42 kanoniske hendelsene matcher 42 unike processedAt+beløp-
par i dette utvalget. Dette er en annen koblingsnøkkel enn snapshotets order_name.
Én ekstra Shopify-ordre på NOK 1 990 fra 16. september 07:34:05 UTC forklarer
forskjellen mellom utvalgene; den beviser ikke manglende Meta-mottak. Det finnes
ingen NOK 10-verdi i dette utvalget; NOK 2 169,10 er én desimalverdi.

Et eksplisitt kildevindu 11. oktober 08:00–14. oktober 08:00 UTC har ti payloads
og seks ulike beløp. Dette er ikke identifisert som Metas diagnosekohort. Meta
viser 43 Purchase i oversikten 16. september–13. oktober, Conversions API og
EMQ9,3/10. Den separate parameteroversikten angir sjudagersvolum 2 og 100%
value-/event_id-/external_id-dekning, uten faktisk verdifordeling. Sampled
activities for siste 24 timer har null synlige rader og opplyser at custom data
ikke vises; parametre og referring URL er fjernet. Event source viser Website,
men identifiserer ikke konkret avsender. Likhet mellom oversiktstallet 43 og
Shopifys 43 er ikke en korrelasjon på event-ID eller dedupebevis.

Gjeldende [Meta-parametere](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/custom-data)
krever numerisk monetær value og valuta for Purchase. Avlest backend e9b4b05
videresender custom_data.value uendret; contents.item_price er et separat felt.
Shopifys tilkoblede Next Meta v15, avlest 01:34 UTC, bruker checkout.totalPrice
og checkout.currencyCode ved checkout_completed. Dette er dagens observerte
mapping, ikke rekonstruert historisk wire. Web175/server44 har ingen aktiv
Meta-Purchase-tagg; Data Tag-triggeren inkluderer ikke purchase. Historiske
gateway-Purchase-payloads er ikke eksponert. Dermed er verken lavt mottaksutvalg,
en annen avsender eller historisk transformasjon fastslått som årsak.

Aggregert bevis uten ordre-/kundekolonner:
`/tmp/utekos-meta-purchase-value-reconciliation-summary-20261014.json`.
Detaljer: `purchase-value-source-reconciliation`, `purchase-value-shopify-live`,
`purchase-value-sender-inventory` og `purchase-receiver-value-readback` under
`/tmp/utekos-meta-…-20261014.json`. Visuelt kontrollert skjermbilde:
`/tmp/utekos-meta-purchase-parameter-metrics-20261014.png`.
Neste nødvendige mottaksbevis er Metas konkrete diagnoseverdier hvis de blir
tilgjengelige, eller full wirekorrelasjon ved en naturlig kvalifisert handel.

## Avgrenset GTM/Stape-runtimekontroll, avsluttet 08:14 UTC

Native web175 og faktisk Custom Loader stemmer overens, inkludert pauset
MetaParity153, gammel MetaPixel170 og SignalsGateway171. Server44 har bare
aktiv GA4-tagg. Det komplette opptaket 08:13:51.952–08:14:03.652 UTC har 285
nettverkshendelser uten avkorting. Faktisk loader, Google-config og Data Tag
inneholder ingen OpenBridge/AWS/cbq/signals-aktivering. Metas mål-pikselconfig
inneholder endpoint og OpenBridge-opt-in. Stapes to rammer i initiatorkjeden er
generiske fetch-wrappere; AWS-adressen matcher ikke deres omskrivingsprefikser
og blir ikke endret. Dette identifiserer runtimekilden, ikke hvem som historisk
opprettet Meta-konfigurasjonen. Ingen GTM-/Stape-endring er gjort.

Bevis med native versjoner, faktisk script-hash og initiatorgrense:
`/tmp/utekos-gtm-stape-gateway-route-20261014.json`. Brukerens frakobling er
registrert, men bortfall av gatewayruten er fortsatt ikke verifisert i nettverk.


## Produksjonstestkode og POAS-avvik — 14. oktober 08:52 UTC

Testingen i Metas Test Events er avsluttet. TEST85266 er ikke funnet i full
produksjonsinventarliste for frontend (265 variabler) eller backend (94 variabler,
0 skjulte produksjonsvariabler), i lokale miljøfiler, i publisert kanonisk
pikselskript eller i alle publiserte tagdefinisjoner i web-GTM175/server-GTM44.
Backend leser valgfri META_TEST_EVENT_CODE; variabelen er ikke satt. Ingen
produksjonsinnstilling er fjernet eller endret i denne kontrollen. En kode vist
av Metas testverktøy er ikke i seg selv bevis på at den sendes i produksjon.
[Meta krever at test_event_code fjernes fra produksjonspayload](https://developers.facebook.com/documentation/ads-commerce/conversions-api/using-the-api).
Dette er konfigurasjons- og kodebevis, ikke en avlesning av alle historiske CAPI-payloads.

Alle fem poas_estimate-forekomstene i det tidligere avgrensede GA4-vinduet er nå
korrelert med hver sin standard add_to_cart/begin_checkout-rad. Hver viser
estimated_profit=-340, value=676 og NOK. Native Supabase-avlesning av samme fem
hash-ID-er viser én Comfyrobe™-varelinje med unit_price=676, discount=676 og quantity=1.

Stapes faktiske POAS-oppslag for variant43959919051000 returnerer absolutt
margin336, updated_at2026-10-04T08:54:41.71544Z. Shopify viser nå salgspris845
og førpris1690 for Fjellnatt / XS / Unisex. Prosjektets dokumenterte kostgrunnlag
for varianten er340 ekskl.mva.; feedens336 tilsvarer676−340. Det er et
katalogbasert estimat, ikke en ny kontroll av leverandørfakturaer.

Publisert variabel54 har useDiscount=true. Den publiserte malen beregner derfor
(336−676)×1=−340, som gjenskaper alle fem mottatte GA4-verdiene. Rabattfradraget
kommer i tillegg til at feedmarginen allerede bygger på katalogens salgspris.
[Stapes mal advarer mot dobbelt rabattfradrag når prisgrunnlaget allerede er rabattert](https://github.com/stape-io/stape-store-margin-lookup-variable/blob/main/template.tpl).

En patch med bare useDiscount=true→false er klargjort. Den publiserte malens
kode er kjørt lokalt med mockede oppslag:11/11 kontroller består, inkludert de
fem faktiske varelinjene, flere enheter, manglende margin og legitim negativ
margin. Forslaget gir336 for de fem varelinjene. Endringen er **ikke publisert**;
særskilt godkjenning for denne nye GTM-publiseringen er forespurt. Estimatet er
fortsatt katalogbasert; ekstra transaksjonsspesifikke kuponger krever annet
prisgrunnlag. Faktisk Purchase-profit beregnes separat.

Dette forklarer de utvalgte GA4-estimatene. Det beviser ikke at GTM/Stape er årsak
til Metas Purchase-prisdiagnose. Historisk feedrespons og hver enkelt utgående
server-GTM-forespørsel er ikke bevart. Ingen nye Test Events, ordre eller replay
er brukt. Alle35 katalograder og SDK-matrisens10trinn består som arbeidsscope.

Bevis: `/tmp/utekos-meta-test-code-current-check-20261014.json`,
`/tmp/utekos-meta-test-code-provider-check-20261014.json`,
`/tmp/utekos-meta-frontend-env-current-check-20261014.json`,
`/tmp/utekos-poas-double-discount-reconciliation-20261014.json` og
`/tmp/utekos-poas-discount-fix-plan-20261014.json`.


## Promotion-mottak og rapportavhengigheter — 14. oktober 2026

GA4 Data API for egenskap489598217, 1.–14. oktober i Europe/Oslo, viser143
view_promotion og14 select_promotion. Rapporten med itemPromotionId/itemPromotionName
og itemsViewedInPromotion/itemsClickedInPromotion returnerer ingen rader. Begge
rapportene er uten sampling og uten data_loss_from_other_row. Dette beviser
hendelsesmottak, men ikke fungerende produktbasert promotion-rapportering.

En separat kildeavlesning av329 Google-dispatchforsøk fra1. oktober00:00UTC til
14. oktober08:54UTC finner ingen items. Forsøksantallet og GA4-antallet har ulike
vinduer og tellegrunnlag; forskjellen er ikke bevis på tap eller deduplisering.
Dagens home-hero og NBCC-flater har generelle promotion-metadata uten konkrete
varelinjer. Ingen SKU skal konstrueres for å fylle rapporten.

GA4 har bare audience og form_id som registrerte egendefinerte hendelsesdimensjoner.
Admin viser fem viktige hendelser: add_payment_info, add_to_wishlist, generate_lead,
purchase og signup_newsletter. Den eneste opprettingsregelen lager signup_newsletter
fra generate_lead med form_id=newsletter_signup; endringslisten er tom. Alle16
målgrupper er avlest uten eksplisitte promotion-betingelser. All Users omfatter
fortsatt hendelsene gjennom sin generelle regel.

Forretningsmål og Livssyklus publiserer begge standardrapporten ecomm-promotion.
Ved kontrollen08:59UTC var seks egendefinerte detalj-/oversiktsrapporter
identifisert, mens definisjonene, utforskninger og eksterne rapportavhengigheter
ennå ikke var ferdig kontrollert. Ny avlesning nedenfor presiserer status. En
produktmålgruppe bruker dessuten den bokstavelige item_id-verdien id_of_item;
formålet med denne regelen er uavklart, og den er ikke endret.

Ingen hendelsesnavn, kode eller providerinnstillinger er endret. Kandidatdesignet
med egne Google-hendelser for generelle bannere er fortsatt en vurdering, ikke
implementert løsning. Evidens: /tmp/utekos-ga4-promotion-dependency-readback-20261014.json.


## Godkjent POAS-retting publisert — 14. oktober 09:17 UTC

Brukeren godkjente uttrykkelig publisering av bare useDiscount=false i
servervariabel54, POAS - Stape margin. Arbeidsområde50 var uten andre endringer
eller konflikter, og både siste og aktive versjon var44. Oppdateringen brukte
variabelens aktuelle fingerprint.

Versjon45 ble opprettet uten rapportert kompilator- eller synkroniseringsfeil.
Alle37 konfigurasjonsobjekter ble sammenlignet mot versjon44: bare variabel54
var endret. GTM fjernet samtidig de deaktiverte underfeltene discountKey,
discountType og discountFormula. Den faktiske mal52 definerer disse under
useDiscount; beregningen bruker dem ikke når bryteren er false. Alle tagger,
utløsere, maler, klienter, transformasjoner og containerinnstillinger er uendret.

Publisering svarte med versjon45, fingerprint1791969346738 og ingen rapportert
kompilatorfeil. En separat live-avlesning bekrefter versjon45 og useDiscount=false.
Det nye arbeidsområdet51 er tomt for endringer og konflikter. Tidligere11/11
lokale kontroller av samme mal består. Ingen testhendelse, ordre eller replay
ble sendt som del av publiseringen.

GA4-råeksporten ble lest09:18:42UTC med nedre hendelsestidsgrense lik
publiseringstidspunktet09:17:12.948UTC. Fem andre hendelser finnes etter denne
grensen, men ingen add_to_cart, begin_checkout eller poas_estimate. Dermed er
publisert konfigurasjon verifisert, mens beregnet verdi hos GA4 etter rettingen
fortsatt trenger en kvalifisert naturlig hendelse. Intraday-eksporten er best effort,
ikke en fullstendighetsgaranti.

Dette endrer GA4s katalogbaserte marginestimat før kjøp. Metas Purchase-prisvarsel
er fortsatt uavklart. Bevis: /tmp/utekos-poas-publication-20261014.json og
/tmp/utekos-ga4-poas-after-publication-20261014.json, med separat SQL-fil.

## Rapportavhengigheter og naturlig POAS-mottak — 14. oktober 09:33 UTC

GA4 Library viser35 rapporter. Den observerte reportconfig-responsen inneholder
ni egendefinerte rapportmetadata; tre tilhørende egendefinerte kort har ingen
filtre. Alle elleve lagrede sammenligninger er systemdefinerte og filtrerer på
kanalgruppe, enhetskategori eller plattform, eller har ingen filter. Ingen av
disse har eksplisitte promotion-betingelser.

Tre detaljrapporter er åpnet lesende: trafikkanskaffelse, hendelser og kopi av
sider/skjermer. Alle viser «Legg til et filter» uten lagret rapportfilter.
Hendelsesrapporten viser3758 view_promotion i16.september–13.oktober, av32435
hendelser totalt. Dette er et annet vindu enn Data API-avlesningen1.–14.oktober.
Fire oversiktsvisninger er lest; to ekstra Acquisition overview-varianter er
bare dekket av metadata og kortreferanser. Ikke alle innebygde kortfiltre er
åpnet, og ekstern rapportering er ikke inventert.

Den eksisterende utforskningen «Free form» viser historiske view_promotion og
select_promotion. De tre valgte hendelseskategoriene er Skjermvisning,
Konvertering og Annet; Feil er ikke valgt. Dette er kategorier, ikke filtre på
bestemte hendelsesnavn. Ingen bruker-ID eller individuell tidslinje er lagret
i bevisfilen. Utforskningen ble forlatt uten endring av innstillinger.

Rapporter etter hendelsesnavn vil dele historikken hvis fremtidig eksport får
nye navn. Eksportdesignet må derfor beskrive kontinuiteten mellom gammel og
ny rapportering. Dette er en påvist rapportavhengighet, ikke grunnlag for å
konstruere produktvarer til generelle bannere. Ingen hendelsesnavn, kode eller
rapportinnstilling er endret.

En ny avgrenset GA4 BigQuery-avlesning09:33:26UTC viser25 hendelser med
hendelsestid etter GTM-publiseringen09:17:12.948UTC, men fortsatt0 add_to_cart,
begin_checkout og poas_estimate. Siste mottatte hendelsestid er09:32:02UTC.
Dermed er det ennå ingen kvalifisert naturlig forekomst som kan bekrefte den
nye marginberegningen hos GA4. Ingen nye testhendelser er sendt.

Bevis: /tmp/utekos-ga4-promotion-report-dependencies-20261014.json og
/tmp/utekos-ga4-poas-after-publication-followup-20261014.json.

## Ny Meta-avlesning — 14. oktober 09:40 UTC

Produksjonsrapporten svarte HTTP200 kl.09:40:16UTC. Det rullerende20-timersvinduet
13.oktober13:40:13UTC–14.oktober09:40:13UTC viser4341 hendelser fordelt på17 navn.
Metas event- og event_processing_results-paginering er fullført over to sider hver.
Utvalgte tellinger: Purchase1, AddToCart18, InitiateCheckout9, AddToWishlist6 og
AppendClickAttribution1. AppendAttribution er ikke returnert i dette vinduet.

Purchase har fortsatt EMQ9,3/10, men kilden returnerer ikke Purchase-dedupefeedback,
eventdekning eller freshness. Det er ingen kvittering på mottatte kjøpsverdier eller
endelig attribusjon. Kvalitetsøyeblikket og sjudagersdekningen har annet tidsgrunnlag
enn20-timersstatistikken. Eksakt siste hendelsestid er ikke eksponert; siste bøtte
for Purchase starter13.oktober16:00UTC.

Meta mottar altså data, men full avstemming er fortsatt åpen. Neste arbeid prioriterer
Purchase-prisdiagnosen, standardevent-deduplisering og faktiske mottatte parametre
hos Meta. GA4-promotiondesignet beholdes i restlisten og tar ikke plassen til dette.
Ingen nye testhendelser, providerendringer eller gjenleveringer ble utført.

Bevis: /tmp/utekos-meta-live-stats-20261014-current.json og auditJSON.metaReceiverStatus0940.

## Kontroll av individuell API-lesing, 14. oktober etter kl.12:45 norsk tid

Native Meta Developer Tools dokumenterer `GET /v25.0/{pixel}/recent_events` med påkrevd `event` og `lookback_window`, og `real_time_event_log` for den innloggede brukerens pikselforespørsler. Direkte GET-kontroll med den eksisterende tilgangen: datasettidentitet HTTP200 og riktigID; recent_events for PageView/InitiateCheckout/Purchase og real_time_event_log gir alle HTTP400/code100 med «Tried accessing nonexisting field». Ingen testøkt, eventkode eller hendelse ble opprettet. Dette gjelder disse kallene med denne tilgangen, og beviser ikke at API-ene er globalt fjernet. Ingen individuell mottakskvittering ble hentet. Dokumentasjon: [recent_events](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/recent_events), [real_time_event_log](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/real_time_event_log). Bevis: `/tmp/utekos-meta-received-edge-check-20261014.json`.

De to nye checkoutene er dessuten koblet til8 tidligere PageViews med samme external_id+fbp siden00UTC. Ingen av de8 har rå fbclid, fbc eller registrert URL-klikk. Tidligste avleste side er10:33:45UTC. Det viser ikke klikk-ID-tap i dette materialet, men beviser verken organisk anskaffelse eller historikk før vinduet. Et faktisk annonseklikk→checkout-bevis står fortsatt åpent.

Native datasetmetadata bekrefter også faktisk aktivitet etter deploytidspunktet: browser12:36:35 og server12:35:25 norsk tid, datasett aktivt. Gatewaymetadata er NOT_ONBOARDED/NO_UPSELL. Dette er et separat Meta-mottaksbevis fra de etterslepende timebøttene; det gir ingen per-event fbc- eller dedupekvittering. Ingen providerinnstilling ble endret.

## Naturlig kjøp etter deploy, avlest 14. oktober kl. 13:05 norsk tid

Et nytt faktisk kjøp skjedde kl.12:41:45 og fikk Meta-kvittering kl.12:41:51: én kanonisk Purchase, HTTP200, events_received=1 og tom messages-liste. Native Shopify bekrefter én betalt, ikke-testordre med vellykket SALE/CAPTURE; tidspunkt, beløp og valuta samsvarer entydig med den kanoniske hendelsen. Ingen ordre- eller kundedata er lagret i denne rapporten.

Samme external_id og fbp kobler kjøpet til to begin_checkout og ni PageViews i det avgrensede utvalget, hvorav den siste PageView kom etter kjøpet. Alle mangler fbclid/fbc. Det er ingen registrert klikk-ID som forsvinner i dette materialet, men anskaffelseskanalen er ikke bevist. Kjøpet har ingen kampanje og oppfyller derfor ikke den publiserte AppendAttribution-kontrakten. Den publiserte marginberegningen har kjente varekostnader og gir positiv profitt for kildeinputen; faktisk mottatt net_revenue hos Meta er fortsatt ikke avlest.

Metas separate WEB_ONLY/SERVER_ONLY Purchase-kall kl.13:03 returnerte ingen timebøtter fra10:00UTC. Dette er rapportens tilgjengelige utvalg og ikke et fraværsbevis mot den konkrete events_received-kvitteringen. Fersk20t-rapport kl.12:57 viser fortsatt4442 hendelser. Browser-Purchase, slutt-dedupe og prisdiagnosens faktiske mottatte verdier står åpne.

**Ny checkout-gate:** ops.shopify_checkout_observations har53 rader totalt, siste12.oktober14:49:14UTC. Ingen rader13.–14.oktober eller rundt det nye kjøpet. App-pikselen og Next Meta er separate avsendere; fravær i app-tabellen beviser ikke fravær av Meta-browser-Purchase. OPTIONS mot den leverte observations-ruten svarer204 med CORS på frontend21c1ad4/backende9b4b05. Den separate recovery-evidence-ruten svarer404/receiver_disabled; ingen flagg er endret, og dette er ikke bevist årsak til de manglende observations. Vercels avgrensede request-loggsøk returnerer ingen observation-rader, men er ikke et komplett nettverksopptak.

Shopify dokumenterer at checkout_completed utløses på takke-/første upsell-side, og kan utebli hvis siden ikke lastes; pikslene er også samtykkestyrte. Ingen av disse årsakene er bevist for kjøpet. Neste kontroll er faktisk kjøretid/samtykke/levering fra checkout-pikselen, med samme opprinnelige identitet og uten replay. [Shopify checkout_completed](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed), [sandbox/CORS](https://shopify.dev/docs/apps/build/marketing/pixels), [Pixel Privacy](https://shopify.dev/docs/api/web-pixels-api/pixel-privacy).

Bevis: /tmp/utekos-meta-natural-purchase-20261014.json og /tmp/utekos-shopify-observation-preflight-20261014.json. Ingen nye hendelser, ordre, betalinger, testkoder eller providerendringer ble utført.

## Naturlig POAS-mottak bekreftet — 14. oktober 11:51 UTC

Den publiserte GTM-rettingens mottakskontroll er fullført. GA4s intraday-råeksport
inneholder ni nye poas_estimate etter publisering: seks cart og tre checkout.
Alle ni kobles via samme event_id og poas_source_event til nøyaktig ett mottatt
standardevent, med samsvarende valuta og value. Mottatt estimated_profit er336
i to rader og1036 i sju. Én336-rad gjelder nøyaktig varianten43959919051000 som
tidligere ga−340, med antall1/value676. Ingen hendelser ble generert av kontrollen.

Dette er katalogbasert marginestimat før kjøp, ikke faktisk ordreprofitt. En av
radene har value1512/estimat1036, mens samme variant også har value1592/estimat1036.
Faktisk per-event feedrespons er ikke lagret. Dette lukker ikke Meta-Purchase,
net_revenue eller deduplisering. Bevis: `/tmp/utekos-poas-natural-receiver-verification-20261014.json`
med SQL og alle ni eksakte par. [GA4-eksportskjema](https://support.google.com/analytics/answer/7029846),
[Stapes marginvariabel](https://github.com/stape-io/stape-store-margin-lookup-variable/blob/main/template.tpl).

Siste Meta-kjøpsavlesning og beslutningen om uendret samtykkeoppsett er samlet i
[fbc-avstemmingen](meta-fbc-reconciliation-2026-10-14.md). Shopify-kodekopiering
ble forsøkt på nytt; hele gjeldende kode er fortsatt ikke lest. Ingen piksel- eller
samtykkeendring er gjort på grunnlag av den eldre kopien.

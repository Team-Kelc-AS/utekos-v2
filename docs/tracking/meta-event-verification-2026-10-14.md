# Hendelsesmatrise for Meta-verifikasjon, 14. oktober 2026

Ny mottaksavlesning kl. 14:09: Meta returnerer 2 server-Purchase og 1 AppendAttribution i kl. 12:00–14:01-vinduet. Parameterstatistikken bekrefter net_revenue/value-felttilstedeværelse 2/1; konkrete beløp, browser-Purchase og dedupe er åpne. [Detaljert mottaksbevis](meta-received-verification-2026-10-14.md). Alle 35 oppføringer og øvrige krav beholdes.

Generert fra gjeldende src/lib/analytics/eventCatalog.ts og brukerens statsvedlegg.
Katalogstatus er en kodepåstand, ikke produksjonsbevis. Elleve bestemte forekomster har nå Metas Deduplicated-status; ingen rad er ferdig verifisert mot alle krav.
Alle 35 katalogoppføringer beholdes i omfanget; egne app/offline-kilder må vurderes separat.
Rapportert antall er baseline fra brukerens vedlegg. Verifikasjon-kolonnen beskriver
senere observerte funn og åpne krav, og skal ikke leses som samme tidsvindu.

| Kanonisk hendelse | Livssyklus | Meta-navn/status | Nettleser / server | Rapportert antall | Verifikasjon |
|---|---|---|---|---:|---|
| `page_view` | active | PageView / active | meta_pixel / meta_conversions_api | 869 | Meta quality kl.12:23: faktisk aggregert event_id-dedupe95,49%, fbc71,9%; egne målevinduer. Første-dispatch-retting21c1ad4 er READY på utekos.no kl.12:22; Naturlig kildekjede med 13 hendelser til betalt kjøp har identisk full fbc; individuell Meta-dedupe står åpen. Historiske Test Events inkluderer to Deduplicated-forekomster. Gatewaykoblingen er senere fjernet av bruker. Lokal oppfølging av rå fbclid/SDK-fbc er separat og ikke publisert. Se fbc-avstemmingen |
| `view_item_list` | active | ViewItemList / active | meta_pixel / meta_conversions_api | 640 | Meta Test Events04:52: to Deduplicated-forekomster,16/15 felt samsvarer; server200/events1. Ordinær browser POST blokkert inspector; transport fortsatt åpen |
| `select_item` | active | SelectItem / active | meta_pixel / meta_conversions_api | 74 | Meta Test Events04:52: Deduplicated,13 felter samsvarer; PixelGET200/server200/events1. Øvrige krav åpne |
| `view_item` | active | ViewContent / active | meta_pixel / meta_conversions_api | 408 | Meta quality kl.12:23: faktisk aggregert event_id-dedupe100%, fbc83,6%. Historisk UI-forekomst05:12 er Processed med11 parametre; dette er en annen bevisflate. Etter-deploy-kjede og individuell endelig CAPI/pixel-korrelasjon åpne |
| `add_to_wishlist` | active | AddToWishlist / active | meta_pixel / meta_conversions_api | 2 | Meta UI 05:12: eksisterende forekomst fortsatt Processed, 11 parametre, browser-ID og server 200/events1. Historisk endelig CAPI-payload/pixel mangler; dedupe åpen |
| `add_to_cart` | active | AddToCart / active | meta_pixel / meta_conversions_api | 7 | Meta UI 05:12: eksisterende forekomst fortsatt Processed, 12 parametre, browser-ID og server 200/events1. Meta quality kl.12:23 viser faktisk aggregert dedupe100% (80% event_id +20% external_id), separat fra nøkkeltilstedeværelse; ingen individuell kvittering for denne forekomsten; endelig CAPI-wire mangler |
| `remove_from_cart` | active | RemoveFromCart / active | meta_pixel / meta_conversions_api | 3 | Meta UI04:39: Deduplicated, 12 synlige parametre; samme ID/server200/events1. Dedupe bekreftet for én forekomst; øvrige krav åpne |
| `view_cart` | active | ViewCart / active | meta_pixel / meta_conversions_api | 8 | Meta UI05:04: to forekomster Deduplicated, begge samme ID/server200/events1; første har13 synlige parametre. Øvrige krav åpne |
| `begin_checkout` | active | InitiateCheckout / active | meta_pixel / meta_conversions_api | 4 | Meta UI 05:12: eksisterende forekomst fortsatt Processed, 13 parametre og server 200/events1. Meta quality kl.12:23 viser faktisk aggregert event_id-dedupe100%, fbc75%. Browser-capture for den historiske forekomsten er avkortet; ny naturlig checkout etter deploy og individuell mottakskorrelasjon åpne |
| `add_shipping_info` | active | AddShippingInfo / active | – / meta_conversions_api | ikke observert | Meta historisk UI viser 23 mottatte; ikke observert i baselinevinduet. Gjeldende kilde, parametre og korrelasjon krever neste naturlige checkout |
| `add_payment_info` | active | AddPaymentInfo / active | – / meta_conversions_api | ikke observert | Meta historisk UI viser 17 mottatte; ikke observert i baselinevinduet. Gjeldende kilde, parametre og korrelasjon krever neste naturlige checkout |
| `purchase` | active | Purchase / active | shopify_app_web_pixel / meta_conversions_api | ikke observert | Faktisk betalt NOK944 gjenlevert én gang etter godkjenning; Meta200/events2. Nå 42 unike kanoniske payloads med åtte ulike NOK-beløp og 42/42 Shopify-beløpsmatch, kvalifisert mot native PAID/test:false-utvalg. Meta viser 43 Purchase, men eksponerer ikke konkrete mottatte verdier; aktiv prisdiagnose består. Backend e9b4b05 READY. Nytt mottaksbevis kl.14:09: to server-Purchase og én AppendAttribution; net_revenue/value finnes 2/1 ganger. Browser-Purchase, dedupe, konkrete beløp og endelig attribusjon åpne; ingen ny replay |
| `refund` | active | – / not_relevant | – / – | ikke observert | To produksjonsforsøk har Data Manager SUCCESS/recordCount1 mot riktig GA-property, men historisk GA4-rapport viser én refund. Avstemming åpen; ingen replay |
| `search` | active | Search / active | meta_pixel / meta_conversions_api | ikke observert | Bevisst fjernet fra aktiv sporing ifølge MIGRATION-PLAN/GTM. Aktiv-status er utdatert katalogpåstand; skal ikke reaktiveres for å fylle matrisen |
| `view_search_results` | active | – / not_relevant | – / – | ikke observert | Åpen: verifiser riktig provider og kilde |
| `view_promotion` | active | – / not_relevant | – / – | ikke observert | GA4 Data API38 i13.–14.oktober; råsnapshot14.oktober13rader, alle event_id/0items. Hero/NBCC-produsenter lokalisert. Påvist items-avvik mot anbefalt Google-event; reell produktkobling/korrekt eksport åpen |
| `select_promotion` | active | – / not_relevant | – / – | ikke observert | GA4 Data API2 i13.–14.oktober; råsnapshot14.oktober1rad med event_id/0items. Reell promotion-lenkeprodusent lokalisert. Items valgfritt, men mangler gir begrenset promotionrapportering; eksportdesign åpent |
| `generate_lead` | active | Lead / active | meta_pixel / meta_conversions_api | 2 | To reelle product_reservation-leads: GA4 eksakt navn/ID og form/lead/page_view avstemt i avleste 12.–13. oktober-tabeller, én rad per par. Begge Meta200/events1; Meta viser Lead i originale timer (WEB1/SERVER2 per time), men ingen ID i statistikken. Endelig CAPI-wire/dedupe/attribusjon åpne |
| `form_start` | active | FormStart / active | – / meta_conversions_api | ikke observert i vedlegget | Forhandlerskjema: kanonisk202, Meta/Microsoft200/events1; Meta06:55 Confirmed by you etter eget JA; ads features tillatt, attribusjon åpen |
| `form_submit` | active | FormSubmit / active | – / meta_conversions_api | ikke observert | Sju historiske forsøk i avlest periode er skipped_unqualified hos Google/Meta/Microsoft; ingen ny innsending opprettes |
| `form_error` | active | FormError / active | – / meta_conversions_api | ikke observert i vedlegget | Synlig valideringsfeil i forhandlerskjema: Meta/Microsoft200/events1; Meta06:55 Confirmed by you etter eget JA; attribusjon åpen |
| `filter_apply` | active | – / not_relevant | – / – | ikke observert | Ingen nåværende UI-produsent funnet i src; schema/bridge finnes. Ingen rad i avgrenset GA4-/forsøksavlesning. Krever faktisk filterflate eller avklaring av utdatert aktiv-status |
| `sort_apply` | active | – / not_relevant | – / – | ikke observert | Ingen nåværende UI-produsent funnet i src; schema/bridge finnes. Ingen rad i avgrenset GA4-/forsøksavlesning. Krever faktisk sorteringsflate eller avklaring av utdatert aktiv-status |
| `variant_select` | active | – / not_relevant | – / – | ikke observert i vedlegget | Faktisk XS→XL→XS: begge eksakte navn/ID-par finnes én gang hver i GA4 intraday14.oktober; variant-, interaction_id- og page_view_id-hash samsvarer. Andre consent-/identitetsgrener og leveringsvei/dedupe ikke bevist av råeventrad alene |
| `size_guide_view` | active | – / not_relevant | – / – | ikke observert i vedlegget | Eksakt navn/ID finnes én gang i GA4 intraday14.oktober; guide_id=product-size-guide, open_sequence=2 og page_view_id samsvarer. Tidligere202+ERR_ABORTED har uavhengig ledger/mottaksbevis; øvrige consent-/identitetsgrener åpne |
| `checkout_error` | blocked_source | – / not_relevant | – / – | ikke observert | Åpen: verifiser riktig provider og kilde |
| `payment_error` | blocked_source | – / not_relevant | – / – | ikke observert | Åpen: verifiser riktig provider og kilde |
| `scroll_depth` | active | LandingScrollDepth / active | meta_pixel / meta_conversions_api | 665 | Meta UI04:39: Deduplicated, 3 synlige parametre; samme ID/server200/events1. Dedupe bekreftet for én forekomst; øvrige krav åpne |
| `view_category` | active | ViewCategory / active | meta_pixel / meta_conversions_api | 103 | Meta Test Events04:52: Deduplicated,5 felter samsvarer; PixelGET200/server200/events1. Øvrige krav åpne |
| `hero_interact` | active | HeroInteract / active | meta_pixel / meta_conversions_api | 2 | Forside og forhandler: Pixel200/Meta-server200/events1, ID-paritet; endelig dedupe åpen |
| `interact_with_accordion` | active | InteractWithAccordion / active | meta_pixel / meta_conversions_api | ikke observert | Meta UI04:39: Deduplicated, 15 synlige parametre; samme ID/server200/events1. Dedupe bekreftet for én forekomst; øvrige krav åpne |
| `open_quick_view` | active | OpenQuickView / active | meta_pixel / meta_conversions_api | ikke observert | Meta historisk UI viser 87 mottatte; gjeldende UI-produsent ikke lokalisert. Ingen konstruert utløsning |
| `video_progress` | active | – / not_relevant | – / – | ikke observert | Seks eksisterende navn/ID-par finnes én gang hver i GA4 intraday14.oktober; video_percent10/27/50/76/91/100, varighet10,6s og page_view_id samsvarer. Ingen Meta-mapping; øvrige kilde-/consent-/livssyklusgrener åpne |
| `meta_app_event` | active | source_meta_event_name / active | – / meta_conversions_api_app | ikke observert | Ingen forsøk returnert i avlest lager siden16.9; krever faktisk appkilde, identiteter og app_data. Ikke produsert som webhendelse |
| `meta_offline_event` | active | source_meta_event_name / active | – / meta_conversions_api_offline | ikke observert | Ingen forsøk returnert i avlest lager siden16.9; krever faktisk offlinekilde og kundematch. Ingen oppdiktet konvertering |

## Parameterkrav fra katalogen

Disse må sammenlignes med faktiske nettleser-/serverpayloads og gjeldende offisiell
dokumentasjon før de kan godkjennes. Felles ID gjelder bare når begge kilder faktisk finnes.

- `page_view`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`.
- `view_item_list`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `content_ids`, `contents`, `currency`, `value`, `item_list_id`, `item_list_name`.
- `select_item`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `currency`, `value`, `contents`, `content_ids`.
- `view_item`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `content_ids`, `content_type`, `currency`, `value`.
- `add_to_wishlist`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `content_ids`, `currency`, `value`.
- `add_to_cart`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `content_ids`, `currency`, `value`.
- `remove_from_cart`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `content_ids`, `currency`, `value`.
- `view_cart`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `content_ids`, `contents`, `currency`, `value`.
- `begin_checkout`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `content_ids`, `currency`, `value`.
- `add_shipping_info`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `content_ids`, `contents`, `currency`, `value`.
- `add_payment_info`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `content_ids`, `contents`, `currency`, `value`.
- `purchase`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `content_ids`, `currency`, `value`.
- `refund`: ingen Meta-eksportkrav i katalogen.
- `search`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `search_string`.
- `view_search_results`: ingen Meta-eksportkrav i katalogen.
- `view_promotion`: ingen Meta-eksportkrav i katalogen.
- `select_promotion`: ingen Meta-eksportkrav i katalogen.
- `generate_lead`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`.
- `form_start`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`.
- `form_submit`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`.
- `form_error`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`.
- `filter_apply`: ingen Meta-eksportkrav i katalogen.
- `sort_apply`: ingen Meta-eksportkrav i katalogen.
- `variant_select`: ingen Meta-eksportkrav i katalogen.
- `size_guide_view`: ingen Meta-eksportkrav i katalogen.
- `checkout_error`: ingen Meta-eksportkrav i katalogen.
- `payment_error`: ingen Meta-eksportkrav i katalogen.
- `scroll_depth`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `threshold`, `percent_scrolled`, `document_height`.
- `view_category`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `category_id`, `category_name`, `view_sequence`, `content_ids`, `content_type`.
- `hero_interact`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `cta_id`, `destination_path`, `click_sequence`.
- `interact_with_accordion`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `content_ids`, `contents`, `accordion_id`, `accordion_title`, `interaction_type`.
- `open_quick_view`: `event_id`, `event_time`, `action_source`, `event_source_url`, `user_data`, `content_ids`, `contents`, `currency`, `value`, `source_surface`, `open_sequence`.
- `video_progress`: ingen Meta-eksportkrav i katalogen.
- `meta_app_event`: `event_id`, `event_time`, `action_source`, `user_data`, `advertiser_tracking_enabled`, `app_data.extinfo`.
- `meta_offline_event`: `event_id`, `event_time`, `action_source`, `user_data`, `customer_match_key`, `order_id`, `currency`, `value`, `contents`.

## Konkrete avvik i kildekartleggingen

- Search står aktivt i katalogen og finnes i Pixel-mappingen, men dagens v2 bridge-allowlist har ingen `/api/events/search`. MIGRATION-PLAN og GTM-versjon 174 bekrefter at aktiv søkesporing bevisst ble fjernet. Ikke gjenaktiver det automatisk; katalogpåstanden må avstemmes med denne beslutningen.
- AddShippingInfo/AddPaymentInfo er serverhendelser i katalogen. Manglende nettlesersender alene er derfor ikke en dedupliseringsfeil.
- FormStart/FormSubmit/FormError er aktive Meta-serverhendelser i katalogen, men finnes ikke i listen over 18 requiredMetaDatasetQualityEvents.
- Refund og flere interaksjoner er ikke Meta-hendelser i katalogen. Det skal ikke oppfinnes en Meta-konvertering for å få tabellen grønn.
- App/offline krever deres egne faktiske kilder. Et butikkbesøk kan ikke dokumentere dem.

## Produksjonskontroll etter tom server-IP-liste

14. oktober 00:50 UTC: vanlig nettlesernavigasjon ga PageView ×2,
LandingScrollDepth, SelectItem og ViewContent. De fem nettleser-ID-ene og
hendelsestidene er avstemt mot backendens kanoniske payload og Meta-forsøk.
Alle fem har HTTP 200 / events_received=1 / accepted_unverified. Kanoniske
SelectItem og ViewContent har NOK/verdi676 (eks. mva.) fra den valgte
Comfyrobe-varianten. Operator-policy er avlest som samtykkekilde.
Faktisk utgående Meta-wirepayload, Meta-prosessering og nettleser/server-dedupe
må fortsatt verifiseres. Ingen rad i hovedmatrisen er dermed ferdig godkjent.

## Ny kontrollert Purchase og RemoveFromCart

Purchase: ett faktisk betalt Shopify-kjøp NOK944 fra13. oktober kl.18:47 ble
særskilt godkjent gjenlevert av brukeren. Meta svarte HTTP200/events_received2
for Purchase + eksisterende kvalifisert AppendClickAttribution. Original
kanonisk payload/ID/tid/idempotens er bevart, ledger_count=1 og dead letter er
løst. Faktisk utgående wirefelt og match-key-presens er avlest. Ingen ny handel.
Meta-statistikk for Purchase var fortsatt tom ved første kontroll etter replay;
endelig attribusjon og dedupe er ikke bevist av API-kvitteringen.

RemoveFromCart: UI-reisen la én Comfyrobe Fjellnatt/XS i opprinnelig tom kurv og
fjernet den igjen. Kurven er tilbake til tom. Kanonisk request fikk202; Meta
serverforsøket fikk200/events_received1. Faktisk Meta Pixel POST har
RemoveFromCart, samme eventID og dataset1092362672918571. Kanonisk nettoverdi
er NOK676; dette er ikke en avlesning av Pixel-feltet cd[value]. Produkt-/verdi-
feltene er med. Selve Pixel-forespørselen ble blokkert lokalt med
ERR_BLOCKED_BY_CLIENT. ID-paritet er bevist, faktisk Meta-mottak/dedupe er åpent.

Produksjons-App Web Pixel2806284536 er aktiv i Shopify UI. API-avlesning av settings
via den tilkoblede Shopify-connectoren ble avvist fordi read_pixels mangler.
Lokal produksjonskonfigurasjon peker på Utekos Platform (client_idfc1a925406679708ed54111416174236).
Lokal v4-extension sender checkout-observasjoner til backend, ikke Meta Pixel-beacons.
Produksjonsversjon er bekreftet aktiv. Mottakeradressen er nå avlest fra den
faktiske checkoutens leverte konfigurasjon og er korrekt. Den tidligere påstanden
om frakoblet Next Meta er korrigert av fersk UI- og checkout-avlesning nedenfor.

## Meta-statistikk etter behandling

Kl.01:23:32UTC viste native Meta serverstatistikk Purchase_count1 i timebøtten
13. oktober16:00UTC, som inneholder den opprinnelige hendelsestiden16:47:17UTC.
Den første etterkontrollen hadde ingen Purchase. Sammen med wire-/kvitterings-
kontrollen og Shopify-kilden gir dette dokumentert registrering i Meta-statistikk.
Statistikken er aggregert: den dokumenterer fortsatt ikke endelig annonseattribusjon
eller deduplisering av et faktisk browser/server-par for dette kjøpet.

## Fersk Shopify-konfigurasjon og nettlesermottak

Brukeren bekrefter at Update for Utekos Platform allerede er utført. Appens
administrasjon åpner uten autorisasjonsforespørsel. Ingen Update ble trykket av
agenten i denne fortsettelsen.

Faktisk checkout-konfigurasjon viser App Web Pixel2806284536 med
endpoint_url=https://utekos.no/api/shopify/checkout-observations, STRICT-sandbox,
ANALYTICS/MARKETING/SALE_OF_DATA og dataSharingState=UNRESTRICTED.
Dette verifiserer levert konfigurasjon, ikke en shipping/payment/completion-hendelse.

Next Meta121405688 er tilkoblet; UI tilbyr «Disconnect Next Meta» og checkouten
laster custom-pikselens sandbox. Aktiv kodeversjon15 abonnerer bare på
checkout_completed og sender Purchase til1092362672918571 ved marketingAllowed.
Den hasher samme streng som backend (utekos:purchase:{numerisk ordre-ID}:paid)
og bruker samme UUID-biter/formatering. currency, totalPrice, variant-ID-er,
contents, antall og hashet e-post er kartlagt. Katalogens påstand om at App Web
Pixel eier Meta-browser-Purchase samsvarer ikke med denne aktive koden: App Web
Pixel sender observasjon, mens Next Meta sender Meta-beacon. Ingen eier er endret.
Endelig Purchase-nettlesermottak, samtykkereplay og dedupe er fortsatt åpne.

PageView kl.01:34:51.981UTC fikk202 fra kanonisk mottaker og200 fra faktisk
Meta Pixel GET/Image. Nettleserens eventID er lik kanonisk event_id.
Native Supabase-avlesning viser nøyaktig ett tilsvarende Meta-serverforsøk,
accepted_unverified, HTTP200/eventsReceived=1, behandlet01:34:53.139898UTC.
Dette er et korrelert browser/server-par med mottak på begge veier; Metas endelige
dedupliseringsbeslutning er ikke avlest. Nettverksbufferen var avkortet, så fravær
av andre forespørsler kan ikke utledes.

ViewCart og RemoveFromCart POST/Document ble fortsatt avvist med
ERR_BLOCKED_BY_CLIENT og blockedReason=inspector, canceled=false, uten CORS-feil.
Dette peker mot debugger-/inspector-styrt blokkering; ingen bestemt utvidelse
er identifisert. Interne Chrome-sider er avvist av nettleserverktøyets URL-policy;
den grensen omgås ikke. Testkurven er tilbakeført til tom. Ingen kundeopplysninger,
ordre eller betaling ble sendt/opprettet i checkout-testen.

## AddToWishlist og påvist akkordeonfeil

Kl.01:42:55.614UTC ble Comfyrobe Fjellnatt/XS lagt til via produktets faktiske
ønskelisteknapp. UI bekreftet lokal lagring og kanonisk mottaker svarte202.
Pixel POST hadde AddToWishlist, riktig dataset og samme eventID. Faktisk
Pixel-verdi var845brutto, netto676 og mva169, valutaNOK; kanoniske commerce-felt
inneholdt én vare og riktig variant. Meta-serverforsøket fikk200/eventsReceived1
med samme ID/tid, bekreftet gjennom native Supabase. Browser POST var inspector-
blokkert, så browser-mottak/dedupe er åpent. Fjerning sendte ingen AddToWishlist,
og ønskelisten er tilbakeført til opprinnelig pressed=false.

En faktisk åpning av Materialer viste aria-expanded=true, men ingen
InteractWithAccordion-forespørsel i en ikke-avkortet nettverkskontroll.
Triggeren og elementet manglet data-slot-markørene som observeren krever.
Dette ble reprodusert med den virkelige delte Accordion-komponenten i eksisterende
offline-integrasjonstest, som feilet før rettingen.

Lokal retting legger egne data-tracking-accordion-trigger/item-markører på den
delte Base UI-komponenten og lar observeren støtte både disse og tidligere
data-slot-markører. Ingen CSS-selektorer eller stiler er endret. Testen bruker
mus og tastatur, bekrefter kun åpninger, sekvens1/2, full commerce og samme
Meta-eventID i Chromium og WebKit. Testens HTML fikk eksplisitt UTF-8, slik at
norske parametre bevares også i WebKit.

Etter rettingen består pnpm run test:tracking med348+15=363tester.
pnpm exec tsc --noEmit, scoped ESLint og scoped diff --check består.
Dette var lokal status før den særskilt godkjente publiseringen nedenfor.
Chrome-tilkoblingen ble avbrutt under den første livekontrollen; ingen innstilling
ble endret for å omgå blokkeringen.

## Publisert akkordeonretting og faktisk Meta-mottak

Brukeren godkjente uttrykkelig commit/push av bare de tre filene. Commit
a0a0c8206eb75b1537f45ce5c9ba147dfd246fb7 inneholder nøyaktig Accordion.tsx,
dom-observers.ts og tracking-browser.test.cjs. Øvrige lokale endringer ble ikke
staget eller publisert. Native Vercel-avlesning bekrefter produksjonsdeploy
dpl_5T7oMS3UULwTUZbF6eQ9T9DL1irM, READY, samme SHA og aliasutekos.no.

Fersk Chrome-kontroll finner begge sporingsmarkørene på den leverte komponenten.
Åpning av Materialer kl.02:01:05.620UTC sender nøyaktig én kanonisk
InteractWithAccordion-forespørsel med202. Faktisk Meta Pixel-forespørsel har200,
riktig dataset1092362672918571 og samme eventID. Den inneholder Materialer,
interaction_type=open,sekvens1,NOK845brutto/676netto/169mva og én vare.
Native Supabase bekrefter tilsvarende Meta-serverforsøk accepted_unverified,
HTTP200/eventsReceived1, original ID/tid og de samme kanoniske feltene,
behandlet02:01:07.361242UTC. Lukking ga ingen ny kanonisk akkordeonhendelse;
begge nettverkskontrollene var uten avkorting.

Produksjonsfeilen i utløseren er dermed rettet og mottak på begge veier er avlest.
Metas endelige dedupliseringsbeslutning er fortsatt ikke avlest. Den tidligere
inspector-blokkeringen ble ikke observert for denne hendelsen i ny Chrome-økt.

Vercels dokumenterte env run-kontroll bekrefter dessuten at produksjonens
META_PIXEL_ID og NEXT_PUBLIC_META_PIXEL_ID begge er1092362672918571.
Ingen credentials eller miljøfiler ble skrevet til bevismaterialet.

## Størrelsesguide med avstemt lagring

Faktisk åpning av Comfyrobes størrelsesguide kl.02:08:02.605UTC utløste
size_guide_view med guide_id=product-size-guide og open_sequence=2. Kanonisk
mottaker svarte202. Nettleseren registrerte senere ERR_ABORTED for samme request;
native Supabase bekrefter likevel nøyaktig én lagret hendelse med samme ID,
tidspunkt og parametre kl.02:08:03.157698UTC. page_view_id, external_id og browser_id
er til stede. Samtykkekilden er operator_policy med analytics/marketing=granted.

Google-forsøket er accepted_unverified/provider_accepted_unverified, behandlet
02:08:04.336162UTC; http_status er null i avlesningen. Endelig Google-behandling
er ikke dokumentert. Gjeldende katalog har ingen Meta-eksport for size_guide_view.
Lukking skjulte dialogen og sendte ingen ny størrelsesguideforespørsel.
Begge gyldige nettverkskontroller var uten avkorting.

En tidligere kontroll med null nettverkshendelser hadde deaktivert Network-domene
og er ugyldig som fraværsbevis. Den brukes ikke til å konkludere med en kodefeil.
Sikkert bevis: /tmp/utekos-size-guide-production-20261014.json og skjermbilde
/tmp/utekos-size-guide-production-20261014.jpg. Ingen ny kjøretidskode er endret.

## Hero, kontaktskjema og kvalifisert forhandlerskjema

Forsidens Utforsk-lenke er skjult ved avlest bredde632px, i samsvar med CSS.
Ved midlertidig1024px bredde ble den faktiske lenken klikket kl.02:15:42.474UTC.
hero_interact hadde cta_id=home-explore, destination_path=/produkter/varmeplagg
og click_sequence=1. Navigasjonen nådde målet. Kanonisk202, Pixel200 med samme
ID/dataset/parametre, og native Supabase Meta200/eventsReceived1 med samme ID/tid
er avlest. Microsoft ble riktig hoppet over som outside_dealer_funnel.
Visningsbredden er tilbakeført; endelig Meta-deduplisering er ikke avlest.

Kontaktskjema: fokus alene sendte0 skjemahendelser. Første meningsfulle
verdiendring sendte form_start med form_id=contact, form_name=Kontaktskjema og
field_category=message kl.02:16:15.466UTC. Feltet ble deretter tømt. Alle kontaktfelt
var tomme før innsending. Synlig valideringsfeil ga form_error/validation med
attempt_id kl.02:16:31.804UTC. Begge fikk202 og én avstemt ledger-rad. Google står
accepted_unverified; Meta/Microsoft skipped_unqualified/outside_dealer_funnel
samsvarer med gjeldende dealerFunnelScope. Ingen feltverdi finnes i custom_data.

Forhandlerskjema: faktisk verdiendring og etterfølgende tømming ga form_start
kl.02:18:53.480UTC med dealer_inquiry/Forhandlersamarbeid/message. Klikk på
«Ta kontakt om forhandlersamarbeid» ga hero_interact/dealer_web_submit kl.02:18:53.690UTC.
Alle felt var tomme, og servervalideringen viste feilmeldingen. form_error med
dealer_inquiry/validation/attempt_id kom kl.02:18:53.885UTC. Alle tre fikk202 og
én avstemt ledger-rad med identisk ID/tid. Meta OG Microsoft svarte200/eventsReceived1
for hver hendelse; status er accepted_unverified. Google står accepted_unverified,
uten avlest http_status. CTA-klikket fikk også Meta Pixel200 med samme ID/dataset.
FormStart/FormError har ingen nettleser-Meta-sender i gjeldende katalog.

Begge server actions returnerer ved valideringsfeil før e-postfunksjonen. Ingen
gyldig henvendelse, Lead eller FormSubmit ble produsert, og ingen e-post ble sendt.
Gyldige nettverkskontroller var uten avkorting. Første forhandlerkontroll hadde
null Network-hendelser og ble forkastet; etter nyinnlasting og eksplisitt
Network.enable ble de ovennevnte hendelsene avlest. Nullkontrollen er ikke feilbevis.

Sikkert samlet bevis: /tmp/utekos-hero-form-production-20261014.json og
meta-audit-evidence-2026-10-14.json. Skjermbilder av målsiden og synlige valideringsfeil
ligger i /tmp/utekos-hero-production-20261014.jpg,
/tmp/utekos-form-error-production-20261014.jpg og
/tmp/utekos-dealer-validation-production-20261014.jpg. Ingen kjøretidskode er endret.

## Godkjent gjenlevering av resterende historiske Meta-forsøk

Brukeren godkjente uttrykkelig «Ja, gjenlever de 1809 og verifiser kvitteringene».
Fersk avlesning og SDK-wire-preflight bekreftet 1809 unike server_retry-forsøk,
gyldig alder, granted marketing og ingen Purchase. Kohorten velges etter attemptets
created_at i det opprinnelige 20-timersvinduet; seks hendelser har eldre event_time.
Det allerede aksepterte kjøpet ble ikke sendt igjen.

Kjøringen gikk fra 02:34:49 til02:47:47UTC i forgrunnen. Den brukte eksisterende
målrettet dispatch og kvitteringslagring, atomisk claim av bare godkjent attempt-ID,
lease og stopp ved uventet feil. Ingen bred køarbeider ble startet.20 eksisterende
tester for målrettet dispatch/store bestod. SDK-preflight hadde null eksterne kall
og null claims; den faktiske kjøringen gjorde nøyaktig 1809 Meta-kall.

For hver faktisk request ble event_id/event_name, opprinnelig event_time,
nettstedskontekst/UA og bruttoverdi/valuta der de finnes kontrollert. Metas dokumenterte
Parameter Builder-suffiks ble godtatt; kanonisk payload ble ikke endret. Etter hver
kvittering ble lagret payload-hash og opprinnelig idempotensnøkkel kontrollert.

Uavhengig native Supabase-avlesning kl. 02:49:11UTC bekrefter:

- 1809 unike attempts og hendelser, alle accepted_unverified med HTTP 200,
 eventsReceived=1 og validation_result.events_received=1.
- 1809 tilhørende dead letters er løst; null Meta dead_lettered-forsøk gjenstår
 i det opprinnelige attempt-vinduet.
- Kohortens samlede payload-fingerprint er uendret, og ingen event_id/event_time/
 custom_data avviker fra ledgerens kanoniske kjerne.

Kohorten har 15 hendelsestyper: PageView 654, LandingScrollDepth 413, ViewItemList 373,
ViewContent 231, ViewCategory 62, SelectItem 46, ViewCart 6, FormError 5, AddToCart 5,
HeroInteract 4, FormStart 3, RemoveFromCart 3, InitiateCheckout 2, AddToWishlist 1 og Lead 1.

Native Meta SERVER_ONLY-statistikk for opprinnelig hendelsesvindu viste fortsatt
de samme aggregerte tallene i etterkontrollen. API-mottak er bevist; endelig Meta-
prosessering, deduplisering og annonseattribusjon er fortsatt ikke bevist. Det skal
ikke utledes en bestemt årsak fra den foreløpig uendrede statistikken.

Sikkert resultat med native readback og parameternøkler:
/tmp/utekos-meta-approved-cohort-replay-result-20261014.json. Ingen ny ordre eller
betaling er opprettet, og ingen ny applikasjonskode er publisert. Rapportrettingen ble senere implementert og særskilt godkjent publisert; se nedenfor.

## Rapportretting og senere Meta-prosessering

Ny native Meta-avlesning kl.03:06UTC viser økning i samme SERVER_ONLY-vindu:
PageView871 mot tidligere460, ViewContent373 mot215, LandingScrollDepth611 mot344
og ViewItemList606 mot332. FormStart og FormError har nå1 hver. Dette dokumenterer
videre registrering etter replay; det beviser ikke sluttbehandling/dedupe for alle1809.
Gjeldende lokal live-rapport kl.03:02:18UTC hadde3580 samlede events,16 typer og18
kvalitetsrader. Disse er separate avlesninger med forskjellige hentetidspunkt.

Den faktiske rutens metaStatsReport.ts er nå rettet og publisert i50f2647. Ti rapporttester består,
full tsc --noEmit og scoped ESLint består. Før rettingen reproduserte testene blant
annet falsk eksakt hendelsestid, ekstra kall på terminal cursor og stille godkjenning
av ugyldig statsdata. Live API-avlesning med den nye koden fullførte både event- og
processing-paginering på to sider og sluttet ved fravær av paging.next.

API-endringer som nå er i produksjon:

- Eksakte felt last_event_at/minutes_since_last_event er null fordi kilden bare har
  timebøtter. Nye last_event_bucket_start_at/minutes_since_last_event_bucket_start
  og event_time_precision angir det som faktisk er kjent.
- event_processing_results inneholder behandlingsmetadata. Det tidligere misvisende
  deduplication_and_coverage er en tom, deprecated oppføring.
- Paginering viser complete/pages_read/stop_reason. Manglende cursor, gjentatt cursor
  eller sidegrense blir eksplisitt ufullstendig, og ugyldig statsdata avvises.
- Totalsummen viser event_total_counts-proveniens og summerer ikke cursor-suffikser.
- Kvalitetsdata merkes som gjeldende øyeblikk; eventdekning er et 7-dagers gjennomsnitt.
  Manglende, tom og returnert feedback skilles i JSON og Markdown.
- Graph-feil beholder HTTP/code/subcode uten rå fritekst fra leverandøren.

Brukeren godkjente et nytt unntak fra pnpm run sync for bare rapporten og testfilen.
Commit50f2647cb54ddb7f60d82481667947858a523347 er pushet med nøyaktig disse to filene.
Alle øvrige lokale diff-er er uendret, inkludert den eksisterende trelinjers kommentarslettingen.
Vercel dpl_BMLprD8oRXm3QLqM5HTH5xEAU81E er READY med sammeSHA og utekos.no-alias.
Produksjonsrapporten kl.03:23:02UTC svarte200:4411 events/18 typer/18 kvalitetsrader.
Begge pagineringer fullførte2sider/end_of_results. Nye presisjons-/semantikkfelt er
avlest, legacy eksakttidsfelt er null, og manglende tidsvindu gir fortsatt400.
Bevis: /tmp/utekos-meta-stats-report-production-20261014.json.
Patch: /tmp/utekos-meta-stats-report-fix-20261014.patch.
Live-eksempel: /tmp/utekos-meta-stats-report-local-live-20261014.json og samme navn.md.

## Faktisk variantvalg

Comfyrobe Fjellnatt ble endret fra XS til XL kl.03:12:43.774UTC. Klikk på allerede
valgt XS sendte først null variant-hendelser. XL ble faktisk forpliktet i URL og UI;
variant_id/item_id i custom_data samsvarte med levert product-commerce/variant-markør.
item_variant=Fjellnatt / XL / Unisex, availability=available og interaction_id var med.
Kanonisk mottaker svarte202. Native Supabase bekrefter én ledger-rad med samme ID/tid,
page_view_id og ga_client_id, operator_policy og Google accepted_unverified med request-ID.

Tilbakeføring til XS kl.03:13:17.443UTC ga separat event_id og interaction_id,
korrekt Fjellnatt / XS / Unisex,202 og én tilsvarende Google-kvittering i databasen.
Opprinnelig XS-tilstand er gjenopprettet. Ingen kurv, ordre eller betaling er opprettet.
Ingen av nettverkskontrollene var avkortet. VariantSelect har ingen Meta-eksport i
gjeldende katalog; Google-sluttbehandling er fortsatt åpen.

Sikkert bevis: /tmp/utekos-variant-production-20261014.json og samme navn.jpg.
Gjeldende Google events.ingest-/tilleggsparameterdokumentasjon ble hentet gjennom
Context7 etter at GoogleDev Knowledge-koblingen krevde ny autentisering.


## Mottak hos Meta som primær fasit

Se [Meta-mottak og API-kart](meta-received-verification-2026-10-14.md). Ny mottaksavlesning
fra Meta viser18 typer på serversiden og14 i browser-kilden. Dataset Quality gir18 web-rader
og11 dedupe-tilbakemeldinger. Metas UI viser historisk OpenQuickView87, AddShippingInfo23
og AddPaymentInfo17; kodefunn/20t-fravær skal ikke tolkes som fravær av alt Meta-mottak.

Gjeldende live append-guide krever AppendAttribution; Metas data viser AppendClickAttribution
i web- og custom_attribution-kvalitet. CAS-widgetene viser1/2 trinn. Ingen konklusjon om
endelig bruk/attribusjon er trukket. Lokal backendretting bruker standardnavnet og legger
til standardfeltet net_revenue fra beregnet margin.40tester/TypeScript/lint består.
Gjeldende status08:13UTC: de ti godkjente backendfilene i cc32139 og nødvendige
genererte manifestfølgefiler i e9b4b05 er publisert. Native Vercel viser READY,
og backend.utekos.no peker på e9b4b05. Den første manifestfeilen er historisk.
Ingen ny replay er godkjent; nytt faktisk mottak/profitt/CAS krever kvalifisert naturlig kilde.

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


## Fortsettelsens avlesning05:04UTC

Eksisterende Meta Test Events-historikk viser19 forekomster:11 Deduplicated og8
Processed. De tre ytterligere dedupliserte er PageView×2 og ViewCart×1, alle korrelert
med samme ID/server200/events1. Ingen nye hendelser eller konverteringer er sendt.
11 er forekomster, ikke unike hendelsestyper. Fullt35-hendelsesomfang og alle øvrige
krav består. Ordinær browserlevering er fortsatt åpen for de to blokkerte liste-POSTene.
Detaljer og anonymiserte ID-er finnes i meta-received-verification-2026-10-14.md.


## Restarbeidsvurdering, 14. oktober 08:30 UTC

Alle 35 rader og alle mottakskrav beholdes. «Kan undersøkes nå» betyr at en ny,
avgrenset lesing av eksisterende data kan gi mer bevis uten publisering,
konvertering eller replay. Det betyr ikke at raden kan erklæres ferdig.

| Hendelse | Tilgjengelig neste tiltak | Konkret avhengighet |
| --- | --- | --- |
|page_view|**Ny mottakssituasjon / provideravklaring.** Brukeren har frakoblet mål-pikselen; direkte Pixel200 og CAPI200/events1 er korrelert på ny ID. Nå avklart GTM175/Stape-rute viser Meta-config som runtimekilde til fortsatt OpenBridge.|Tidligere manglende Disconnect-gate er motbevist av delt business538548380599665. Faktisk nettverk har fortsatt gateway-POST; årsak og sluttmottak/dedupe er åpne. Ingen ny disconnect utføres.|
|view_item_list|**Tilgang / transport.** Ny ordinær listeobservasjon først når en ny fangstmetode eller avklart blokkering gir annen evidens.|Tidligere komplette POST-opptak er inspector-blokkert; Test Events-dedupe løser ikke dette. Ingen beskyttelse skal omgås.|
|select_item|**Ny mottakssituasjon.** Avstem flere identitets-/consentgrener ved en legitim ny kilde etter at transportsporet kan avklares.|Én deduplisert forekomst og 13 mottatte felt er allerede bevist; samme avlesning gir ikke ny informasjon.|
|view_item|**Tilgang / ny mottakssituasjon.** Fang endelig CAPI-navn/ID/pixel ved neste nye ordinære produktvisning og korreler hos Meta.|Eksisterende sluttpayload er ikke bevart. Ny tur uten forbedret wireobservasjon lukker ikke Processed-grensen.|
|add_to_wishlist|**Tilgang / ny mottakssituasjon.** Samme standardevent-kontroll når full CAPI-wire kan avleses; bruk bare en ny faktisk handling.|Historisk browser-ID og Meta200 er kjent; endelig wire/dedupe mangler. Ikke replay.|
|add_to_cart|**Tilgang / ny mottakssituasjon.** Avstem en ny legitim cart-handling med full wire og Meta etter at observasjonsforutsetningen er tilgjengelig.|100% sjudagers nøkkeldekning erstatter ikke den konkrete forekomstens dedupe. Ikke replay.|
|remove_from_cart|**Ny mottakssituasjon.** Utvid bare ved ny reell identitets-/consentgren med mottaksbevis.|Én deduplisert forekomst er kjent; ingen grunn til ny identisk kurvrunde nå.|
|view_cart|**Ny mottakssituasjon.** Utvid bare ved ny reell identitets-/consentgren med mottaksbevis.|To dedupliserte forekomster er kjent; samme UI-poll lukker ikke øvrige krav.|
|begin_checkout|**Tilgang / naturlig kilde.** Fang komplett browser- og endelig CAPI-wire ved en ny legitim checkout.|Tidligere checkout-segment var avkortet; ingen konstruert ordre eller ny replay.|
|add_shipping_info|**Naturlig kilde.** Avstem neste autoritative shipping-hendelse med checkout-observasjon og faktisk Meta-payload.|Krever reell kundehandling; historiske 23 mottatte beviser ikke neste flyt.|
|add_payment_info|**Naturlig kilde.** Avstem neste autoritative betalingsinfo-hendelse med faktisk Meta-payload.|Krever reell kundehandling; ingen betalingsdata konstrueres.|
|purchase|**Aktiv prisdiagnose og naturlig kilde.** Historisk kilde-/mottakerlesing er avsluttet. Innhent diagnosekohort/verdier hvis Meta eksponerer dem, ellers full wire ved neste naturlige kvalifiserte kjøp. Backend e9b4b05 er READY.|42/42 kildebeløp samsvarer, åtte ulike verdier. Native Shopify bekrefter PAID/test:false gjennom 42 unike processedAt+beløp-matcher; 43 ordre totalt i filteret. Meta-verdiutvalg og historisk sluttpayload mangler. Ingen ventende manifestgodkjenning eller ny replay; NOK944-kjøpet skal aldri sendes på nytt.|
|refund|**Leverandøravklaring / naturlig kilde.** Bevar Data Manager- og råeksportavviket; ny lesing bare ved ny leverandørforklaring eller legitim ny refund.|Avgrenset kontroll av begge eksisterende refunds er avsluttet. Ingen replay eller ny refusjon skal opprettes.|
|search|**Bevisst fjernet.** Bevar raden som historisk katalogavvik og respekter MIGRATION-PLAN.|Ingen aktivering eller oppdiktet søkehendelse; active er utdatert metadata.|
|view_search_results|**Kilde / katalogavklaring.** Avklar kildekontrakt dersom en faktisk synlig søkeresultatflate igjen finnes.|Kontrakten krever search_id/result_revision/synlig resultat; aktiv søkesporing er bevisst fjernet.|
|view_promotion|**Rapportavhengigheter påvist; eksportdesign åpent.** Bevar historikksammenheng ved eventuell Google-eksportendring for generelle hero/NBCC-flater. Hendelsesrapport og én eksisterende utforskning viser de historiske navnene; eksterne avhengigheter er fortsatt åpne.|Web175/server44 er avlest; denne GTM-ruten videresender ikke promotion. Separat backend-Google-rute og faktisk råmottak består. Ingen oppdiktet SKU; view_promotion items-avviket er fortsatt åpent.|
|select_promotion|**Rapportavhengigheter påvist; eksportdesign åpent.** Bevar historikksammenheng ved eventuell Google-eksportendring for generelle hero/NBCC-flater. Hendelsesrapport og én eksisterende utforskning viser de historiske navnene; eksterne avhengigheter er fortsatt åpne.|Web175/server44 er avlest; denne GTM-ruten videresender ikke promotion. Separat backend-Google-rute og faktisk råmottak består. Ingen oppdiktet SKU; view_promotion items-avviket er fortsatt åpent.|
|generate_lead|**Mottaksavstemming utført; Meta-wire åpen.** Bevar de to eksisterende kildeparene. Neste nye Meta-bevis krever endelig CAPI-wire eller ID-eksponert mottak/dedupe.|GA4 mottak og 33 samlede feltkontroller er bevist; Meta200/events1 og relevante timebøtter er bevist, men bøttene eksponerer ikke ID. Ingen ny lead eller replay.|
|form_start|**Ny mottakssituasjon.** Avstem neste naturlige kvalifiserte forhandlerforekomst hos Meta med beholdt original ID.|Faktisk serveraksept og Confirmed by you er kjent; bekreftelsen er ikke attribusjon. Ingen ny lik test kun for å fylle raden.|
|form_submit|**Naturlig kvalifisert kilde.** Avstem en faktisk akseptert serverkvittering og tilhørende leverandørmottak.|De sju avleste forsøkene er skipped_unqualified; ingen gyldig henvendelse skal konstrueres.|
|form_error|**Ny mottakssituasjon.** Avstem neste naturlige kvalifiserte valideringsfeil hos Meta med beholdt ID.|Faktisk serveraksept og Confirmed by you er kjent; ingen kontaktdata samles inn for testen.|
|filter_apply|**Kilde / katalogavklaring.** Kontroller bare når faktisk filterflate eller avklart katalogstatus foreligger.|Ingen aktuell UI-produsent funnet; gjentatt identisk kodesøk gir ikke mottaksbevis.|
|sort_apply|**Kilde / katalogavklaring.** Kontroller bare når faktisk sorteringsflate eller avklart katalogstatus foreligger.|Ingen aktuell UI-produsent funnet; schema/bridge alene er ikke en produsent.|
|variant_select|**Eksakt Google-mottak bevist.** Utvid bare ved en ny legitim consent-/identitets-/livssyklusgren med forbedret leveringsobservasjon.|To utvalgte GA4-par og variant/interaction/page_view er avstemt; én råeventrad beviser ikke avsender eller browser/server-dedupe.|
|size_guide_view|**Eksakt Google-mottak bevist.** Utvid bare ved en ny legitim kildegren; gjenta ikke den ferdige ID-spørringen.|Ett utvalgt GA4-par med guide/open_sequence/page_view er avstemt; øvrige samtykke-/identitetsgrener åpne.|
|checkout_error|**Blokkert autoritativ kilde.** Bruk bare godkjent autoritativ feilkilde med checkout_attempt_id og sikker feilkategori.|Katalogen er blocked_source/planned providers. Ingen checkout skal ødelegges for å lage hendelsen.|
|payment_error|**Blokkert autoritativ kilde.** Bruk bare godkjent autoritativ feilkilde med payment_attempt_id og sikker feilkategori.|Katalogen er blocked_source/planned providers. Ingen betaling skal forsøkes eller feiles kunstig.|
|scroll_depth|**Ny mottakssituasjon.** Utvid bare til en faktisk ny identitets-/consent-/lifecyclegren med komplett mottak.|En forekomst er Meta-deduplisert; tre felter er mottatt. Ingen identisk gjentakelse nødvendig.|
|view_category|**Ny mottakssituasjon.** Utvid bare når ny kildegren gir andre parametre/identiteter som skal avstemmes.|Fem mottatte felt og én deduplisert forekomst er allerede bevist.|
|hero_interact|**Ny mottakssituasjon.** Korreler en ny naturlig CTA-forekomst når endelig CAPI-wire og Meta-sluttstatus er tilgjengelig.|Browser/server200 og ID-paritet er kjent; eksisterende historisk wire kan ikke oppfinnes.|
|interact_with_accordion|**Ny mottakssituasjon.** Utvid bare ved ny relevant identitets-/consentgren.|Produksjonsutløseren er rettet, 15 felt og én Meta-deduplisert forekomst bevist.|
|open_quick_view|**Kilde / katalogavklaring.** Avstem faktisk nåværende quick-view-produsent dersom den gjøres tilgjengelig.|87 historiske Meta-mottak er kjent; ingen aktuell UI-produsent lokalisert. Ingen kunstig utløsning.|
|video_progress|**Eksakt Google-mottak bevist.** Utvid bare ved en ny legitim videokilde eller livssyklusgren.|Seks utvalgte GA4-par med videoandel/varighet/page_view er avstemt; dette er ikke alle historiske videoobservasjoner.|
|meta_app_event|**Naturlig appkilde.** Avstem faktisk apphendelse med app_data, sporingsvalg, identiteter og mottaker.|Ingen forsøk i avlest lager siden 16. september; webbesøk kan ikke erstatte appkilden.|
|meta_offline_event|**Naturlig offlinekilde.** Avstem faktisk offlinehendelse med legitim kundematch og original transaksjonskontekst.|Ingen kvalifisert forekomst i avlest lager; ingen konvertering eller kundeidentitet konstrueres.|

De fem mottatte tilleggene er **fem poas_estimate-forekomster, én ekstra hendelsestype**
i GA4-råeksporten. Alle fem er nå korrelert på original event_id med
cart/checkout; ingen Meta-levering er påstått. Server-GTM viser
transformasjon55 som lager poas_estimate for Data Client cart/checkout, sendt av
GA4-tag4. Aktuelt Stape-oppslag gir336 i absolutt margin; samme fem kanoniske
varelinjer har discount676. Tidligere versjon44 beregnet336−676=−340, lik faktisk
GA4-mottak. Feedmarginen inkluderer allerede katalograbatten. Etter uttrykkelig JA
er versjon45 publisert09:17UTC med useDiscount=false i variabel54. Aktiv verdi og
hele versjonsforskjellen er kontrollert: bare denne variabelen er endret.11/11
lokale kontroller består. **Naturlig GA4-mottak er nå verifisert kl.11:50:59UTC:** ni
poas_estimate etter publisering, alle koblet til nøyaktig ett standardevent via
event_id og kildenavn. Valuta og value samsvarer9/9. Seks add_to_cart og tre
begin_checkout; to marginer336 og sju1036. Én naturlig forekomst gjelder nøyaktig
kontrollvarianten43959919051000: antall1, value676, mottatt margin336 i stedet for
tidligere−340. Bevis: `/tmp/utekos-poas-natural-receiver-verification-20261014.json`.
Dette lukker den avgrensede GA4-rettingen, ikke Meta-Purchase/dedupe. Historisk
feedrespons og endelig servertrace er fortsatt ikke bevart. Dette er en avledet
hendelse, ikke dokumentert deduplisering. Ingen tag er endret.

SDK-matrisens 10 trinn og de separate tilgangs-/naturkildeportene er avstemt i
`/tmp/utekos-tracking-remaining-scope-assessment-20261014.json`.

## Statuskorreksjon 14. oktober 08:13 UTC

Backend e9b4b05 er nå Vercel READY og produksjonsalias backend.utekos.no peker på samme SHA. Bare nødvendige genererte manifestfølgefiler ble publisert etter den allerede godkjente ti-fils rettingen; nytt faktisk Purchase-mottak gjenstår.

Den tidligere gateway-tilgangsgaten er motbevist: brukerens frakobling er registrert i korrekt delt business 538548380599665 (eier1384717111999921). History har frakobling07:59 og generisk CAPI-tilkobling08:01. Generisk historikk beviser ikke gateway-reonboarding. Fersk Pixel-config08:01:54 har likevel OpenBridge og ny AWS-host; faktisk POST200+ERR_ABORTED. Direkte Pixel200/fullført og backend200/events1 er korrelert for ny PageView. Ingen gatewayinnstilling er endret av agenten. Supportsaken er ikke sendt. Se `/tmp/utekos-meta-gateway-after-user-disconnect-20261014.json`.

Aktiv Meta-diagnose om identiske web Purchase-priser er bekreftet; først oppdaget22.september og aktivliste siste3d uten eksakt sistetid. Avstemming prioriteres sammen med brukerens avgrensede GTM/Stape-hypotese. Se `/tmp/utekos-meta-purchase-value-diagnostic-20261014.json`.

# PageView, fbc og Meta-mottak — 14. oktober 2026

## Nyeste mottaksbevis, 14. oktober kl. 14:09 norsk tid

Metas native statistikk, avlest kl. 14:01:09 for **kl. 12:00–14:01:09**, viser **2 server-Purchase, 1 server-AppendAttribution og ingen browser-Purchase-rader**. Purchase ligger i hver sin timebøtte, kl. 12 og 13; AppendAttribution ligger i kl. 13-bøtten. Dette bekrefter mottak av det rettede hendelsesnavnet, men timebøttene identifiserer ikke enkeltkjøp.

Et separat Graph API-kall, fullført kl. 14:09 med samme vindu, viser `content_type`, `content_ids`, `contents`, `currency`, `net_revenue` og `value`: **2 forekomster av hvert felt for Purchase og 1 for AppendAttribution**. Begge pagineringer er fullført. Kallet har ikke kildeskille. **Felttilstedeværelse hos Meta er nå bevist; konkrete beløp er ikke eksponert.** Metas gjeldende CAS-kvalitetssnapshot inneholder nå AppendAttribution med EMQ **9,3/10** og **100 % fbc-feedback**. Kvalitetssnapshotet har egne målevinduer.

Live Events Manager viser Purchase som «Conversions API», EMQ 9,3 og aktiv verdidiagnose. Oversiktens 45 gjelder et UI-vindu som ikke ble lest i denne kontrollen og sammenlignes derfor ikke med API-vinduet. Åpning av detaljene stoppet i nettleserstyringen; ingen innstilling ble endret.

**Åpent:** nettleser-Purchase, individuell browser/server-deduplisering, konkrete mottatte value/net_revenue og endelig attribusjon. Den naturlige annonseklikkreisen har tidligere dokumentert identisk full fbc fra første registrerte PageView gjennom 13 kildehendelser til betalt kjøp; dette er et annet bevisnivå. Komplett samtykkeoppsett og v2→Shopify-overføring utsettes etter brukerens beslutning.

Bevis: `/tmp/utekos-meta-purchase-receiver-1201-20261014.json`, `/tmp/utekos-meta-natural-purchase-fields-20261014.json`, `/tmp/utekos-meta-cas-quality-1210-20261014.json` og `naturalPurchaseReceiverVerification1201` i [JSON-avstemmingen](meta-audit-evidence-2026-10-14.json). Eldre daterte avlesninger nedenfor beholdes som historikk; denne statusen går foran eldre formuleringer om manglende AppendAttribution/net_revenue-felttilstedeværelse.

Status: mottaksstatus er avlest fra Meta. Hele besøkskjeden er ikke ferdig verifisert.
Avlest 14. oktober kl. 11:48:45 norsk tid (09:48:45 UTC), HTTP 200 fra begge rapportene.

## Metas egne rapporter

- [20-timersstatistikk: 13. oktober 15:48:42–14. oktober 11:48:42, norsk tid](https://utekos.no/api/meta/meta-stats?start=1791899322&end=1791971322).
- [Gjeldende kvalitetsrapport](https://utekos.no/api/meta/meta-quality).

Statistikken returnerte 4 341 hendelser fordelt på 17 navn. Begge paginerte kall er fullført med to sider hver. Tallene er mottaksvolum, ikke antall unike besøk eller dedupliserte konverteringer.
Kvalitetsrapporten bruker Metas egne målevinduer og kan ikke filtreres til samme 20 timer via denne ruten. Event coverage er et sjudagersmål; dette innebærer ikke at alle kvalitetsfeltene har identisk periode. Manglende feedback betyr ikke null eller godkjent.

| Hendelse | Mottaksvolum, 20 timer | fbc, lagret rapport | fbc, ny rapport | EMQ | Aggregert browser/server-deduplisering hos Meta |
| --- | ---: | ---: | ---: | ---: | --- |
| PageView | 1 421 | 76,8 % | 71,9 % | 6,1 | 95,49 % via event_id |
| ViewContent | 596 | 85,7 % | 83,6 % | 6,1 | 100 % via event_id |
| AddToCart | 18 | 89,7 % | 50 % | 6,1 | 80 % via event_id + 20 % via external_id |
| InitiateCheckout | 9 | 87,5 % | 75 % | 6,3 | 100 % via event_id |
| Purchase | 1 | Ikke returnert | 100 % | 9,3 | Ikke returnert |
| AddPaymentInfo | 0 | Ikke returnert | Ikke returnert | — | Ikke returnert |
| AddShippingInfo | 0 | Ikke returnert | Ikke returnert | — | Ikke returnert |

`fbp`-dekning er 100 % for de fem første hendelsestypene. De fire typene med dedupliseringsfeedback har 100 % tilstedeværelse av event_id i både browser og server. Det er et separat mål fra faktisk deduplisering.

Metas felt `overall_browser_coverage_from_dedupe_key` beskriver andelen browserhendelser som faktisk dedupliseres mot CAPI; prosentene er inkrementelle per nøkkel. Det er derfor feil å beskrive dette feltet bare som nøkkeltilstedeværelse. [Metas Dataset Quality API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api).
Dette er aggregert mottaksbevis, ikke en individuell kvittering for hver event_id. `event_processing_results` i stats-rapporten er behandlingsmetadata, ikke en slik kvittering.

Lagret sammenligningsgrunnlag: `src/app/api/meta/meta-quality/last_result.mdx` og `src/app/api/meta/meta-stats/last_result/LastResult.mdx`. Snapshotene har forskjellig periode/kohort. Nedgangen i samlet fbc-dekning er observert, men er ikke alene en målt feilrate for annonseklikk; organisk trafikk trenger ikke fbc.

## Førsteprioritet: faktisk klikk-ID fra landing til checkout

1. Kontroller første PageView for besøk der fbclid faktisk finnes eller gjenopprettes: tidspunkt, fbc, event_id og begge leveringsveier.
2. Korreler samme reelle klikk gjennom produkt, handlekurv og checkout; bevar første observasjonstid og klikkets tegn/størrelse.
3. Bruk Meta-mottaket og dedupliseringsfeedback over som sluttkontroll, og marker manglende Purchase-feedback eksplisitt.

## Gjenbruk av rettingene før migrering

Git-historikken i utekos-headless inneholder:

- `4df4517f3ac67ce68f899014f5846ba4bb9140e8`, 1. oktober: await Meta Parameter Builder før kanonisk PageView-emisjon.
- `da0987ec73435558c3ce2cfef2e1354cfa9afbb9`, 3. oktober: bevar fbc-tidspunkt og vent på første Pixel-attribusjon.

De avleste fbc-hjelperne og checkout-snapshotet er videreført. De seks opprinnelige Pixel-regresjonstestene er kjørt mot v2s faktiske `public/analytics/meta-pixel-canonical-v1.js`: **6 av 6 består**. Dette er lokale tester uten nettverk eller produksjonshendelser: URL-klikk, Safari-restaurering, fast frist, organisk besøk, pagehide og eksisterende fbc.

En forskjell gjenstår å undersøke: v2s `src/lib/tracking/runtime.ts` gir Meta-berikelse 1 500 ms, mens klientens IP-kall kan bruke 2 500 ms og SDK-et også kan hente backup-klikk-ID. Den gamle collector-kjeden ventet på berikelsen. En etterfølgende isolert test har nå **reprodusert konsekvensen lokalt**: Med faktisk installert SDK og et simulert iOS Extended Browser Properties-svar etter 1 900 ms, sendes første PageView uten fbc i både browserens kanoniske hendelse og collector-payload. Cookien kommer senere; Pixel og collector sender hver én gang. I en kontrollbygging som bare fjerner 1 500 ms-avbrytelsen og venter på samme SDK-kall, har begge første payloads fbc, fremdeles med én sending hver. Begge kontrollene består.

Dette bekrefter at avbrytelsen kan miste SDK-resultatet ved første sending. **Forekomsten i produksjon er ikke målt.** Kontrollbyggingen endret bare innholdet i minnet under lokal bundling; ingen runtimefil er endret eller publisert. Før en robust retting må også et SDK-kall som aldri svarer, rask checkout og pagehide håndteres og verifiseres; en ubegrenset venting skal ikke uten videre innføres i checkout.

## Støttende kildekontroll, separat fra Meta-mottak

Avgrenset lesing av siste Meta-forsøk per event_id med created_at fra 10. oktober 00:00 UTC til 14. oktober 09:48:42 UTC:

| Kanonisk hendelse | Med registrert fbclid | Med fbc | Samme klikkdel i fbc |
| --- | ---: | ---: | ---: |
| page_view | 1 418 | 1 418 | 1 418 |
| view_item | 653 | 653 | 647 |
| add_to_cart | 33 | 33 | 33 |
| begin_checkout | 17 | 17 | 17 |
| purchase | 9 | 9 | 9 |

989 av 989 PageViews med fbclid i URL hadde også fbc i lagret payload. De seks view_item-avvikene har ingen fbclid i side-URL, men alle kan kobles til en PageView med samme page_view_id. PageViewens rå klikk-ID er den samme, mens fbc er forskjellig. Forsøksradene ligger 11. oktober 20:38:44–20:39:18 UTC; årsaken er ikke fastslått.

En separat kobling via journey/page_view_id finner 19 av 20 checkout-hendelser med en tidligere avlest PageView. Av 16 par med registrert fbclid bevares klikkdelen i alle 16; hele fbc-verdien og opprettelsestidspunktet bevares i 13. Tre har forskjellig fbc-opprettelsestid og må undersøkes videre. Dette er tidligste avleste PageView innen kohorten, ikke garantert første besøk før vinduet. Dette er serverens lagrede kanoniske payloads, ikke bevis for første browser-dispatch, fullført Meta-mottak eller samme sammenhengende besøkskjede.

## Bevisfiler og grense

- `/tmp/utekos-meta-fbc-live-stats-20261014.json`
- `/tmp/utekos-meta-fbc-live-quality-20261014.json`
- `/tmp/utekos-meta-fbc-report-comparison-20261014.json`
- `/tmp/utekos-meta-fbc-canonical-cohort-20261014.json`
- `/tmp/utekos-v2-meta-fbc-first-dispatch.test.mjs`
- `/tmp/utekos-meta-fbc-focused-evidence-20261014.json`
- `/tmp/utekos-fbc-runtime-diagnostic.test.cjs`
- `/tmp/utekos-fbc-runtime-await-reference.test.cjs`

Ingen ny trackingkode, providerinnstilling eller produksjonspublisering er gjort i denne kontrollen. Ingen nye testhendelser, ordre eller replays er sendt.

## Etterfølgende retting — produksjonsdeploy verifisert

Status: implementert, testet og publisert etter brukerens eksplisitte godkjenning av bare fire filer. Commit `21c1ad46d6f51ab3d385dbf3f561032e6a733b3c` er pushet til main; Vercel-deploy `dpl_yg9VTi6yQRug1ACFj4KqGsmmxF7q` er READY fra 12:22:20 norsk tid. Direkte oppslag på `utekos.no` bekrefter samme commit.

Fire filer: `src/lib/analytics/metaClientParameterBuilder.ts`, `src/lib/tracking/runtime.ts`, `tests/tracking-browser.test.cjs` og `docs/tracking/contract-overrides.json`.

- Runtime forkaster ikke lenger Meta-berikelsen etter 1 500 ms. Første PageView og checkout venter på samme SDK-innsamling.
- Samtidige hendelser deler ett SDK-kall. Resultatet brukes før første sending; fbc og opprettelsestidspunkt bevares gjennom checkout.
- Den native appnettleserbroen har ingen innebygd SDK-timeout. En eksplisitt femsekunders applikasjonsgrense og pagehide frigir ventende hendelser med faktiske cookies; timeout logges. Dette er ingen Meta-garanti om at alle klikk-ID-er ankommer innen fem sekunder.
- Et sent SDK-resultat kan brukes av senere hendelser, uten replay av den første. En bro som aldri svarer skaper ikke nye overlappende SDK-kall eller gjentatte femsekunderskøer.
- Serverens eksisterende parameter-context-fallback beholder sine egne tidsgrenser; fem sekunder er derfor SDK-grensen, ikke et universelt maksimum for hele checkout.

Verifikasjon: **381 tester** (366 CJS + 15 gateway), TypeScript, scoped lint, scoped diffcheck og alle 117 kontraktfiler består. Åtte nye nettleserscenarioer kjører faktisk SDK i isolerte Chromium/WebKit-fixturer: sen in-app-ID med umiddelbar checkout, sen IP, aldri returnerende native bro og pagehide med sent resultat. Ingen produksjonskall eller test-event-code inngår.

Patch: `/tmp/utekos-meta-first-dispatch-fix-20261014.patch`.
Maskinlesbar verifikasjon: `/tmp/utekos-meta-first-dispatch-fix-validation-20261014.json`.
Produksjonsmottak, naturlig Safari/in-app-kjede, de tre observerte fbc-tidsendringene og Purchase-deduplisering står fortsatt åpne.

Sluttkontroll med faktisk dokumentnavigasjon: Chromium og WebKit bevarer én logisk PageView. Chromium kan gjøre to transportforsøk når første HTTP-svar mistes; hele payloaden og event_id er identiske, som krevd for serverens idempotens. Den første testforventningen om nøyaktig ett HTTP-forsøk var derfor for streng og ble erstattet med kontroll av én logisk hendelse og uendret retry-payload. Full suite er deretter kjørt på nytt: 366 + 15 bestått, 0 feil.

Ytterligere kildekontroll mens publisering avventer: sortering på hendelsestid i stedet for forsøksradens opprettelsestid bekrefter de samme 16 parene og tre endrede fbc-tidspunkter. Forskjellen er 9 011–16 360 ms. De opprinnelige browser-capture-radene finnes ikke lenger for disse tre; årsaken kan derfor ikke fastslås fra denne avlesningen. Dette er fortsatt en separat åpen kontroll.

## Separat avvik: rå klikk-ID og gjenopprettet SDK-klikk

En ny isolert test med faktisk SDK og seedet lokal klikkhistorikk viser at kanonisk PageView kan beholde tidligere rå `click_id.fbclid`, samtidig som SDK-et gjenoppretter en annen ekte kilde for `browser_id.fbc`. Det lokale klikkcachet forblir også uendret. Testen bruker kun offline-fixturer og har ikke endret repository-kode. Diagnostikk: `/tmp/utekos-meta-in-app-click-correlation-diagnostic.test.cjs`.

De seks historiske view_item-avvikene tilhører én korrelert gruppe i en Meta-appnettleser. De har seks fbc-strenger med samme klikkdel, men forskjellig tidspunkt; rå klikk-ID er en annen. De to klikkverdiene er verken delstrenger, samme prefiks eller bare forskjellige i store/små bokstaver. Dette støtter videre undersøkelse av klikkcachet, men er ikke bevis for den historiske årsakskjeden.

Dette er **ikke rettet av den godkjente firefilspatchen**. Ny URL-klikk-ID må fortsatt ha korrekt prioritet, og en sent ferdigbehandlet gammel hendelse må ikke overskrive klikk fra en nyere navigasjon. De tre fbc-tidsendringene står også åpne.

## Mottaksavlesning etter publisering, kl. 12:23 norsk tid

Begge produksjonsrapporter returnerer HTTP 200. [Nytt 20-timersvindu](https://utekos.no/api/meta/meta-stats?start=1791901392&end=1791973392): **4 442 hendelser**, 17 navn. PageView 1 456, ViewContent 610, AddToCart 18, InitiateCheckout 9, Purchase 1. Kvalitetsrapporten er uendret for disse fem: PageView fbc 71,9 % / dedupe 95,49 %, checkout fbc 75 % / dedupe 100 %, Purchase fbc 100 % / dedupe ikke returnert.

Siste returnerte PageView-timebøtte begynner 09:00 UTC, før deploy 10:22 UTC. Dette er en vellykket mottaksavlesning, men **ikke effektbevis etter rettingen**. Ingen ny test-event-code, kunstig hendelse eller replay er sendt. Bevis: `/tmp/utekos-meta-post-first-dispatch-summary-20261014.json` og de tilhørende stats/quality-filene.

## Rå klikk-ID / SDK-fbc — separat lokal retting klar

Fire nye kontroller feilet mot publisert kode: foreldet rå klikk-ID i Chromium/WebKit, gjenopprettet cookie mot gammel lagring, og sent SDK-svar ved ny URL. Den lokale rettingen samordner nå rå `fbclid` med SDK-ets `fbc`, bevarer full fbc/tidspunkt og andre provider-ID-er, og oppdaterer lagring bare for samme gjeldende side og faktisk cookie. En eksplisitt ny URL-klikk-ID har prioritet; feil fbc fra fallback utelates. Serverfallback får ikke lenger en historisk rå klikk-ID uten opprinnelig fbc-tidspunkt presentert som et nytt URL-klikk.

**Ikke publisert.** Tre filer: `enrichCanonicalEventWithMetaAttribution.ts`, `tracking-browser.test.cjs`, `contract-overrides.json`. **389 tester (374+15), TypeScript, lint og 117 kontrakter består.** Åtte nye offline-scenarioer omfatter også manglende cookies, konflikt i serverfallback og et native SDK-svar etter6,5sekunder, mens nyere servercookie og opprinnelig timestamp beholdes i begge nettlesermotorer. Ingen SDK-patch var nødvendig for dette avleste scenarioet.

Patch og hashes: `/tmp/utekos-meta-click-correlation-fix-20261014.patch`, `/tmp/utekos-meta-click-correlation-fix-validation-20261014.json`. Den tidligere godkjente firefilspubliseringen er fullført; denne lokale oppfølgingen har separat publiseringsgrense. De seks historiske avvikene og tre tidsendringene er ikke dermed bevist forklart i produksjon.

Etter forrige deploy:9 Meta-forsøk, alle HTTP200/accepted_unverified;4 PageView,4 scroll_depth,1 view_item. De7 med rå klikk-ID har samme klikk i fbc. Ingen checkout/Purchase i dette lille avgrensede utvalget. Dette er kilde-/forsøksbevis, ikke Metas endelige mottak eller bevis på hvilken klientbundle hver besøkende kjørte.

### Ny kildeavlesning kl.12:40 norsk tid

To nye Shopify-checkout-hendelser har nå HTTP200 fra Meta. Begge er produksjon/web, har page_view_id, external_id, fbp og GA-klient-ID. Ingen har fbclid/fbc eller registrert URL-klikk. Begge kobles til tilhørende PageView via page_view_id; også disse mangler fbclid/fbc. Tidligste av disse PageViews er10:35:15UTC, siste checkout10:38:32UTC. Ingen journey-tabellkobling eller tagging-observasjon ble returnert. Dette er avleste sidepar, ikke nødvendigvis første side i hele besøket, og gir ikke et annonseklikk→checkout-bevis.

Meta-rapporten generert12:39:40 norsk tid returnerer fortsatt4442 hendelser i [oppdatert20-timersvindu](https://utekos.no/api/meta/meta-stats?start=1791902375&end=1791974375), uendret kvalitetsfeedback og siste checkout-timebøtte04UTC. De nye checkoutene er dermed ikke vist i denne mottaksrapporten ennå. Publiseringsspørsmål er sendt for trefilspatchen; ingen ny godkjenning mottatt. Patch/hashes/index er kontrollert uendret.

## Uavhengig Meta-bekreftelse etter deploytidspunktet

Native Meta Ads bekrefter at datasettet er aktivt, med siste browseraktivitet **12:36:35 norsk tid** og siste serveraktivitet **12:35:25 norsk tid**. Begge ligger etter deploy kl.12:22:20. Dette er faktisk Meta-readback på datasettnivå; det viser ingen individuell fbc-verdi, klientbundle eller dedupliseringskvittering. Gatewaymetadata er nå `NOT_ONBOARDED / NO_UPSELL`; ingen innstilling ble endret. Bevis: `/tmp/utekos-meta-post-deploy-dataset-metadata-20261014.json`.

Utvidet kildekobling for de to checkoutene finner8 tidligere PageViews med samme external_id+fbp siden00UTC. Alle8 mangler fbclid/fbc og registrert URL-klikk. Tidligste avleste side er10:33:45UTC. Ingen registrert klikk-ID vises tapt i dette avleste materialet; anskaffelseskanal og historikk før vinduet er fortsatt ukjent.

## Naturlig kjøp etter deploy, avlest 14. oktober kl. 13:05 norsk tid

Et nytt faktisk kjøp skjedde kl.12:41:45 og fikk Meta-kvittering kl.12:41:51: én kanonisk Purchase, HTTP200, events_received=1 og tom messages-liste. Native Shopify bekrefter én betalt, ikke-testordre med vellykket SALE/CAPTURE; tidspunkt, beløp og valuta samsvarer entydig med den kanoniske hendelsen. Ingen ordre- eller kundedata er lagret i denne rapporten.

Samme external_id og fbp kobler kjøpet til to begin_checkout og ni PageViews i det avgrensede utvalget, hvorav den siste PageView kom etter kjøpet. Alle mangler fbclid/fbc. Det er ingen registrert klikk-ID som forsvinner i dette materialet, men anskaffelseskanalen er ikke bevist. Kjøpet har ingen kampanje og oppfyller derfor ikke den publiserte AppendAttribution-kontrakten. Den publiserte marginberegningen har kjente varekostnader og gir positiv profitt for kildeinputen; faktisk mottatt net_revenue hos Meta er fortsatt ikke avlest.

Metas separate WEB_ONLY/SERVER_ONLY Purchase-kall kl.13:03 returnerte ingen timebøtter fra10:00UTC. Dette er rapportens tilgjengelige utvalg og ikke et fraværsbevis mot den konkrete events_received-kvitteringen. Fersk20t-rapport kl.12:57 viser fortsatt4442 hendelser. Browser-Purchase, slutt-dedupe og prisdiagnosens faktiske mottatte verdier står åpne.

**Ny checkout-gate:** ops.shopify_checkout_observations har53 rader totalt, siste12.oktober14:49:14UTC. Ingen rader13.–14.oktober eller rundt det nye kjøpet. App-pikselen og Next Meta er separate avsendere; fravær i app-tabellen beviser ikke fravær av Meta-browser-Purchase. OPTIONS mot den leverte observations-ruten svarer204 med CORS på frontend21c1ad4/backende9b4b05. Den separate recovery-evidence-ruten svarer404/receiver_disabled; ingen flagg er endret, og dette er ikke bevist årsak til de manglende observations. Vercels avgrensede request-loggsøk returnerer ingen observation-rader, men er ikke et komplett nettverksopptak.

Shopify dokumenterer at checkout_completed utløses på takke-/første upsell-side, og kan utebli hvis siden ikke lastes; pikslene er også samtykkestyrte. Ingen av disse årsakene er bevist for kjøpet. Neste kontroll er faktisk kjøretid/samtykke/levering fra checkout-pikselen, med samme opprinnelige identitet og uten replay. [Shopify checkout_completed](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed), [sandbox/CORS](https://shopify.dev/docs/apps/build/marketing/pixels), [Pixel Privacy](https://shopify.dev/docs/api/web-pixels-api/pixel-privacy).

Bevis: /tmp/utekos-meta-natural-purchase-20261014.json og /tmp/utekos-shopify-observation-preflight-20261014.json. Ingen nye hendelser, ordre, betalinger, testkoder eller providerendringer ble utført.

## Naturlig annonseklikk til kjøp, avlest kl. 13:15 norsk tid

En annen, betalt og ikke-testordre gir nå et konkret kildebevis for første registrerte PageView til kjøp. Første PageView kl. 12:59:11.822 inneholder URL-fbclid som er identisk med kanonisk fbclid og klikkdelen i fbc. Fbc ble opprettet 1 227 ms før denne hendelsen. Alle 13 hendelsene på tvers av åtte hendelsestyper beholder nøyaktig samme komplette fbc, inkludert opprettelsestidspunkt, frem til checkout kl. 13:03:27 og kjøp kl. 13:03:53.

Hendelsene omfatter to PageViews, ViewContent, fem scroll-hendelser, produktliste, AddToCart, ViewCart, InitiateCheckout og Purchase. Korrelasjon er gjort med samme external_id og fbp i det avgrensede kildeutvalget. Alle 13 Meta-forsøk fikk HTTP 200. Native Shopify bekrefter et entydig samsvar i tidspunkt, beløp og valuta samt vellykket full SALE/CAPTURE.

Dette kjøpet har Meta-kampanje og ad_id og kvalifiserer i den publiserte AppendAttribution-mapperen. Meta-kvitteringen kl. 13:04:03 har events_received=2 og tom messages-liste. De forventede navnene er Purchase og AppendAttribution, men de to navnene er ikke individuelt lest tilbake fra Meta. Publisert marginberegning gir positiv profitt; faktisk mottatt net_revenue er ikke eksponert.

Dette beviser bevart klikk og full fbc gjennom den registrerte kildekjeden. Det er ikke et opptak av kundens nettlesernettverk, og hendelser etter deploytidspunkt beviser ikke hvilken klientbundle besøket kjørte. Metas endelige browser/server-deduplisering for denne reisen står åpen. Ingen Shopify app-observasjoner finnes rundt kjøpet. Bevis: `/tmp/utekos-meta-natural-ad-click-journey-20261014.json`.

### Fersk mottaksavlesning kl. 13:25 norsk tid

Native Meta-statistikk viser nå **én server-Purchase i timebøtten som begynner kl. 12:00 norsk tid**. Browser-Purchase og AppendAttribution returnerer ennå ingen rader for vinduet kl. 12:00–13:24:57. Dette er et mottaksbevis på aggregert nivå for én Purchase; API-et oppgir ikke individuell event_id, fbc, value eller endelig dedupe. Den senere annonseklikkreisen ligger i neste timebøtte. Tomme rader er ikke et sikkert fraværsbevis. Bevis: `/tmp/utekos-meta-natural-purchase-receiver-refresh-20261014.json`.

### Konkret samtykkeforskjell som undersøkes

Headless-kilden laster Shopify Customer Privacy API gjennom `ShopifyCustomerPrivacyBridge.tsx`; tilsvarende integrasjon er ikke funnet i v2 src/public. Shopify dokumenterer at app-piksler lastes først når alle deklarerte samtykkekrav er oppfylt. Den lokale checkout-utvidelsen krever analytics, marketing og sale_of_data. Dette er en relevant migrasjonsforskjell, men faktisk checkout-samtykke og årsaken til observasjonsgapet er ennå ikke avlest. Den gamle broens ubetingede samtykkeverdier skal ikke kopieres uten å avklare faktisk samtykkekilde. [Shopify Customer Privacy API](https://shopify.dev/docs/api/customer-privacy), [Pixel Privacy](https://shopify.dev/docs/api/web-pixels-api/pixel-privacy).

Brukeren har presisert riktig Chrome-profil for Shopify. Profilbyttet er ikke gjennomført: aktiv brukerinteraksjon sperret native kontroll, og nettleserens sikkerhetspolicy avviste Chrome-intern profilside. Brukeren er bedt om å åpne Shopify-fanen i riktig profil. Ingen innstillinger er endret.

## Shopify-tilgang gjenopprettet og samtykkeoppsett avlest

Den tidligere innloggingshindringen er løst. En innlogget Shopify-adminøkt for riktig butikk er lest i nettleserutvidelsen `6ca43dc1-abeb-4cfa-b225-0dcacaca675d`. Chrome-profilens e-post er ikke separat avlest. Direkte navigasjon i en egen kontrollfane fungerer, selv om enkelte klikk og tastaturhandlinger fortsatt tidsavbrytes.

Faktisk Shopify UI viser:

- Next Meta er tilkoblet, med **Permission: Not required** og **Data collected does not qualify as data sale**. Den synlige starten på gjeldende kode krever likevel `marketingAllowed === true`.
- Utekos Platform har **Always on** datatilgang. Dette utelukker innstillingen Optimized som forklaring på pausen; det opphever ikke pikselens samtykkekrav.
- Cookie-banneret er konfigurert for Norge med automatiske innstillinger. **Show cookie banner in checkout er ikke avkrysset.**
- v2 bruker fast `operator_policy/granted` i den kanoniske kilden. `utekos_consent` lagres som en egen checkout-attributt; dette er ikke et kall til Shopifys Customer Privacy API. Tilsvarende bro fra headless er ikke funnet i v2.

Shopifys nåværende dokumentasjon sier at ikke-essensielle formål som standard er sperret i samtykkeregioner frem til samtykke. Den krever også at `setTrackingConsent` registrerer en faktisk besøkerhandling. En gjeninnføring av headless-broens automatiske true-verdier er derfor ikke en dokumentasjonsriktig løsning. Dette er en konkret forskjell mellom dagens interne policy og Shopify-oppsettet, men samtykkestatusen i de to faktiske kjøpsøktene er fortsatt ukjent. [Customer Privacy API](https://shopify.dev/docs/api/customer-privacy), [Pixel Privacy](https://shopify.dev/docs/api/web-pixels-api/pixel-privacy), [Always on og Optimized](https://help.shopify.com/en/manual/promoting-marketing/pixels/app-pixels).

### Isolert kontroll av Next Meta v15

Den tidligere avleste komplette koden fra kl. 03:34 norsk tid er kjørt i en VM uten nettverk. SHA-256 samsvarer med den lagrede kildeavlesningen. Ved marketingAllowed=true legges ett Purchase i Pixel-køen; en gjentatt callback lager ikke en ekstra hendelse. To separate fixtures med ulike kjøpsverdier beholder forskjellige verdier. Dersom checkout_completed kommer mens marketingAllowed=false, kølegges ingenting. En senere visitorConsentCollected med true gjenoppretter ikke hendelsen av seg selv; en separat gjentatt kildecallback gjør det.

Dette er testet kontrollflyt, ikke bevis på en faktisk mistet ordre eller Metas mottak. Shopifys egen hendelsesreplay ved samtykkestyrt oppstart av app-piksler ble ikke simulert. Hele dagens providerkode lot seg ikke kopiere på nytt, og ingen endring er lagret eller publisert. Artefakter: `/tmp/utekos-shopify-consent-readback-20261014.json` og `/tmp/utekos-shopify-next-meta-consent-diagnostic-20261014.json`.

## Beslutning om samtykke og ny mottaksavlesning

Brukeren har uttrykkelig valgt å beholde dagens oppsett og la besøkeren håndtere samtykke i Shopify-checkout inntil videre. Komplett samtykkeløsning og overføring fra v2 utsettes. Ingen innstillinger er endret, og dette gir ikke tillatelse til å registrere automatisk samtykke på besøkerens vegne. Den faktiske samtykkestatusen i de to kjøpsøktene er fortsatt ukjent.

Rapporten generert kl. **13:38:30 norsk tid** viser **4 433 hendelser**, 17 navn i [20-timersvinduet](https://utekos.no/api/meta/meta-stats?start=1791905907&end=1791977907). PageView 1 446, ViewContent 631, AddToCart 24, InitiateCheckout 13 og Purchase 2. Dette er et rullerende vindu; endring fra en eldre totalsum er ikke i seg selv et tap av hendelser.

Den samtidige [kvalitetsrapporten](https://utekos.no/api/meta/meta-quality) returnerer fortsatt fbc-dekning 71,9 / 83,6 / 50 / 75 / 100 prosent for disse fem hendelsene og EMQ 6,1 / 6,1 / 6,1 / 6,3 / 9,3. Metas inkrementelle dedupliseringsdekning via event_id er 95,49 / 100 / 80 / 100 prosent for de fire første; AddToCart har ytterligere 20 prosent via external_id. **Purchase har ingen returnert dedupliseringsfeedback.** Kvalitetstallene er et gjeldende snapshot med eget vindu, ikke kvaliteten for akkurat de valgte 20 timene. Det eldre feltet `deduplication_and_coverage` er med hensikt tomt; feedback finnes under `current_emq_and_freshness`.

Et separat native Meta-kall kl. **13:44 norsk tid**, avgrenset fra kl. 12:00, returnerer én SERVER_ONLY Purchase i timebøtten 12:00–13:00. WEB_ONLY Purchase og SERVER_ONLY AppendAttribution returnerer tomme rader. Ingen individuell event_id, fbc, value eller endelig dedupliseringskvittering gis. De to Purchase i 20-timersrapporten er derfor ikke bevis på mottak av begge nye kjøp. Tomme rader er heller ikke et sikkert bevis på manglende levering. Bevis: `/tmp/utekos-meta-consent-continuation-{stats,quality}-20261014.json` og `/tmp/utekos-meta-purchase-receiver-1144-20261014.json`.

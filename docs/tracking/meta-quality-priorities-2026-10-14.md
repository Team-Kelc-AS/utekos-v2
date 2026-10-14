# Prioritert Meta-verifikasjon, 14. oktober 2026

## Nyeste mottaksbevis, 14. oktober kl. 14:09 norsk tid

Metas native statistikk, avlest kl. 14:01:09 for **kl. 12:00–14:01:09**, viser **2 server-Purchase, 1 server-AppendAttribution og ingen browser-Purchase-rader**. Purchase ligger i hver sin timebøtte, kl. 12 og 13; AppendAttribution ligger i kl. 13-bøtten. Dette bekrefter mottak av det rettede hendelsesnavnet, men timebøttene identifiserer ikke enkeltkjøp.

Et separat Graph API-kall, fullført kl. 14:09 med samme vindu, viser `content_type`, `content_ids`, `contents`, `currency`, `net_revenue` og `value`: **2 forekomster av hvert felt for Purchase og 1 for AppendAttribution**. Begge pagineringer er fullført. Kallet har ikke kildeskille. **Felttilstedeværelse hos Meta er nå bevist; konkrete beløp er ikke eksponert.** Metas gjeldende CAS-kvalitetssnapshot inneholder nå AppendAttribution med EMQ **9,3/10** og **100 % fbc-feedback**. Kvalitetssnapshotet har egne målevinduer.

Live Events Manager viser Purchase som «Conversions API», EMQ 9,3 og aktiv verdidiagnose. Oversiktens 45 gjelder et UI-vindu som ikke ble lest i denne kontrollen og sammenlignes derfor ikke med API-vinduet. Åpning av detaljene stoppet i nettleserstyringen; ingen innstilling ble endret.

**Åpent:** nettleser-Purchase, individuell browser/server-deduplisering, konkrete mottatte value/net_revenue og endelig attribusjon. Den naturlige annonseklikkreisen har tidligere dokumentert identisk full fbc fra første registrerte PageView gjennom 13 kildehendelser til betalt kjøp; dette er et annet bevisnivå. Komplett samtykkeoppsett og v2→Shopify-overføring utsettes etter brukerens beslutning.

Bevis: `/tmp/utekos-meta-purchase-receiver-1201-20261014.json`, `/tmp/utekos-meta-natural-purchase-fields-20261014.json`, `/tmp/utekos-meta-cas-quality-1210-20261014.json` og `naturalPurchaseReceiverVerification1201` i [JSON-avstemmingen](meta-audit-evidence-2026-10-14.json). Eldre daterte avlesninger nedenfor beholdes som historikk; denne statusen går foran eldre formuleringer om manglende AppendAttribution/net_revenue-felttilstedeværelse.

Status: aktiv undersøkelse. Ingen påstand om fullført ende-til-ende-verifikasjon.
Tidssone for presentasjon: Europe/Oslo. Kildeperioden er
2026-10-13T04:07:24Z–2026-10-14T00:07:24Z, altså 13. oktober 06:07–14. oktober 02:07.

## Gjeldende prioritet etter brukerens presisering, 14. oktober 11:48 norsk tid

1. **fbclid → fbc fra første PageView, gjennom checkout og deduplisering hos Meta.** Dette går foran øvrig arbeid. Ferske Meta-rapporter og gjenfunnet headless-retting er dokumentert i [fbc-avstemmingen](meta-fbc-reconciliation-2026-10-14.md). Metas PageView-deduplisering er 95,49 %, InitiateCheckout 100 %, Purchase ikke returnert. Lokalt er v2s 1 500 ms-avbrytelse nå reprodusert med manglende fbc på første sending når SDK-et svarer etter 1 900 ms; samme test med venting bevarer fbc. Lokal retting er nå klar i fire avgrensede filer: delt SDK-innsamling, eksplisitt timeout/pagehide-fallback og ingen replay av første event. 381 tester, TypeScript, lint og 117 kontrakter består. De fire filene er publisert i commit `21c1ad4`; Vercel READY og utekos.no på samme SHA er verifisert kl. 12:22. Ny Meta-avlesning kl. 12:23 har 4 442 hendelser, men ennå ikke isolert effekt etter deploy. Rå klikkcache-mismatch har nå separat lokal tre-filretting med389 beståtte tester, TypeScript/lint/117kontrakter; ikke publisert. Hel produksjonskjede og tre historiske fbc-tidsendringer er fortsatt åpne.
2. **Purchase-prisdiagnosen og mottatte kjøpsverdier.** Bevar kildeavstemming; bekreft hva Meta faktisk mottar og bruker.
3. **Standard attribusjon/CAS og net_revenue.** Mottak av AppendAttribution og net_revenue-felttilstedeværelse er nå bevist. Verifiser konkrete beløp og endelig attribusjon.
4. **Mottatte parametre og resterende hendelsers deduplisering.** Aggregert faktisk deduplisering og nøkkeltilstedeværelse skal holdes atskilt; begge er gyldige mottaksmål.
5. **Katalogmatching og datakilder.** Gjenværende to bildekonflikter og mottatte content-ID-er.
6. **Alle 35 katalogoppføringer og reelle utløsere.** Bevar den komplette matrisen; ingen konstruerte forretningshendelser.
7. **SDK, identitet, samtykke og transport.** Fbc-relevante kontroller inngår allerede i prioritet 1. Gateway skal ikke gjenopprettes.
8. **Gjenstående GA4-mottak og promotion-avvik.** POAS-rettingen har nå naturlig mottaksbevis: ni eksakte cart/checkout-par, inkludert kontrollvarianten med mottatt margin 336 kroner. Promotion/refund-avvikene består. Dette er sekundært til Meta-kjeden ovenfor.
9. **Sluttkontroll.** Skill implementert, testet, publisert og faktisk mottatt. Full avstemming er ikke erklært ferdig.

### Ny avlesning kl.13:05 norsk tid

Et naturlig kjøp kl.12:41 er entydig avstemt mot Shopify PAID/test:false og Meta HTTP200/events_received1. Ingen fbclid/fbc/kampanje er registrert i den koblede kilden; dette beviser ikke annonseklikk-kjeden eller AppendAttribution. Ny gate innen prioritet1/7: Shopify app-observasjoner stopper12.oktober, selv om riktig observations-mottaker nå svarer204 på CORS-preflight. Årsak, nettleser-Purchase, faktisk net_revenue og dedupe står åpne. Se siste avsnitt i fbc-avstemmingen.

### Oppdatert kl. 13:44 norsk tid

Shopify-innsynet er gjenopprettet. Brukeren har valgt å beholde dagens samtykkeoppsett og Shopify-checkoutens valg; komplett løsning og overføring fra v2 utsettes. Ingen samtykkeinnstilling er endret. Ny 20-timersrapport viser 4 433 hendelser og Purchase 2; separat native Meta-kall fra kl. 12:00 viser én server-Purchase, men ingen browser-Purchase-rader. Purchase-deduplisering, individuell mottakskontroll for den senere annonseklikkreisen og faktisk mottatt net_revenue står fortsatt åpne. Se siste avsnitt i fbc-avstemmingen for presise vinduer og bevisgrenser.

### POAS-mottak bekreftet kl. 13:51 norsk tid

GA4s råeksport inneholder ni nye `poas_estimate` etter GTM-publiseringen: seks add_to_cart og tre begin_checkout. **9/9** har nøyaktig ett standardevent med samme event_id og kildenavn; valuta og value samsvarer i alle parene. To marginer er 336 kroner, sju er 1 036. Ett av de to 336-parene gjelder nøyaktig kontrollvarianten fra den tidligere feilen, med antall 1 og value 676; tidligere mottok GA4 −340 for denne varianten. Mottakssteget for den avgrensede doble rabattberegningen er dermed verifisert.

Dette er et estimat fra katalogmarginen før kjøp. Én av de øvrige radene har value 1 512 og estimat 1 036, samme estimat som ved value 1 592; dette dokumenterer at estimatet ikke er faktisk ordreprofitt. Det lukker ingen Meta-Purchase-, net_revenue- eller dedupliseringskontroll. Ingen nye hendelser eller providerendringer ble utført. Bevis: `/tmp/utekos-poas-natural-receiver-verification-20261014.json`, med SQL og ni eksakte par. [GA4-eksportskjema](https://support.google.com/analytics/answer/7029846), [Stapes marginvariabel](https://github.com/stape-io/stape-store-margin-lookup-variable/blob/main/template.tpl).

## Tidligere detaljstatus, 14. oktober 09:33 UTC

Oppdatert kl. 13:25 norsk tid: En ny naturlig annonseklikkreise har identisk URL-fbclid/kanonisk klikk og full fbc fra første registrerte PageView gjennom alle 13 hendelser til betalt kjøp kl. 13:03. Alle serverforsøk fikk HTTP 200; kjøpsbatchen fikk events_received=2. Meta rapporterer nå én server-Purchase i den tidligere timebøtten kl. 12–13. Nettleser-Purchase, den senere kjøpsbatchens individuelle mottak, faktisk net_revenue og endelig deduplisering står fortsatt åpne. Shopify-kontrollen må utføres i brukerens oppgitte Chrome-profil; tilgangen til denne fanen avventer. Dette endrer ikke den nummererte prioriteringen eller øvrige åpne kontroller.

Mottak avstemmes nå primært mot Metas API-er og Events Manager. Se
[Meta-mottak og API-kart](meta-received-verification-2026-10-14.md) for tall og bevisgrenser.

1. **Standard attribusjon og CAS-avstemming.** Meta mottar AppendClickAttribution,
   også i custom_attribution-kanalen, mens gjeldende referanse krever AppendAttribution.
   CAS-widgetene viser1/2 trinn. De ti godkjente backendfilene er pushet i cc32139,
   første build feilet på generert manifestdrift. De to nødvendige genererte
   følgefilene er nå publisert innenfor samme mandat i e9b4b05. Native Vercel
   bekrefter READY og backend.utekos.no på samme SHA. Mottak/CAS/attribusjon gjenstår.
2. **Purchase, browser og checkout.** Høy prioritet: live Meta-diagnose bekrefter
   identisk prisinformasjon for web Purchase. Først oppdaget 22. september; aktivlisten
   sier observert siste tre dager, uten eksakt siste tidspunkt. Avsluttet lesing
   viser 42 unike kanoniske Purchase-payloads med åtte ulike positive NOK-beløp;
   42/42 beløp og valuta matcher Shopify-snapshots. Native Shopify bekrefter 43
   betalte, ikke-testordre med én vellykket SALE lik total per ordre; 42 unike
   processedAt+beløp-par matcher de kanoniske hendelsene. To eldre forsøksrader uten
   payload holdes separat. Meta viser 43 Purchase i oversikten, mens en separat
   sjudagers kvalitetsvisning har volum 2 og 100% value-dekning. Faktiske mottatte
   verdier og diagnosekohorten eksponeres ikke. Ingen prisfeil er reprodusert i
   avleste avsendere; kildematch og HTTP200 beviser ikke endelig mottatt value.
   Meta viser server-Purchase og EMQ9,3/10;
   browser-Purchase og endelig dedupe er åpne. Metas historiske UI viser også
   AddShippingInfo23/AddPaymentInfo17. Fravær i20t-vinduet beviser ikke manglende historisk mottak.
3. **Alle relevante parametre hos Meta.**18 fullførte custom_data_field-kall og18
   kvalitetsrader er hentet. Tomme parameterstatistikker og fjernede prøvedata krever
   videre mottakskontroll av naturlige hendelser i Events Manager; Test Events er avsluttet,
   og kodeavsendelse alene lukker ikke saken.
   Meta viser nå sju kontrollerte interaksjoner med3–15 faktiske parametre, i tillegg
   til04:02-forekomstene PageView/ViewContent som Processed og11 ViewContent-parametre.
   To senere PageView-forekomster er Deduplicated, som angitt i punkt4.
   Full produkt-URL sendes, mens Meta viser rot-URL;
   PageView merkes Custom event. Kategori/valg/to listeforekomster er også avlest:
   alle49 custom-data-felter samsvarer, men liste-POST er blokkert i nettleseren.
   Årsak og praktisk betydning er fortsatt åpne.
   Godkjent parameteravtale er nå bekreftet: alle fire blokkeringskategorier er
   tomme, inkludert Blocked by Meta. Ingen innstilling er endret. Tom blokkeringsliste
   beviser ikke full parameterdekning eller endelig bruk hos Meta.
   Separat godkjent hendelsesinnsyn06:45 viste FormStart/FormError i Action required.
   Etter eget JA er begge bekreftet06:55:0 Action required/15 Confirmed;
   én inaktiv __missing_event er fortsatt Blocked by you.
   Standard events omfattes ikke av denne custom-gjennomgangen.
4. **Faktisk deduplisering.** Meta Test Events viser nå fire konkrete forekomster
   som Deduplicated: LandingScrollDepth, InteractWithAccordion, ViewCart og
   RemoveFromCart. I tillegg er SelectItem, ViewCategory og to ViewItemList nå
   Deduplicated. Ny avlesning05:04UTC legger til PageView×2 og ViewCart×1:
   elleve forekomster totalt, alle med korrelert ID/server200/events1. Dette er
   forekomster, ikke elleve hendelsestyper. AddToWishlist,
   AddToCart og InitiateCheckout er mottatt med11/12/13 synlige parametre, men står
   fortsatt Processed. Deres dedupe, Purchase og historikken er ikke ferdig avklart.
   Den separate kvalitetsavlesningen har dedupe-feedback for11 av18 typer.
   Avgrenset kontroll05:12 bekrefter uendret status. Publisert mapper bevarer navn/ID,
   men historisk endelig CAPI-payload og produksjonspixel er ikke avlest som wirebevis.
   AddToCart viser100% aggregert deduplisering (80% event_id +20%
   external_id); dette er ikke en kvittering for den konkrete forekomstens dedupe.
5. **Korrekt verdi og profitt.** Publisert retting legger til standardfeltet net_revenue
   fra eksisterende marginberegning. Meta viser foreløpig ingen profittdekning.
   Omsetning uten mva. skal ikke behandles som profitt; ingen kampanje endres.
6. **Katalogmatching og datakilder.** Meta988/1000=98,8% for14.september–11.oktober.
   Dagens kjøp inngår ikke i denne historikken. Alle sju utsolgte varianter er nå
   avstemt mot Shopify: lager0, nettlager0, DENY. Metas status er korrekt.
   De to image-konfliktene gjelder Mikrofiber Fjellblå Medium/Large, begge Eligible
   med synlige bilder. Image-prioriteten er App, Manual Creation, suppleringsfeed.
   Eksakt bildeforskjell står åpen; feeden har ingen regler.
   Alle fire feedkjøringer lyktes med advarsler og0feil; generelle health-flagg tolkes presist.
7. **Alle35 katalogoppføringer og reelle utløsere.** Fortsett hver eksisterende
   kilde/provider-grense. Search ble bevisst fjernet. Meta har historisk mottatt
   OpenQuickView87, selv om gjeldende UI-produsent ikke er lokalisert. Ingen oppdiktede
   leads, kjøp, refusjoner eller app/offline-konverteringer for å fylle matrisen.
   GA4 bekrefter historisk mottak av promotion/video/variant/size-guide. Promotion-
   payloads mangler items; view_promotion krever reell produktkobling. To refund-
   forsøk har Data Manager SUCCESS mot riktig property, mens GA4 viser én refund.
   Begge avvik er dokumentert uten replay eller oppdiktede varelinjer.
   Råeksporten bekrefter nå samme fire standard-ID-er hos GA4, én rad/én varelinje hver.
   Dagens14 promotion-forekomster har event_id, men0items. Refund5.oktober finnes
   heller ikke i de avleste daglige råtabellene2.–12.oktober.
   Restarbeidsvurderingen har nå ett konkret neste tiltak per katalograd.
   Ny eksakt-ID-kontroll bekrefter11/11 GA4-par for variant/guide/video/kvalifiserte
   leads og33/33 feltverdier. De to leadene har også Meta200/events1 og Lead i
   relevante Meta-timebøtter; bøttene mangler ID og beviser ikke dedupe.
   Server-GTM-transformasjon55 lager poas_estimate fra Data Client
   cart/checkout; bare GA4-taggen videresender. Fem poas_estimate-forekomster er
   én ekstra type ved siden av de35. Nå er5/5 kildepar avstemt: faktisk GA4-margin−340
   gjenskapes av tidligere versjon44 som336−676. Feedmarginen bygger allerede på
   salgspris ekskl.mva. Etter uttrykkelig JA er versjon45 publisert09:17UTC med
   useDiscount=false i variabel54. Alle37 objekter er sammenlignet; bare denne
   variabelen er endret, og aktiv versjon er lest tilbake.11/11 lokale kontroller
   består. Kvalifisert naturlig GA4-mottak etter publisering gjenstår; ingen
   Meta-Purchase-årsak er bevist.
   Promotion-GTM-ruten er avlest; separat backend-rute og items-avviket består.
8. **SDK, identitet, samtykke og transport.** Ti-trinnsmatrisen er nå ført i
   mottaksrapporten. Ny organisk PageView07:04 har én IP200 før event, _fbi som
   matcher responsen, og samme fbp/external_id i browser og backend; Meta-server200/events1.
   Direkte PixelGET fikk200. Dette avklarer ikke de to tidligere ViewItemList-POST
   med ERR_BLOCKED_BY_CLIENT/inspector, selv om begge vises hos Meta.
   Metas eget Pixel-script konfigurerer også OpenBridge: samme ID/datasett/identitet
   sendes til AWS. Kallet har HTTP200 etterfulgt av ERR_ABORTED, uten lesbar body;
   endelig mottak/dedupe er åpent. Native Meta sier samtidig NOT_ONBOARDED/NO_UPSELL,
   og mål-pikselen ble ikke funnet i den tidligere avleste eierkonteksten.
   Denne tilgangskonklusjonen er senere motbevist av korrekt delt businesskontekst.
   Stape setter faktisk _sbpee i to __sgtm-svar,90d/Secure/HttpOnly/Lax.
   Enricher-sluttpayload er ikke avlest. Chrome-loaderens manglende kp-prefiks
   følger den publiserte Safari16.4+-betingelsen og er ikke et påvist avvik.
   Reelt fbclid/kunde-PII, Safari, IPv6, cookiefornyelse og pagehide/retries står åpne.
   Brukeren fant og frakoblet mål-pikselen selv. Riktig delt businesskontekst er
   538548380599665; eier er 1384717111999921. Gatewaykortet er borte i den delte
   konteksten. History registrerer frakobling 07:59 UTC og generisk CAPI-tilkobling
   08:01; sistnevnte beviser ikke alene gateway-reonboarding. Uavhengig viser fersk
   Pixel-config 08:01:54 OpenBridge=true med ny AWS-host og faktisk POST200 +
   ERR_ABORTED. Årsaken er åpen. Direkte Pixel200/fullført og backend Meta200/events1
   er avstemt på samme nye PageView-ID. Ingen providerinnstilling er endret av agenten.
   Den gamle «mangler Disconnect»-gaten utgår; supportsaken er ikke sendt.
   Avgrenset GTM/Stape-kontroll er avsluttet: faktisk loader matcher web175;
   Google-config/Data Tag/loader inneholder ingen OpenBridge-aktivering. Metas
   config leverer endpoint og opt-in. Stape-rammene i initiatorkjeden er generiske
   fetch-wrappere som ikke omskriver AWS-adressen. Historisk opphav er fortsatt ukjent.
   Bevar operator_policy-beslutningen og skill den fra besøkendes registrerte valg.
   Stapes innloggede konto viser05:18 ingen Signals Gateways eller andre gateways.
   Dette avklarer kontoinventaret, ikke eierskapet til historisk SERVER-trafikk.
   16 avgrensede retry/lifecycle/identitetskontrakter består. Et isolert hidden-
   eksperiment viste venting, men også bevart forsinket Google-identitet ved kort
   hidden→visible. Produksjonstap er ikke bevist; ingen runtimeendring er gjort.
9. **Sluttkontroll og handoff.** Rapportrettingen er publisert i50f2647 og avlest200.
   Backend cc32139 og nødvendig generert oppfølging e9b4b05 er publisert etter
   eksisterende mandat. Native Vercel dpl_5191TMroGXJmufcEg1LBY5MNMFFB er READY,
   og backend.utekos.no bekrefter e9b4b05. Opprinnelige40 tester/TypeScript/lint,
   manifestcheck/fire tester/diffcheck og full lokal prebuild (EXIT0) består.
   Native Codex-environment-listen er tom. Den tidligere fortsettelsesagenten
   /root/meta_receiver_continuation fullførte sin avgrensede oppgave. Siste agentliste
   viser bare root; ingen ny overføring er gjennomført. Kildetråden er fortsatt aktiv.
   Ingen arkivering eller fullført ende-til-ende-status er påstått.

**Fersk Meta-status09:40UTC:** 4341 hendelser/17 navn siste20timer, inkludert
Purchase1. Purchase EMQ9,3, men ingen returnert Purchase-dedupefeedback.
Full avstemming er ikke ferdig. Meta-prisdiagnose, standardevent-dedupe og
mottatte parametre prioriteres foran videre GA4-promotiondesign.

### Neste konkrete tiltak og avhengighet per prioritet

| Prioritet | Neste tiltak | Avhengighet / grense |
| --- | --- | --- |
|1|Avstem nye standardfelt og CAS ved neste kvalifiserte naturlige handel.|Backend e9b4b05 er READY på produksjonsalias. Ingen replay; faktisk Meta-mottak og attribusjon gjenstår.|
|2|Innhent Metas konkrete diagnosekohort/prisverdier hvis leverandøren eksponerer dem, ellers korreler full wire ved neste naturlige kvalifiserte Purchase.|Historisk avgrenset lesing er fullført: 42/42 kildebeløpsmatch, åtte beløp, native PAID/test:false-kvalifikasjon. Meta skjuler prøvedata og faktisk verdifordeling. Ingen reprodusert prisfeil, konstruerte kjøp eller replay.|
|3|Fortsett parameterkorrelasjon mot faktisk mottak og neste naturlige hendelse.|Parameterinventaret er tomt. Etter eget JA er FormStart/FormError Confirmed by you, total0 Action required/1 Blocked/15 Confirmed. Dette aktiverer bruk med ads features, men beviser ikke attribusjon eller standardevent-dedupe.|
|4|Innhent endelig navn/ID/datasett fra neste naturlige standardhendelses CAPI-forsendelse og korreler mot Meta.|Eksisterende historiske sluttpayloads er ikke lagret. Lokal mapper er støttende kodebevis. Gjentatt avlesning av samme Processed-rader gir ikke det manglende wirebeviset.|
|5|Verifiser net_revenue-feltets faktiske produksjonsmottak og verdigrunnlag ved neste kvalifiserte Purchase.|Backend e9b4b05 er READY; krever naturlig handel; ingen kampanjeendring eller oppdiktet profitt.|
|6|Sammenlign de to opprinnelige image-verdiene med gjeldende produktbilder.|Metas feednedlasting er Denied. Krever lesbar kildefil eller gjenopprettet leverandørtilgang; ingen omgåelse eller blind kildeprioritetsendring.|
|7|Eksakt GA4-korrelasjon og publisert GTM er fullført for utvalget. Alle5 poas-ID-par er nå avstemt. Dobbelt rabattfradrag gjenskapte−340; den ene godkjente variabelrettingen er nå publisert i versjon45 og aktiv innstilling er verifisert.11/11 lokale kontroller består; kvalifisert naturlig GA4-mottak etter publisering gjenstår. Promotion-mottak, rapportmetadata, tre detaljrapporter, fire oversikter, tre rapportkort, elleve sammenligninger og én utforskning er lest. Historiske promotion-navn inngår i hendelsesrapport og utforskning; navnebytte krever uttrykkelig historikkhåndtering. Eksterne rapporter og full utforskningsinventarliste er fortsatt åpne.|11/11 par og33/33 feltverdier samsvarer; ikke allhistorikk eller dedupe. Meta-leadtimebøtter har ingen ID. Refund-kontroll er avsluttet. filter/sort/quick-view krever kilde/katalogavklaring; nye Lead/FormSubmit/app/offline krever legitim kilde. Search forblir fjernet.|
|8|Bevar fullført runtimeavstemming og avklar gjenværende Meta-konfigurasjon når ny konkret providerinformasjon finnes; ingen ny disconnect eller supportmelding.|Web175 samsvarer med faktisk loader, server44 er avlest. Runtimekilde til OpenBridge er Meta-config; historisk opphav ukjent. Brukerens frakobling er registrert, men nettverksruten er fortsatt observert. Direkte Pixel/CAPI er bekreftet; ingen blind deaktivering.|
|9|Bevar samsvar mellom ny produksjonsstatus og mottaksbevis.|e9b4b05 READY/alias verifisert. Alle35 rader og gjenstående mottaks-/naturlig-kjøp-gater beholdes.|

Bevis for avgrensningen: `/tmp/utekos-meta-standard-dedupe-investigation-20261014.json`,
`/tmp/utekos-meta-addtocart-dedupe-ui-20261014.json` og tilsvarende PNG,
`/tmp/utekos-meta-stape-sender-inventory-20261014.json` og tilsvarende PNG.

De1809 særskilt godkjente gjenleveringene er ferdige med Metas egne200/events_received=1
og uavhengig Supabase-avstemming. Det godkjente kjøpet er også gjenlevert. Ingen av disse
skal sendes på nytt. Endelig dedupe/attribusjon er separate kontroller.

Produksjonskontrollen gjennom02:18:53UTC: bare den særskilt godkjente
akkordeonrettingen er publisert (a0a0c82, Vercel READY). Ingen ny kjøretidskode
er endret i hero-/skjemakontrollen. Forhandlerskjemaets FormStart/FormError og
HeroInteract fikk Meta OG Microsoft200/eventsReceived1; Google accepted_unverified.
Kontaktskjemaets tilsvarende Meta/Microsoft-forsøk ble korrekt kvalifikasjonshoppet.
Detaljer og bevisgrenser finnes i meta-event-verification-2026-10-14.md.

## Opprinnelig prioritert talliste fra kildeperioden

1. **Gjenopprett Meta-serverlevering og verifiser rotårsaken fra produksjon.**
   Live Supabase-avlesning viser 1 810 Meta-forsøk i kildeperioden som
   dead_lettered med MetaConversionsApiHttpError / HTTP 400, inkludert Purchase.
   Det finnes også fem dead_lettered-forsøk i avlest siste time.
   Lagrede response/validation_result er tomme, så den historiske Meta-koden
   kan ikke rekonstrueres fra disse radene alene.
   Native Meta Developer Tools viser server_ip_allowlist=[10.0.0.63] for
   app 1154247890253046. Backend bruker appsecret_proof når META_APP_SECRET
   foreligger, og Vercel-prosjektet har ingen avlest Static IPs/Secure Compute.
   Lokale credentials kan lese pixel uten proof (200), men avvises med proof
   (400/code 100/server-IP ikke tillatt). Dette er et reprodusert lokalt
   konfigurasjonsavvik; eksakt produksjonsfeilkode må fortsatt avleses.
   Vercel env pull maskerer sensitive verdier som [SENSITIVE]. Prober med disse
   plassholderne er forkastet som credential-bevis, og tempfilen er slettet.
   Brukeren godkjente å tømme IP-listen. Ny native avlesning 14. oktober
   00:48:33 UTC viser server_ip_allowlist=null, og nyinnlastet UI viser tomt felt.
   Feltet var allerede tomt ved denne fortsettelsen; ingen Clear/Save ble utført her.
   Ingen betalt Static IP-tjeneste er aktivert. appsecret_proof er bevart.
   Samme lokale, lesende dataset-kall med proof gir nå HTTP 200.
   En vanlig produksjonsreise forside → Comfyrobe ga fem korrelerte Meta-forsøk:
   PageView ×2, LandingScrollDepth, SelectItem og ViewContent. Alle fikk HTTP 200
   og events_received=1, med samme kanoniske ID/tid som nettleserforespørselen.
   Dette verifiserer gjenopprettet API-levering for disse hendelsene. Meta-prosessering,
   nettleser/server-deduplisering og full historisk gjenlevering er fortsatt åpne.
   Det ene godkjente kjøpet er siden gjenlevert og registrert hos Meta; se nedenfor.
   Lokal backendretting bevarer Meta-kode/subkode og lukket IP-feilkategori uten
   rå feilmelding eller persondata; 12 tester består. Rettelsen er ikke publisert.
   Meta-kildestatistikk returnerer også SERVER_ONLY-hendelser i perioden,
   eksempelvis 460 PageView og 4 AddToCart. Dette står i motsetning til outbox-
   feilene og krever avstemming av sender/eierskap; vi hevder ikke at all
   Meta-servertrafikk fra alle integrasjoner har stoppet.
2. **Verifiser Purchase og hele checkout-kjeden mot faktisk handel.**
   Rapporten viser 4 InitiateCheckout, men ingen Purchase, AddShippingInfo eller
   AddPaymentInfo. Supabase-avlesning finner én PAID-ordre opprettet i perioden.
   Avstem betalings-/hendelsestid, teststatus, samtykke, Shopify-pixel, mottaker,
   kanonisk ledger, outbox og Meta-kvittering før dette klassifiseres som feil.
   Nyhetsbrevsabonnement er ikke bevis på gyldig sporingssamtykke.
   Avklar Purchase-eierskap og sammenfallende nettleser/server-ID per faktisk ordre.
3. **Kontroller Stape/GTM-eierskap og samtykke gjennom hele kjeden.**
   Avles publiserte web-/servercontainere, triggere, transformasjoner og eventuelle
   Shopify-integrasjoner. Finn alle Meta-sendere og verifiser at samme handling
   ikke får flere eiere. Live Stape har Cookie Keeper for Facebook aktiv og
   Enricher i automatic-modus med requiresConsent=false for cookies/store.
   Dette er konfigurasjonsfakta, ikke i seg selv bevis på ulovlig eksport.
   Verifiser reell flyt før samtykke, ved avslag, godkjenning og tilbaketrekking.
   Dagens kode og MIGRATION-PLAN viderefører brukerens tidligere operator_policy
   med granted som standard. Dette endres ikke under dekke av en sporingsretting.
   Operatørpolicy er ikke et registrert valg fra den enkelte besøkende.
   GTM UI bekrefter live serverversjon 44 med bare GA4-taggen, og live webversjon
   175 med Meta Pixel, Canonical browser parity og Signals Gateway-taggene pauset.
4. **Lukk avvik i event_id-basert deduplisering.**
   AddToCart: 80 % event_id + 20 % external_id. SelectItem: 84,93 % + 5,48 %.
   PageView: 95,76 %. LandingScrollDepth: 92,33 %. ViewCategory: 94,29 % + 5,71 %.
   ViewItemList: 95,14 % + 4,26 % + 0,61 % fbp.
   Meta beskriver bidragene som inkrementelle; 80 % event_id betyr derfor ikke
   automatisk 20 % dobbelttelling. Kontroller samme eventID/event_id, navn,
   datasett, innhold og mottakstid på faktiske sammenhørende hendelser.
5. **Gjør rapportens bevis og tidsbegreper presise.**
   last_event_at beregnes i koden fra starten av en timebøtte, ikke et eksakt
   hendelsestidspunkt. event_processing_results i vedlegget inneholder bare
   hendelsesnavn og er ikke leverings-/dedupliseringskvitteringer.
   Dataset Quality er gjeldende kvalitetsdata; event coverage er ifølge Meta et
   7-dagers gjennomsnitt, ikke automatisk rapportens 20-timersperiode.
   Manglende felter, pagineringsavkorting og ukjent nevner må vises eksplisitt.
6. **Produser og verifiser alle manglende hendelser fra deres reelle utløsere.**
   Av de 18 navnene i requiredMetaDatasetQualityEvents mangler også
   InteractWithAccordion og OpenQuickView. Kartlegg hele gjeldende eventCatalog,
   ikke bare disse 18: kilde, aktiv/planned/blocked-status, skjema, parameterkrav,
   samtykke, nettleser-/servermapping og verifikasjonsbevis per hendelse.
   En uobservert handling skal ikke konstrueres som en kundekonvertering.
   Gjeldende katalog har 35 oppføringer og 24 Meta-mappinger. Search ble bevisst
   fjernet fra aktiv sporing ifølge MIGRATION-PLAN og GTM live 174-endringsnavnet;
   avviket er en utdatert aktiv-katalogpåstand, ikke grunnlag for å gjenaktivere
   søkesporing. Se meta-event-verification-2026-10-14.md.
   Ny faktisk produktkontroll påviser at InteractWithAccordion mangler fordi
   den delte Base UI-komponenten ikke leverer observerens data-slot-markører.
   Avgrenset retting med egne sporingsmarkører er publisert i a0a0c82 etter
   konkret godkjenning av bare tre filer;363tester,TypeScript og scoped lint består.
   Materialer-åpning er nå avlest med202 fra samler og200 fra Meta både browser
   og server, samme ID/tid. Lukking sender ingen ny hendelse. Endelig dedupe er åpent.
   AddToWishlist er utløst fra faktisk UI og har Meta-serverkvittering; fjerning
   skapte ingen ny add-hendelse og opprinnelig ønskelistetilstand er gjenopprettet.
7. **Optimaliser identitets- og handelsparametre ut fra tilgjengelige data.**
   Kontroller fbp/fbc/fbclid-korrelasjon, stabil external_id, korrekt hashing og
   normalisering, IP/UA, katalog-ID, variant, contents/content_ids, quantity,
   value/currency, rabatt, skatt og kilde-URL. Lead har email/phone 100 %, men
   fbc 0 % i vedlegget. Kontroller om klikk-ID faktisk forelå før dette kalles
   tap. Anonyme besøk skal ikke få oppdiktet email/phone/fb_login_id.
8. **Mål og rett faktisk leveringsforsinkelse og retries.**
   ViewItemList er merket daily, PageView/ViewContent/LandingScrollDepth hourly.
   Avstem occurred_at, innsamling, kø, forsøk og Meta-mottak før vi konkluderer
   om årsak. Verifiser gjentakelser, navigasjon/pagehide, langsomt nett,
   adblock, Safari og idempotens uten nye konverterings-ID-er ved retry.
9. **Fullfør samlet verifikasjon, produksjonsavlesning og handoff.**
   Hver hendelse må ha dokumentert trigger, komplette relevante parametre,
   samtykkebevis, korrelerte transport-ID-er, ledger/outbox og leverandørbevis.
   Lokale tester, HTTP 202, events_received, deduplisering og attribusjon er
   separate bevisnivåer. Oppdater denne listen og den samlede hendelsesmatrisen
   etter hver lukket feil. Context Handoff skal bevare hele målet og åpne krav.

## Kilder og avlest status

- Brukervedlegg: src/app/api/meta/meta-quality/last_result.mdx og
  src/app/api/meta/meta-stats/last_result/LastResult.mdx.
- Stats-generering: 2026-10-14T00:08:00.026Z, total_event_count 2787,
  13 hendelsestyper. Antall er rapportert av eksisterende rapportkode og ennå
  ikke selvstendig avstemt mot kilde-/serverfordeling og ledger.
- Gjeldende kravliste: src/lib/analytics/metaDatasetQualityRequiredEvents.ts.
- Live Meta Ads MCP: dataset 1092362672918571 returnerer samme 13 hendelsesnavn;
  connectoren utelater dedupliseringsfelter og kan ikke bevise dem.
- Første Vercel-avlesning i undersøkelsen: utekos.no peker på utekos-v2, main,
  8d114c7a73fd3420227b9257fc4bd0c3e158e1ce,
  deployment dpl_EbBCxzNaCBByAHq1KGoQLYfrcCcV, READY.
- Historisk produksjonsavlesning etter akkordeonrettingen: main
  a0a0c8206eb75b1537f45ce5c9ba147dfd246fb7, deployment
  dpl_5T7oMS3UULwTUZbF6eQ9T9DL1irM, READY, alias utekos.no.
- Siste dokumenterte v2-publisering: main50f2647cb54ddb7f60d82481667947858a523347,
  Vercel dpl_BMLprD8oRXm3QLqM5HTH5xEAU81E, READY med sammeSHA og alias utekos.no.
  Produksjonsrapporten svarte200/no-store03:23:02.574UTC; native Vercel-status og
  avlesningsbevis er bevart i audit-JSON/metaStatsReportLocalCorrection. Ny rapportavlesning
 04:23:45.283UTC svarte også200. Dette er dokumenterte avlesninger, ikke ny deploy.
- Live Stape: gqnrnczg / GTM-M8GT97CV, running, warnings=[], Pro, paid,
  paymentStatus=ok, limitExceeded=false. edge.utekos.no og /__sgtm,
  web GTM-5TWMJQFP. Full kontorespons inneholder hemmelige felter og skal
  aldri kopieres inn i rapporter eller handoff.
- Utekos Shopify Platform MCP describe_checkout_bridge oppgir development-only,
  utekos-dev.myshopify.com, server_outbox_enabled=false. Dette er ikke bevis på
  produksjonsbutikkens nåværende checkout-pixel eller backendmottaker.

## Offisiell dokumentasjon hentet i denne undersøkelsen

- [Meta: deduplisering](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events)
  — samme navn og eventID/event_id, samme pixel, mottak innen 48 timer;
  fbp/external_id er en alternativ mekanisme med egne begrensninger.
- [Meta: Dataset Quality API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api)
  — inkrementelle dedupliseringsbidrag, event coverage over 7 dager og
  forskjellen mellom freshness og eksakt hendelsestid.
- [Meta: serverparametre](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event)
  — event_time, event_name, action_source og kilde-URL.
- [Meta: kundeparametre](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters)
  — må hentes og avstemmes per konkret parameterendring før implementasjon.
- [Meta: endringslogg](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog)
  — lenke funnet via native MCP; relevant versjonsinnhold gjenstår å lese.
- [Meta: Login Security](https://developers.facebook.com/documentation/facebook-login/security)
  — Server IP Allow List begrenser kall som bruker apphemmeligheten;
  bruker-tokenkall uten denne hemmeligheten berøres ikke av samme innstilling.
- [Vercel: Static IPs](https://vercel.com/docs/networking/static-ips)
  — statisk egress, regionalt IP-par, USD 100/måned/prosjekt pluss trafikk.
- [Shopify: Pixel Privacy](https://shopify.dev/docs/api/web-pixels-api/pixel-privacy)
  — init.customerPrivacy og visitorConsentCollected må avstemmes mot eksport.

## Utestående bevis

Fullført ende-til-ende-verifikasjon er fortsatt åpen. Serverlevering er gjenopprettet,
og det ene godkjente kjøpet har Meta-kvittering og registrering i statistikk.
GTM MCP møter daglig Google API-kvote (429);
direkte GTM UI-avlesning har verifisert live tagg-eierskap. Codex Tasks returnerte ingen registrerte
miljøer, så automatisk ny tråd er ikke opprettet. Context Handoff-pakke er bevart
i /tmp/utekos-meta-tracking-handoff-20261014.md.
Ingen kundebetaling, refusjon, e-postutsendelse,
providerpublisering eller ny bakgrunnsjobb er utført i undersøkelsen.
Samtykke og isolering av tester gjelder som krav i alle punktene.

Lokale kontroller: storefrontens eksisterende tracking-suite består med
346 tester + 15 gatewaytester. Backendens avgrensede sender/worker/Purchase/
InitiateCheckout-kontroll består med 22 tester; scoped lint og tsc --noEmit
består. Ingen av disse testene beviser produksjonsmottak eller deduplisering.

Utvidet backendkontroll: 63/64 mapper-/identitets-/sendertester bestod før retting.
Den ene feilen var en feilaktig testfixture: testen «fails closed ... without
marketing consent» sendte marketing=granted. Den er rettet til denied for å
faktisk kontrollere eksisterende avvisningsregel. Ingen runtime-policy er endret.

## Appens publiseringsstatus

Brukeren opplyser at appen var upublisert i 1,4 år og ble publisert i går.
Dette er registrert som brukeropplysning; historisk modustidslinje er ikke avlest.
Native Meta Developer Tools bekrefter nå `live_mode` / `is_live=true` for
1154247890253046. `email` og `public_profile` har Advanced Access i avlest respons.
Live-modus åpner godkjente funksjoner for brukere uten app-rolle, men gir ikke
alle API-tilganger automatisk. Metas CAPI-dokumentasjon sier at oppsett med egen
app/systembruker ikke krever App Review. Ingen slutning om at publiseringen alene
forklarer de historiske HTTP 400-feilene er underbygget.

Kilder: [App Modes](https://developers.facebook.com/docs/development/build-and-test/app-modes/),
[CAPI Get Started](https://developers.facebook.com/documentation/ads-commerce/conversions-api/get-started).

## Ny nettleserobservasjon

Den vanlige produksjonsreisen ga HTTP 202 fra kanoniske samlere og fem Meta
serverkvitteringer. Pixel-skriptet `/analytics/meta-pixel-canonical-v1.js` lastet
med HTTP 200, men ingen Facebook-nettverksforespørsler eller fbevents-scriptnode
ble observert i denne nettleserøkten. Årsaken er ikke fastslått. Dette er en separat
åpen verifikasjon og ikke bevis for at alle besøkende mangler Pixel.

## Kontrollert kjøpsgjenlevering

Brukeren godkjente særskilt gjenlevering av ett faktisk kjøp på NOK944 fra
13. oktober kl.18:47. Betalt, ikke kansellert/refundert Shopify-ordre er avstemt
mot nøyaktig kanonisk transaksjon. Kl.01:02:36UTC14. oktober svarte Meta HTTP200,
events_received=2 uten meldinger: Purchase + eksisterende kvalifisert
AppendClickAttribution. Faktisk wirepayload er kontrollert uten å lagre identifikatorer:
Purchase har original ID/tid, NOK944, website-kilde, URL, em/ph/ct/zp/country,
external_id, IP/UA, fbc/fbp og produkt-/verdi-/profitfelt. Append peker til det
opprinnelige kjøpet. Original kanonisk payload og idempotensnøkkel er uendret.
Native Supabase-avlesning bekrefter accepted_unverified, én ledger-oppføring og
null uløste dead letters for dette forsøket. Ingen ny ordre, betaling eller jobb.
Endelig attribusjon/deduplisering er fortsatt ikke verifisert.

## Avklart testpåvirkning fra nettleserutvidelse

Pixel Helper Pro erstattet fbq før Utekos-skriptet; appens status var initialized=true,
scriptStatus=idle og fbq.callMethod manglet. Kilden ble avlest som utvidelsens
content.js. Brukeren slettet utvidelsen. Etter nyinnlasting lastet fbevents.js og
Pixel-konfigurasjonen med HTTP200; helperPatched=false, scriptStatus=loaded,
fbq.callMethod er funksjon og SDK eventCount=2. Faktiske Pixel-beacons og
nettleser/server-ID-paritet undersøkes fortsatt.

## Gjenstående avhengigheter ved kontrollpunktet

- Nettleserens faktiske Meta-beacon blokkeres med ERR_BLOCKED_BY_CLIENT.
  Fersk kontroll viser PageView GET/Image200 med samme ID som serverforsøket
  (HTTP200/eventsReceived1). ViewCart/RemoveFromCart POST/Document blokkeres
  fortsatt med blockedReason=inspector. Brukeren kjenner ikke årsaken; ingen
  bestemt utvidelse er identifisert. Endelig deduplisering er ikke avlest.
- Shopify produksjonsversjon2026-09-30-checkout-purchase-v4 er bekreftet aktiv
  gjennom produksjons-CLI. Brukeren bekrefter Update utført; administrasjonen
  åpner uten tilgangsforespørsel. Checkoutens leverte konfigurasjon bekrefter
  korrekt endpoint_url=https://utekos.no/api/shopify/checkout-observations.
  Next Meta er faktisk tilkoblet, kodeversjon15, og sender bare Purchase med
  samme deterministiske ID-algoritme som backend. Tidligere påstand om frakobling
  er korrigert. App-pikselen sender observasjoner, mens Next Meta sender
  Meta-browser-Purchase; katalogens eierskapspåstand må avstemmes. Ingen eier endret.
- Etter den godkjente kjøpsgjenleveringen står1809andre forsøk i kildeperioden
  fortsatt dead_lettered. De er innen48timer ved siste avlesning og har granted
  operator-policy, men full payload-/eierskapskontroll og særskilt replay-omfang
  gjenstår. Ingen masse-replay er utført eller godkjent.
- Stape outgoing-log-aggregat ble avvist med HTTP409 Conflict. Incoming
  client-analytics er tilgjengelig, men dokumenterer ikke Meta-mottak eller
  senderen bak Meta-statistikken.

## Lesende kontroll av resterende historikk

Kl.01:20:35UTC bestod alle1809gjenværende Meta-deadletters både gjeldende schema
og SDK-mapping i en lesende kontroll mot deres faktiske kanoniske payloads.
Alle er server_retry, granted operator-policy, under48timer, har samme ID/tid
på primærhendelsen, website/URL/UA og appsecret_proof. Nettverkstransporten ble
erstattet med en prosessintern respons; null Meta-kall og null databasemutasjoner.
Dette er payload-/mapping-kontroll, ikke leverings-, dedupe- eller attribusjonsbevis.

Native Shopify-avlesning bekrefter at kildeperiodens ene ordre er et faktisk,
ikke-test PAID-kjøp fra Headless. processedAt16:47:17UTC matcher kanonisk Purchase.
Dette er en nettbutikk-/headless-kilde; fraværet av checkout-observasjoner må
undersøkes videre. Ingen konklusjon om årsak er fastslått.

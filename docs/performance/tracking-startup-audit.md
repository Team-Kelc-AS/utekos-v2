# Trackingoppstart — 12. oktober 2026

Undersøkelse av produksjon på `utekos.no`, lokal kildekode og publisert GTM/Stape-
konfigurasjon. Ingen trackingkode, samtykkepolicy eller providerinnstillinger er
endret. Tidligere lokale poster- og fontendringer er ikke deployet.

Etter denne undersøkelsen er punkt 1 implementert lokalt etter brukerens
bestilling. Se [cachefiks og verifikasjon](google-tag-cache.md). Selve auditen
nedenfor beskriver produksjonstilstanden før rettingen.

Tidlig GA-identitet og Safari-cache er deretter rettet lokalt etter ny bestilling.
Se [Stape-oppstart og verifikasjon](stape-readiness.md). De separate web-GTM-
og Google-tag-avhengighetene er beholdt.

## Konklusjon

Tracking dominerer JavaScript-leveringen. Første forbedring bør være en snever
retting av **nettlesercache for Google-taggen**, etterfulgt av vurdering av
Clarity-integrasjonen og Googles automatiske måling. En generell overgang til
`lazyOnload` er ikke en trygg førstefiks: eksisterende hendelser avhenger av
tidlig GA-identitet, Meta-identitet og Cookie Keeper.

## Bekreftede størrelser

| Ressurs | Tidligere Lighthouse, overført | Ny kald Chromium-måling, overført | Ny måling, ukomprimert |
| --- | ---: | ---: | ---: |
| Google-tag via `/__sgtm/fps/...` | 207 383 B | 208 449 B | 630 195 B |
| Meta `signals/config/1092362672918571` | 165 541 B | 166 877 B | 593 101 B |
| Stape/web-GTM `apgqnrnczg.js` | 149 862 B | 150 484 B | 468 242 B |
| Meta `fbevents.js` | 114 128 B | 117 017 B | 433 365 B |
| **Sum fire filer** | **636 914 B / 622,0 KiB** | **642 827 B / 627,8 KiB** | **2 124 903 B** |

Hele forsiden overførte 1 057 976 B JavaScript i den nye kalde målingen;
de fire filene utgjorde 60,8 %. Ny måling er et instrumentert, lokalt kjørt
Chromium-besøk med mobil viewport 390 × 844, uten mobil CPU-/nettverkssimulering.
Tallene er ikke en ny Lighthouse-score eller feltmåling. En ekstra kald
måling bekreftet samme ressurskjede og omtrent samme størrelser.

## Oppstart og eierskap

1. `StapeScripts.tsx` legger samtykkedefaults i `dataLayer` med
   `beforeInteractive`. Alle fire Google-samtykketyper settes til `granted`.
   Dette er den eksisterende `operator_policy`, ikke en registrert brukerhandling.
2. Stapes genererte loader kjøres `afterInteractive` og starter web-GTM
   `GTM-5TWMJQFP`. Publisert versjon **175** er kontrollert gjennom API og
   gjennom den faktisk lastede JavaScript-ressursen.
3. Web-GTM starter Google-taggen `GT-MKRLF5WK` ved Initialization.
   `send_page_view=false`. Appens kanoniske hendelser går gjennom Data Tag 182
   og `stapecdn.com/dtag/v9.js` til sGTM. Server-GTM `GTM-M8GT97CV`, versjon
   **44**, har én aktiv GA4-tag. `view_item`/`purchase` er unntatt Data Tag-
   triggeren og følger eksisterende app/backend-eierskap.
4. Appens `/analytics/meta-pixel-canonical-v1.js` kjøres parallelt
   `afterInteractive` → `fbevents.js` → pixelkonfigurasjonen.
   `autoConfig=false` og `disablePushState=true` er allerede satt. Appen
   leverer `eventID` fra den kanoniske hendelsen og dedupliserer egne dispatches.
5. Web-GTM starter UET `97247724` → `bat.js` → tagkonfigurasjon →
   Clarity-loader → `clarity.js`. Clarity kommer dermed i tillegg til de fire
   tunge filene, uten en egen aktiv Clarity-tag i GTM.

I første kalde måling startet web-GTM etter 520 ms, Meta etter 541 ms,
pixelkonfigurasjonen etter 809 ms, Google-taggen etter 842 ms og Clarity
etter 1118 ms. Dette er observerte navigasjonstider, ikke faste frister.

**Ingen dobbel tung GTM-container er påvist.** De to Stape-adressene leverer
henholdsvis web-GTM og Google-taggen. Et ekstra kall til
`www.googletagmanager.com/gtm.js` leverte bare en 216 B hjelpesnutt.
De ti pausede GTM-taggene er kompilert som `__paused`; gamle Meta-skript er
ikke innebygd som aktive kopier. Å slette rollback-taggene forklarer derfor
ikke en mulig besparelse på 622 KiB.

Stape API bekrefter Custom Loader og Cookie Keeper aktivert, Request Delay
deaktivert. GTM Meta- og Cookiebot-tagger er fortsatt pauset. Kildekoden
resolver autorisasjon direkte til `operator_policy`. Policyen er ikke endret
som del av denne ytelsesundersøkelsen.

## Prioriterte funn og neste tiltak

### 1. Gatewayen opphever privat nettlesercache

Direkte GET av den observerte Google-JavaScript-ressursen fra Stape svarte
`Cache-Control: private, max-age=900`. Samme ressurs via butikken svarte
`no-store, max-age=0`, også med `CDN-Cache-Control: no-store`.
Ingen av disse to kontrollerte svarene satte cookies.

Årsaken er den ubetingede overskrivingen i
`src/lib/analytics/serverGtmGateway/buildServerGtmResponseHeaders.ts`.
Ved varm reload ble Stape/web-GTM og begge Meta-filer gjenbrukt, mens Google-
taggen igjen overførte **208 341 B**. De to senere fullstendige sidelastingene
overførte også omtrent 208 kB for samme Google-tag. Dette gjelder ny
dokumentlasting; App Router-navigasjon uten ny dokumentlasting måles separat.

**Anbefalt første implementering:** Behold upstreams tidsbegrensede private
nettlesercache bare for eksplisitt identifiserte, vellykkede GET/HEAD-svar med
Google-JavaScript. Behold CDN `no-store` og `no-store` for eventtransport,
feil, cookie-restaurering og ukjente svar. Ikke gjør hele `/__sgtm` offentlig
cachebar. Kontroller Set-Cookie, Vary, cookiepersonalisering og Stapes
versjonsoppdatering før endelig regel vedtas.

Forventet gevinst er omtrent 203 KiB mindre overføring ved gjentatt
dokumentlasting mens privat cache er gyldig. Dette reduserer ikke størrelsen
ved første besøk eller arbeidet med å kjøre JavaScript på nytt.
[HTTP-cachens skille mellom privat cache og no-store](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control).

### 2. Clarity er en skjult tilleggskostnad via UET

`clarity.js` overførte 25 560 B. Med Clarity-loaderen var kostnaden 26 946 B
i den første kalde målingen. Den tidligere mobile Lighthouse-kjøringen
tilskrev `clarity.js` 127,4 ms scripting + 4,0 ms parsing/kompilering.
Dette er en betydelig CPU-kandidat selv om nettverksfilen er mindre.

**Neste avklaring:** Brukes Clarity-opptak/heatmaps eller Clarity-baserte
konverteringsmål? Hvis ikke, kan Clarity kobles fra i Microsoft Advertising
uten å fjerne UET. Microsoft dokumenterer innstillingen under
[UET-integrasjon](https://learn.microsoft.com/en-us/clarity/faq#uet-integration).
Dette er en providerendring som ikke er utført. Ingen gevinst i mobil LCP
eller faktisk konverteringsdekning er målt for en slik endring.

### 3. Utsettelse må bevare identitet og tidlige hendelser

Appens GA-ID-berikelse bruker `gtag('get', ...)` med **500 ms** timeout.
Første `page_view` manglet både `ga_client_id` og `ga_session_id` i begge
kalde Chromium-kontrollene og i TechDown-navigasjonen; senere hendelser hadde
dem. Varm forside og Camping hadde dem i målingen. GTM-variablene for ID-er
leser den kanoniske envelope; de leser ikke en senere korrigert envelope.
Dette er et observert datakvalitetssignal, ikke bevis for tapt GA-konvertering.
Data Tag kan ha egen berikelse; providerens faktiske mottak er ikke verifisert.

Meta-bridge har allerede tidlig CustomEvent-lytting, kø/skanning og en løpende
200 ms poller. Safari/Meta-klikk kan vente opptil tre sekunder på `_fbc`, med
flush på `pagehide`. En blind `lazyOnload`-endring kan forskyve identitet,
tidlige hendelser og korte besøk. Den sparer heller ikke filenes byte når de
til slutt lastes. Next.js anbefaler `afterInteractive` for tag managers og
analytics; `worker` støttes ikke i App Router.
[Next.js Script](https://nextjs.org/docs/app/api-reference/components/script),
[Google get/callback](https://developers.google.com/tag-platform/gtagjs/reference#get).

**Før eventuell utsettelse:** verifiser en liten tidlig hendelseskø og en
eksplisitt readiness-grense, med originale `event_id`, `event_time`,
`page_view_id`, kampanje-ID-er og de eksisterende berikelsesfrister.
Kjøps-/lead-hendelser må ikke skapes ved sideoppstart. Test rask navigasjon,
lukking, sakte/blokkert SDK, Safari Cookie Keeper og én browser/server-
hendelse med samme ID. Naturlig Purchase forblir egen verifikasjon.

### 4. Google-taggen har mer automatikk enn den kanoniske transporten

Den nedlastede Google-taggen har aktive konfigurasjoner for scroll, outbound
click, download, history, form og video; også Google Ads-destinasjon og Google
Signals finnes i ressursen. `send_page_view=false` alene fjerner ikke disse
modulene. Dette dokumenterer lastet konfigurasjon, ikke at alle hendelser har
fyrt eller at dupliserte konverteringer er påvist.

**Neste tiltak etter cache:** Kartlegg hvilke automatiske målinger og
destinasjoner som faktisk brukes, og vurder å slå av ubrukt automatikk hos
Google. Mål ny ressurs og CPU etterpå; det er ikke dokumentert at hele
207–208 kB kan fjernes. Meta-filene er vendorstyrte og skal heller ikke
trimmes manuelt. `autoConfig=false` er allerede brukt.

## Verifikasjon og begrensninger

- Produksjonsnettverk og initiatorstakker: kald og varm forside, TechDown,
  Camping, ekstra kald forside; fersk WebKit-forside kontrollerte også samme
  aktive Google-containere og oppstart med `operator_policy`.
- Kun første forside i den første Chromium-konteksten er kald. TechDown og
  Camping deler cache med den forutgående forsiden.
- Ett kanonisk `page_view`-innslag per dokument ble observert. Meta-bridge
  registrerte én PageView-dispatch på forsiden. Dette er ikke kvittering fra
  Meta, dedupliseringsbevis eller attribusjonsbevis.
- Samtykke-/GTM-API er lest tilbake, uten lagring, publisering eller pause.
- Collector og Meta client-IP svarte HTTP 204 med
  `x-utekos-traffic-classification: automated_bot` i bekreftelsesmålingen.
  Dette dokumenterer filtrering av automatiseringen, ikke en feil ved
  menneskelige kjøp eller kvittering fra provider. Lokal klient aksepterer
  bare 200/202 og logget feil for disse svarene; ingen endring i botfiltrering
  er gjort. GA-ID-observasjonene må også etterprøves i vanlig nettleser før
  det konkluderes om attribusjonen til reelle besøk.
- GoogleDev Knowledge MCP krevde ny autentisering. Offisielle Google-sider
  ble brukt som fallback; Context7, installerte Next 16.3.8-dokumenter,
  Microsoft Learn MCP og Utekos Docs ble også konsultert.
- Ingen kodeendring betyr at nytt produksjonsbygg eller kjøpsregresjon ikke
  er kjørt for denne undersøkelsen. Ingen LCP-/CrUX-forbedring er påstått.

Råbevis, scriptsvar og profiler ligger i `/tmp/utekos-tracking-startup/`.
En kompakt provider-/målesammenstilling følger i `tracking-startup-evidence.json`.

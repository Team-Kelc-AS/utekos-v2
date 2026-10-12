# Stape og tidlig Google-identitet

Kontroll og lokal retting 12. oktober 2026. Ikke deployet; ingen GTM-versjon
eller Stape-innstilling er endret.

## Funn og retting

Stape-webloaderen og Google-taggen er ulike avhengigheter. Publisert web-GTM
175 har én aktiv Google-basistagg, `GT-MKRLF5WK`, med `send_page_view=false`,
og én Data Tag. Server-GTM 44 har én aktiv GA4-tag. Å fjerne Google-taggen
ville også fjerne den dokumenterte `gtag('get')`-kilden til klient- og
sesjons-ID. Ingen ekstra tung GTM-container er påvist.

Den konkrete identitetsfeilen var to 500 ms-frister: ID-hjelperen og runtime
kunne avslutte før Stape → web-GTM → Google-taggen hadde initialisert GA4.
Et tidlig `get` kan dessuten svare `undefined` før konfigurasjonen er klar.

Rettingen starter GA-oppslaget parallelt med Meta-berikelsen. Samtidige
hendelser deler ett pågående oppslag, med nye `get`-forsøk hvert 250 ms frem
til de faktiske ID-ene er tilgjengelige. Oppslaget avsluttes senest etter
5 sekunder eller på `pagehide`; hendelsen sendes da med tilgjengelig identitet.
Ingen GA-ID konstrueres, og senere hendelser kan prøve igjen. Samtykkekontrollen
beholdes. Komplette eksisterende GA-ID-er utløser ikke nye oppslag.

Meta-dispatchen venter fortsatt ikke på GA. Event-ID, event-tidspunkt og
Meta-ID-er beholdes når GA-ID-ene flettes inn i både collector og dataLayer.
Checkout beholder den tidligere totale identitetsrammen på 2 sekunder
(1,5 s Meta + 0,5 s Google), men lar nå Google bruke tiden Meta ikke trenger.
Bekreftelsen starter ikke en ny Google-venting. En blokkert Google-tag kan
derfor fortsatt gi checkout uten GA-ID, uten å holde kjøpsreisen i 5 sekunder.

## Safari-cache

WebKit med Cookie Keeper lastet Google-taggen fra `/__sgtm/gtag/js`, mens
Chromium brukte `/__sgtm/fps/<container>/<opaque-script>`. Den første cachefiksen
dekket bare sistnevnte. Direkte GET viste HTTP 200 og
`private, max-age=900` fra Stape, men `no-store, max-age=0` gjennom produksjonsgatewayen
også på `/gtag/js`. Ingen Set-Cookie på dette Google-skriptsvaret.

Gatewayens snevre cache-unntak omfatter nå begge Google-skriptstiene.
Cookie Keeper-skriptet `/apkpgqnrnczg.js`, hendelser, ukjente stier, feil,
cookie-svar og all server-/CDN-cache forblir `no-store`.
Se [cacheavgrensningen](google-tag-cache.md).

## Stape-readback og nettleserbevis

Native Stape MCP bekreftet container `gqnrnczg` Running, domene
`edge.utekos.no` Ready, ingen varsler, Custom Loader og Cookie Keeper aktivert,
enhanced protection aktivert i kodeinnstillingene og Request Delay deaktivert.
GA-cookies inngår i Cookie Keeper. Generert loader samsvarer byte for byte
med Stapes nåværende snippet: 1 377 bytes, SHA-256
`36b5d2c49a90978e4f510de60225d7ffcfbc857e49e5ff740ad0559e87653450`.

En kontrollert Chromium/WebKit-fixture brukte faktisk app-runtime, uendret
loader og publiserte Stape/Google/Data Tag-skript. Synthetic master-cookie
ble satt før loaderen. Collector- og providerutsendelser ble fanget lokalt;
ingen konvertering eller testordre ble sendt til providerne.

Begge nettlesere produserte én første canonical sidevisning med GA-klient-ID
og sesjons-ID. Data Tag-payloaden beholdt nøyaktig samme klient-ID, sesjons-ID,
event-ID og event-tidspunkt som appen. Chromium brukte Stapes maskerte
`/__sgtm/apgqnrnczg`-transport; WebKit brukte `/__sgtm/data` og Cookie Keeper-loaderen.
Dette verifiserer payload og oppstart, ikke endelig provider-mottak eller
langtidsrestaurering etter Safari ITP-utløp.

Sanitert bevis: [stape-readiness-evidence.json](stape-readiness-evidence.json).
Fixture-kode og øvrige råbevis: `/tmp/utekos-stape-readiness/`.

## Verifikasjon og gjenværende grense

- Chromium/WebKit: første side-/produktvisning med 1 250 ms Google-oppstart,
  uendret tidlig Meta-signal, delte oppslag, stoppede retry-timere og `pagehide`.
- Blokkert Google: endelig timeout og fortsatt levering uten oppdiktede ID-er.
- Checkout: både forsinkede ID-er og blokkert tag innen eksisterende tidsramme.
- Enhetstester: nektet analytics, komplette eksisterende ID-er, delvis svar og feil.
- Gateway: GET/HEAD og alle negative cachetilfeller mot begge skriptstier.
- Lokal cache-fixture: begge nettlesere laster `/gtag/js` én gang gjennom reload;
  gammel `no-store`-regel og Set-Cookie gir to upstream-kall.
- Fokusert ESLint, kontrakthasher, gatewaytester og produksjonsbygg bestått.

Den brede `pnpm run test:tracking`-kommandoen stopper på en separat eksisterende
Dun-test som krever teksten «uke 43» i reservasjonsmeldingen. Denne teksten
er allerede fjernet i arbeidskopiens reservasjonsendring; den ble ikke endret
som del av Stape-arbeidet. Trackingens fokuserte kontroller er kjørt separat.

Etter deploy må første og varm sidelasting kontrolleres mot produksjonsaliaset.
Faktisk provider-mottak, attribusjon og Safari-restaurering over tid er fortsatt
egne verifikasjonsgrenser; lokale payloadtester beviser ikke disse resultatene.

Kilder: installert Next.js 16.3.8 `script.md` (tag managers/analytics:
`afterInteractive`), native Stape/GTM MCP og Context7. Google-native dokument-MCP
krevde ny innlogging, så Google-referansene ble kontrollert på offisielle nettsider:
[Google get API](https://developers.google.com/tag-platform/gtagjs/reference#get),
[førsteparts skriptlevering](https://developers.google.com/tag-platform/tag-manager/server-side/dependency-serving?option=sgtm),
[Stape Custom Loader](https://stape.io/helpdesk/documentation/custom-loader-power-up),
[Stape Cookie Keeper](https://stape.io/helpdesk/documentation/cookie-keeper-power-up).

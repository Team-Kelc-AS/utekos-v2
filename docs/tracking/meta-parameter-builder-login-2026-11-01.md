# Implementasjonsnotat: Meta Parameter Builder og Klarna Login

Snapshot før godkjent utgivelse, 1. november 2026. Testtall og avvik beskriver opprinnelig arbeidskopi; utgivelsen verifiseres separat fra siste main. Arbeidet er lokalt i `utekos-v2` og `utekos-tracking-backend`. Ingen push, deploy, GTM-publisering, databaseendring eller utsending av ekte/test-hendelser til Meta er gjort.

## Gjeldende oppførsel

- Første PageView beholder opprinnelig ID og tidspunkt. Pixel og CAPI bruker samme hendelses-ID. Mulig fremtidig innlogging og bakgrunnsoppslag av profil holder ikke igjen PageView. Ingen automatisk reload eller replay av PageView etter innlogging. Vanlig ny dokumentnavigasjon beholder ordinær PageView-oppførsel.
- Profiloppslaget starter i bakgrunnen. Allerede tilgjengelig identitet kan følge første nettleserhendelse; backend gjenleser eksisterende validert sesjon. En profil som først blir tilgjengelig senere, fyller ikke inn eller sender tidligere PageView på nytt.
- Pixel bruker manuell Advanced Matching bare fra en allerede tilgjengelig profil ved initialisering. Ved identitetsendring tilbakekalles Pixel for resten av dokumentet, mens CAPI fortsetter. Neste naturlige dokumentinnlasting kan initialisere ny identitet. Det er ingen nettleser-Login.
- Klarna-callbacksiden starter ikke butikkens Pixel/runtime og teller dermed ikke en ekstra teknisk callback-side som PageView.
- Et gammelt profiloppslag får ikke legge tilbake foreldet identitet etter innlogging, utlogging eller endret kundematchingsvalg.

## Parameter Builder

Installerte versjoner er `meta-capi-param-builder-clientjs` 1.3.2 og `capi-param-builder-nodejs` 1.3.2. Det er ikke gjort en avhengighetsoppgradering. GitHub oppgir nyere klientversjon 1.3.3; API-et brukt her er kontrollert mot installert kildekode og oppdatert dokumentasjon.

Eksisterende klientinnsamling starter som del av tidlig hendelsesforberedelse. Den avventer én `processAndCollectAllParams()` per innsamlingsforløp og bruker returverdiene `_fbc`, `_fbp` og `_fbi`. Samtidige hendelser deler pågående innsamling. IP-oppslaget har 2500 ms grense og tom streng som feilreserve. Den native in-app-broen har ingen dokumentert SDK-tidsgrense; applikasjonen har en egen 5000 ms grense og pagehide-reserve. Etter denne grensen beholdes det samme pågående SDK-kallet, slik at det ikke startes overlappende innsamlinger eller sendes PageView på nytt ved et sent svar. Disse grensene gjelder Meta-kontekst, ikke venting på mulig Klarna-innlogging.

Serverens parameterkontekst oppretter `ParamBuilder` per request. Ny Login bygger en eksplisitt `PlainDataObject` fra brukerens side, cookieverdier, referrer, IP og protokoll/sti. API-adressen brukes ikke som `event_source_url`. Det tidligere delte PII-builder-objektet i ekstern-ID-mappingen er også fjernet.

## Servervalidert Login og varig levering

1. Storefront verifiserer Klarna-tokenet og eksisterende innloggingsstate før profil eller Login kan opprettes.
2. Serveren avleder en stabil UUID fra det validerte tokenet med SHA-256 og domeneskille. Tokenet sendes ikke til tracking-backend og logges ikke. Samme token ved gjentatte callbacks gir samme ID; en ny autentisering med et annet token får ny ID.
3. Innloggingstidspunktet registreres på serveren etter tokenvalidering. Brukersiden hentes fra signert/forseglet `returnTo`, ikke et fritt event-URL-felt fra nettleseren.
4. Den betrodde OIDC-broen sender handlingen `authenticated_login`, validert profil og tilgjengelig nettleserkontekst til backend. Eldre `login`-handling beholdes for kompatibilitet under en senere backend-først-utgivelse.
5. Backend lagrer profilen og avventer varig aksept av kanonisk `login`. Ledger og Meta-outboxpost skrives atomisk gjennom eksisterende canonical store. Det opprettes ingen Google-, Microsoft-, GTM- eller ekstra Meta-transport for Login.
6. Storefront setter innloggingssesjonen og returnerer suksess først når backend har bekreftet lagring og samme `login_event_id`. Manglende køkvittering gir 503 og ingen ny innloggingssesjon. Profilen kan allerede være lagret hvis køen svikter; gjentakelse bruker den samme ID-en.
7. Eksisterende køpublisering og registrert outbox-worker håndterer levering. Den eksisterende femminutters cron-jobben kan gjenfinne ventende jobb eller utløpt lease hvis publisering/behandling svikter. Brukeren trenger ikke utføre en ny handling. Det er ikke opprettet en ny bakgrunnsjobb eller endret en cron-plan.
8. Eksisterende Meta-policy gir inntil fem forsøk, med 1 minutt, 5 minutter, 30 minutter og 2 timer mellom forsøk, deretter dead letter. Nytt forsøk bruker den lagrede identiteten, URL-en, hendelses-ID-en og det opprinnelige tidspunktet.

En unik ledgernøkkel og unik `(provider, idempotency_key)` hindrer flere lokale hendelser/leveringsjobber for samme autentisering. Transporten har retry-semantikk; ved et tvetydig nettverksutfall kan Meta motta samme event på nytt med samme `Login`/`event_id`. Metas faktiske deduplisering er ikke verifisert i denne lokale kontrollen.

## Identitet og samtykke

Tilgjengelig e-post, telefon, fornavn, etternavn, by, postnummer og land behandles med henholdsvis `EMAIL`, `PHONE`, `FIRST_NAME`, `LAST_NAME`, `CITY`, `ZIP_CODE` og `COUNTRY`. Intern prospekt-ID bruker `EXTERNAL_ID`. Verdiene kommer fra servervalidert Klarna-profil, ikke uverifiserte nettleserfelt. Adressefelt faller tilbake enkeltvis fra faktura- til leveringsadresse. Manglende felt utelates.

Eksisterende separat `ad_matching`-valg og alders-/lagringstidsfilter er bevart. Ny profil har ikke automatisk gitt dette valget. Login kan derfor ha nettleserkontekst, men ingen kontaktidentitet hvis profilen ikke er kvalifisert. Ved avslått markedsføringssamtykke planlegges ingen Meta-levering. Den eksisterende globale samtykkekilden er `operator_policy`; denne oppgaven endrer ikke prosjektets samtykkepolicy eller aktiverer Cookiebot.

Parameter Builders beskyttede verdier og provenienssuffikser lagres og beholdes gjennom faktisk CAPI-serialisering. Ingen ny hashing av allerede beskyttede verdier, og ingen stripping av suffikser. Tilgjengelige `fbc`, `fbp`, IP og user agent følger Login. Eksakt klikkverdi og opprinnelig cookie-tid beholdes; SDK-et kan legge til sitt dokumenterte suffiks. Norsk `st` sendes ikke uten dokumentert mapping, verken via den oppdaterte Pixel-mappingen eller CAPI-mappingen. Kjønn utledes ikke.

## Kontroller

Alle nye innloggings- og nettleserflyter bruker syntetiske fixtures og avskjærer leverandørkall. De er ikke bevis på faktisk Klarna-autentisering eller mottak i Meta.

- Frontend: 18 fokuserte tester bestått for validerte/forfalskede/utløpte token, anonym profil, kjent profil, gammel profilrespons, køkvittering, stabil ID og keepalive.
- Backend: 52 fokuserte tester bestått for Parameter Builder/CAPI-serialisering, personfelt, utelatelse, samtykke, PageView, atomisk kø, idempotens og retry, samt eksisterende manifesttester.
- Chromium og WebKit: nye tester for tidlig PageView under tregt profiloppslag, ingen PageView-replay eller browser-Login, og umiddelbar lukking etter innloggingskvittering har bestått. Hele offline-suiten er kjørt: 96 av 96 tester bestått.
- Begge repoenes TypeScript-kontroller er bestått. Målrettet ESLint har ingen feil; den eksisterende ubrukte `_error`-variabelen i Pixel-filen gir én advarsel. 16 gatewaytester og 20 bridge-/cron-tester er bestått. 19 separate tester av Login og køpublisering, gjenfinning og nye leveringsforsøk er bestått. Den ekstra norske regiontesten er bestått. Regenerert backend-manifest har bestått generatorens `--check`. Begge `next build` er fullført med exitkode 0; storefront-bygget er kjørt på nytt etter siste kodeendring.
- Lesing av Supabase-katalogen bekrefter unike idempotensnøkler i `marketing.event_ledger` og `ops.provider_dispatch_attempts`, og ingen event-name-begrensning som krever migrering. Ingen produksjonsdata er skrevet som del av testen.
- GTM web live versjon 175: Meta-taggene 153/170 og Signals Gateway 171 er pauset. Server live versjon 45: én aktiv GA4-tagg, ingen Meta-servertagg. Dette er konfigurasjonsavlesning, ikke mottaksbevis.
- Den bredere `createCanonicalEventStore`-testen har ett eksisterende avvik: testen «marketing release requires the original page identity and a new marketing grant» forventer både true og false for like innganger. Uendret kilde/test i `HEAD` bekrefter at feilen ikke er introdusert av Login. Samtykkepolicyen er ikke endret for å få testen grønn.
- `tracking:contracts` melder seks eksisterende hashavvik utenfor denne endringens Pixel-fil: campaignAttributionSessionStore, checkoutAttributionSnapshot, sendCanonicalGTMEvent, reportClientCaughtError, clientErrorDataSchema og LogPayload. Disse kontrollsummene er ikke oppdatert uten en egen gjennomgang av endringene. Pixel-overstyringen er oppdatert med denne oppgavens begrunnelse og faktisk hash.

## Dokumentasjon og gjenværende bevis

- [Meta Parameter Builder, kilde og README](https://github.com/meta/capi-param-builder) og [offisiell bibliotekveiledning](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library). Direkte nettsideavlesning av Meta-veiledningen returnerte 429; oppdatert innhold ble lest gjennom Meta Developer Tools MCP og sammenholdt med installert bibliotek. Context7 ble brukt som støtte til kildeoppslaget.
- Ingen dokumentert og lokalt verifisert oppdatering av Pixel Advanced Matching etter innlogging er lagt til. Parameter Builder erstatter ikke Pixel Advanced Matching. Derfor er Login CAPI-only og eksisterende dokument-Pixel tilbakekalles ved identitetsendring.
- Zod Mini er vurdert og brukt for det nye kanoniske server-Login-skjemaet. Eksisterende servergrensers klassiske Zod og frontendens Mini-wrapper beholdes. InKeep/Zod-dokumentasjonen er kontrollert; det er ikke gjort en generell Zod-migrering.
- `FLOW.md` finnes ikke i disse checkoutene. Relevante AGENTS.md, installert Next.js-dokumentasjon, kildekode og leverandørdokumentasjon er brukt.
- Faktisk Klarna-innlogging, avbrutt identitetskontroll hos Klarna, produksjonskø/cron, Metas `events_received`, deduplisering, sanntidslevering og attribusjon er fortsatt uverifisert. Lokal durabilitetstest kjører den virkelige store-/workerlogikken med transaksjonsfixture og simulert leverandørsvikt; den skriver ikke i produksjonsdatabasen.
- Stape varsler at dagens MCP-adresse stenger 1. desember 2026 kl. 00:00 UTC. Ny adresse er `https://gtm-mcp.stape.io/mcp`, transport Streamable HTTP, med ny Google-innlogging. Connector-oppsettet er ikke endret.

Event Manager-teksten «No event parameters» alene viser ikke at kundematchingsfelt eller toppnivåfelt mangler. PageView har med hensikt ingen ordinær `custom_data`; IP, user agent, `fbc`/`fbp` og beskyttet identitet ligger andre steder i CAPI-payloaden. Faktiske enkelthendelser og mottaksbevis må kontrolleres etter en særskilt godkjent utgivelse, med backend før storefront.

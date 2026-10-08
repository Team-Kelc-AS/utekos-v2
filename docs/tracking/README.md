# Sporing: lokal implementasjon og produksjonssetting

Status 7. oktober 2026: sporingsmigreringen er implementert og testet lokalt i v2.
Separat backendkilde `Team-Kelc-AS/utekos-tracking-backend` er publisert via
`pnpm run sync` og deployet til `utekos-backend` på Vercel. Produksjonsrelease
`b9723ac08e7c65c26ae20df7c52e21df0932d597` er READY. HTTPS og `/healthz` er
verifisert mot samme SHA. Sporingsinngang og kanonisk køpublisering er deaktivert,
og backendprosjektet har ingen cron-planer. Eksisterende storefront og dets ni
cron-planer ligger fortsatt på produksjonscommiten `e74e6cd`.
Ingen provider- eller databaseendring og ingen betalt testordre er utført.
Miljøparitet, live autentisert bro, produksjonsmottak og faktisk deduplisering
må fortsatt verifiseres før aktivering. Se `backend-provisioning.json`,
`backend-runtime-verification.json` og `backend-project-readback.json`.

## Avklart topologi

**V2 skal overta dagens `Team-Kelc-AS/utekos-headless`-repository og eksisterende
Vercel-storefrontprosjekt. Det skal ikke opprettes et nytt v2-storefrontprosjekt.**

| Del | Mål / status |
|---|---|
| Storefront etter overtakelse | V2-koden i dagens headless-repo og Vercel-prosjekt |
| Eksisterende storefront/caller-prosjekt | `prj_MpZN3Z0PDp8rfwpdzAeplGe4Di0s` |
| Eier/team | `team_0B8gWWIxT2hGVIJnK8CwanAi` |
| Offentlige storefront-origins | `https://utekos.no`, `https://www.utekos.no` |
| Backend etter overtakelse | Separat headless-deploy på `https://backend.utekos.no` |
| Backendprosjekt | `utekos-backend`, `prj_EHFI28tMUlIQsNguxjcKHPlLAlFE`; opprettet og lest tilbake |
| Backend Git-/Root Directory-kobling | `Team-Kelc-AS/utekos-tracking-backend`, `main`, repo-root; verifisert og deployet |
| Backenddomene | `backend.utekos.no` registrert på backendprosjektet; CNAME hos one.com og Vercel DNS-konfigurasjon er verifisert |
| Stape | Eksisterende `https://edge.utekos.no`; v2s `/__sgtm` går direkte dit |
| Supabase | Eksisterende journal, utsendelser, kildebevis og idempotenslager beholdes |

En separat backend må ha varig kildeisolasjon. Hvis backend kobles til samme
repo-root og `main` som skal erstattes med v2, vil et senere storefront-push
ellers kunne erstatte backendkoden. Backendens repository/Root Directory og
automatiske deploy-kobling må derfor verifiseres før overtakelse. Et nytt
backend-domene på dagens storefront-deploy løser ikke dette alene.

Vercels prosjektspesifikke DNS-oppslag anbefaler CNAME
`backend` → `a7213bc5cd626e31.vercel-dns-016.com.` hos one.com.
Etter brukerens DNS-endring er korrekt CNAME bekreftet hos ns01.one.com og 1.1.1.1; Vercel rapporterer `misconfigured=false`. Backend er nå deployet; gyldig HTTPS og `/healthz` 200 med korrekt deploy-SHA er verifisert.
Prosjektet bruker Node `24.x`, funksjonsregion `arn1` og aktivert OIDC med
team-utsteder. Dagens storefront-prosjekt er ikke endret.

Backendkilden beholder provideradaptere, betalingsautoritet og refusjoner.
Cron, køforbruk og gjenforsøk eies fortsatt av dagens storefront fram til avstemt overtakelse. Prosjektbindingen til Vercel Cron/Queues og eventuelle
utestående meldinger må avstemmes når backend skilles ut. Én aktiv worker per
leveranse beholdes; v2 skal ikke få parallelle utsendelsesjobber.

## Hva som er implementert lokalt

- Kanoniske kontrakter og rene mappere er låst til
  `e74e6cd8310c88f2777cbfdf5ad6b431647d7f77`. Manifestet inneholder 117 filer;
  kontrollskriptet leser Git-objektet, aldri headless sin skitne arbeidsmappe.
- Ett utsatt klientlag samler PageView, produkt-/listevisning, produkt- og
  variantvalg, ønskeliste, bekreftede cart-mutasjoner, checkout, kampanjer,
  relevante innholdsinteraksjoner, skjemaobservasjoner og journey/drift.
  Produkt- og innholdssidene forblir serverkomponenter.
- Kanonisk hendelses-ID og tid bevares gjennom dataLayer, collectors og retries.
  Pixel bruker samme `eventID`; testen observerer ikke Metas interne Pixel-tid.
  Identitet, GA-ID-er og Meta Parameter Builder gjenbruker kildekontraktene.
  `granted` kommer eksplisitt fra `operator_policy`, versjon 1.
- Den autentiserte broen bruker Vercel OIDC med fast audience og eksplisitt
  tillatt operasjonsliste. V2 konstruerer besøkskontekst på serveren; backend
  kontrollerer signatur/issuer/team/prosjekt/miljø/origin og gjenbruker handlers.
- Shopify-webhooks og checkout-observasjoner har kompatibilitetsruter som
  bevarer rå bytes, HMAC/OIDC og nødvendige response-/cookie-/CORS-headere.
  Callback-kontinuitet er uavhengig av browser-sporingens av/på-bryter.
- Shopify-attribusjon skrives og avstemmes før checkout-handoff. Privat cart-
  nøkkel forblir på serveren. Klarna bruker den autentiserte backendbroen,
  uendret betalingslåsing og ingen automatisk betalingsretry.
- Kontakt får serverbekreftet `form_submit`. Dun-ventelisten bruker headless
  sin eksisterende lead-persistens og verdipolicy etter akseptert innsending;
  kun bekreftet kanonisk readback gir browser Lead-speiling. Telemetrifeil
  skal ikke gjenta den kommersielle innsendingen.
- Generated Stape Custom Loader og Meta Pixel-script er eksakte kildekopier.
  Cookie Keeper-masteren `user_id` bevares. Gatewayen strømmer svar, bevarer
  separate cookies, setter no-store og filtrerer interne headere/private
  storefront-cookies.
- Web Vitals, Vercel Analytics/Speed Insights og relevante feil/journey-data
  er koblet inn med redigerte URL-er. V2s kopierte backend-cron/køkonfigurasjon
  er fjernet. Ingen nye databasejobber eller Supabase-migreringer er innført.
  Den ene kopierte `supabase/functions/_shared/operational-route.ts` er en
  kontraktavhengighet, ikke en ny deploybar databasejobb.

Se [hendelsesmatrisen](migration-matrix.md) for alle 35 kataloghendelser,
utløsere, identifikatorer og faktisk leverandørfordeling. Katalogdefinisjoner
uten aktiv v2-kilde oppretter ingen oppdiktede hendelser. `orders/paid` er
fortsatt Purchase-eier; bekreftelsesside, Klarna callback og
`checkout_completed` skal ikke produsere konkurrerende kjøp.

## Konfigurasjon før godkjent release

| Hvor | Navn / verdi | Kontroll |
|---|---|---|
| Storefront | `NEXT_PUBLIC_TRACKING_ENABLED=true` | Eksplisitt opt-in; må bygges inn først når produksjonssetting er godkjent |
| Storefront | `NEXT_PUBLIC_VERCEL_ENV=production` | Browsergrenen krever nøyaktig denne verdien |
| Begge servere | `VERCEL_ENV=production` | Vercel-runtime; lokalt production-build er ikke tilstrekkelig |
| Begge servere | `VERCEL_GIT_COMMIT_SHA` | Korrelasjon av konkret storefront-/backend-SHA |
| Storefront, Klarna | `KLARNA_HEADLESS_ORIGIN=https://backend.utekos.no` | Dette er også kodens standard; må ikke peke tilbake på `utekos.no` |
| Storefront, Klarna-knapper | `NEXT_PUBLIC_KLARNA_CLIENT_ID` og valgfri `NEXT_PUBLIC_KLARNA_ENVIRONMENT` (standard `production`) | Offentlig klient-ID til SDK-et, også for lokal visning. `/api/klarna/client-config` leser disse lokalt og krever ikke tilgang til betalingsbackend. Ordreopprettelse beholder produksjons- og OIDC-kontrollene. |
| Backend | `STOREFRONT_TRACKING_VERCEL_PROJECT_IDS=prj_MpZN3Z0PDp8rfwpdzAeplGe4Di0s` | Tillat dagens prosjekt som skal bli v2-storefront |
| Backend | `STOREFRONT_TRACKING_VERCEL_OWNER_ID=team_0B8gWWIxT2hGVIJnK8CwanAi` | Eksakt teameier |
| Backend | `STOREFRONT_TRACKING_VERCEL_ISSUER` | Eksakt utsteder må leses fra faktisk Vercel OIDC-konfigurasjon; ingen gjettet team-slug |
| Backend | `STOREFRONT_TRACKING_PUBLIC_ORIGINS=https://utekos.no,https://www.utekos.no` | Eksakte origins; ingen wildcard |
| OIDC audience / URL i begge kodebaser | `https://backend.utekos.no/api/integrations/storefront-tracking/v1` | Verdien må være identisk i token og backendkontroll |
| Storefront, Facebook-session | Eksisterende `FACEBOOK_LOGIN_ENABLED`, `FACEBOOK_LOGIN_APP_ID`, `FACEBOOK_LOGIN_APP_SECRET`, `FACEBOOK_LOGIN_IDENTITY_KEY` | Verifisert server-session oversettes til numerisk Facebook-ID; token/cookie sendes ikke til provider |
| Backend | Eksisterende Shopify-, Klarna-, Supabase- og providerhemmeligheter | Inventer navn og nødvendig scope; hemmelighetene kopieres ikke til browser eller dokumentasjon |

Sporing er sperret for local/preview og andre verter, også når en
produksjonsartefakt åpnes via et Vercel deployment-alias. Å slå av
`NEXT_PUBLIC_TRACKING_ENABLED` krever nytt build for browserkode. Denne bryteren
er ikke en stoppknapp for betalings-/webhook-kompatibilitet eller allerede
lagrede backendutsendelser.

De eksisterende containerne/kontoene videreføres: web-GTM `GTM-5TWMJQFP`,
server-GTM `GTM-M8GT97CV`, Stape `gqnrnczg` og appens Meta Pixel
`1092362672918571`. Publisert versjon, Power Up-innhold og faktisk kjøring må
leses tilbake ved release; lokal kildekode beviser ikke dagens providerstate.

## Teststatus og reproduserbare kontroller

Dette er sluttkontrollene for det lokale endringssettet 7. oktober 2026.
Nye kode- eller konfigurasjonsendringer krever relevante nye kontroller.

| Kontroll | Senest rapporterte resultat | Bevisgrense |
|---|---|---|
| Vendor-kontrakter | 117 filer matcher låst Git-commit og selvstendig CI-manifestkontroll | Eksakt kildeparitet, ikke provideraksept |
| V2 produksjonsbygg og TypeScript | Bestått, også bygg med produksjonsflagg | Lokalt bygg og typekontroll; ingen deploy |
| V2 lint | Ingen feil; fem advarsler i låst kildekode | Advarslene er ikke skjult ved bred omformatering |
| `pnpm test:tracking` | 121 bestått: 110 CJS + 11 gatewaytester | Inkluderer eksisterende commerce-tester; fixture-/kontraktsbevis uten providerutsending |
| Chromium-fixtures, inkludert i de 110 CJS-testene | 10/10 bestått | Reell runtime/observer/Pixel-kode; nettverk interceptes, provider-script mottar bare lokal stub |
| Backendbro/lead/Klarna | 20 fokuserte tester bestått fra låst produksjonsarkiv + 17 eksplisitte overlayfiler | Falske butikker/stores/tokens; ingen betaling eller providerutsending |
| Backend typegenerering/TypeScript | Bestått mot rent produksjonsuttrekk + de 17 eksplisitte overlayfilene | Eksisterende lokale dependencies ble brukt; dette er ikke backendens komplette produksjonsbygg eller en deploy |
| Bevarte kjøp/refusjon/outbox-mappere | 42 tester bestått i produksjonsuttrekket | Gamle relative teststier i to filer ble rettet kun i testuttrekket; ingen handler-/providerlogikk ble endret |
| Safari, live GTM/Stape, mottakerdeduplisering, kommersielt kjøp/refusjon | `unverified` | Krever separat korrelert verifikasjon |

Chromium-fixtures dekker Pixel/collector-ID og tiden i det kanoniske browser-
signalet og collector, hydration-dedupe,
kontinuerlig listesynlighet, forsinket variant-RSC, cart-replay, navigasjon,
tilbakeknapp/reload, lenkevalg, tidlig handlingskø, preview-isolasjon,
samme-path-paginering, maksimal journey-scroll og livssyklushåndtering ved
syntetisk `pageshow` med `persisted=true`.
Dette er ikke en full Next/Shopify/Klarna-produksjonsreise og beviser ikke
faktisk opptak i Safari/Chromium BFCache eller provider-mottak. Sluttlogg for
v2-testene er `/tmp/utekos-tracking-tests-final.log` i denne arbeidsøkten;
arkiver beviset sammen med releasegrunnlaget før den midlertidige filen fjernes.

Kjør med prosjektets verifiserte Node/pnpm-versjoner (økten brukte Node 24.17.0
og pnpm 11.15.1). Les testresultatet, ikke bare prosessens startstatus:

```sh
python3 scripts/tracking/vendor-contracts.py
pnpm tracking:contracts
pnpm test:tracking
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

`tracking:contracts` kontrollerer innhold mot det innsjekkede manifestet uten
søskenrepo. Den første Python-kommandoen kontrollerer også låst Git-kilde i
headless. Browserfixture bruker prosjektets egne direkte devDependencies,
Playwright 1.61.0 og esbuild 0.27.7; fallback til søskenrepo er fjernet.
Chromium må være installert for Playwright i det aktuelle lokale/CI-miljøet.
Backendens server-only-tester kjøres fra backend med
`NODE_OPTIONS=--conditions=react-server` og de fokuserte testfilene under
`tests/unit/lib/integrations/storefrontTracking/`. Hele backendens eldre
arbeidsmappe har egne uavklarte TypeScript-/slettingsforhold; den er ikke
dokumentert som grønn av disse fokuserte testene.

[Verifikasjonsrapporten](verification.json) angir kommandoer, avgrensninger og
de midlertidige tilpasningene av gamle teststier. Backend-uttrekket er et
lokalt testartefakt, ikke en worktree eller en publisert backend. Fullt
backendbygg med låst dependencyinstallasjon og riktige deploymiljøer gjenstår
før produksjonsgodkjenning. Ingen eksisterende slettinger ble gjenopprettet.

## Filoversikt for releasegjennomgang

Dette er en **gjennomgangsliste**, ikke en ferdig stagingliste. Begge mapper
hadde lokale endringer før oppgaven. Mange v2-filer var allerede untracked;
Git-status alene kan derfor ikke identifisere hvem som laget innholdet.

| Område | Konkrete filer / avgrensning |
|---|---|
| Låste kildekopier | Eksakt liste i `contract-manifest.json` og `gateway-source-manifest.json`; kontroller hash før release |
| Ny v2-runtime/bro | `src/lib/tracking/`, `src/proxy.ts`, `src/app/%5F_sgtm/[[...path]]/route.ts` |
| Relative collectors/callbacks | `src/app/api/events/[...path]/route.ts`, `api/meta/[...path]`, `api/observability/[...path]`, `api/log`, Shopify checkout-/webhook-/internal-kompatibilitetsruter |
| Commerce/checkout | Relevante endringer i `src/lib/cart/`, `src/lib/klarna/`, `src/app/api/cart/`, `src/app/api/klarna/`, Shopify queries/types/mappere |
| UI-koblinger | Rotlayout; markører i ProductCard/VariantCard/SelectedProduct/CategoryPage/ProductOverview/Hero/HomeProducts; VariantOptions/WishlistButton; kontakt-/ventelistehandlinger og formularer |
| Konfigurasjon | `package.json`, `pnpm-lock.yaml`, relevante `tsconfig.json`-endringer og `vercel.ts`; behold øvrige eksisterende endringer bare etter egen gjennomgang |
| Tester/dokumentasjon | `scripts/tracking/vendor-contracts.py`, sporings-/cart-/checkout-/Klarna-testene og `docs/tracking/` |
| Ny backendbro | `src/app/api/integrations/storefront-tracking/v1/route.ts`, `src/lib/integrations/storefrontTracking/`, tilhørende `tests/unit/lib/integrations/storefrontTracking/` |
| Backendtilpasninger | Eksakt SHA-256-liste i `backend-release-manifest.json`: 17 overlayfiler (10 nye, 7 endrede) over låst produksjonscommit; gjennomgå hver endret hunk mot denne commiten |

Backend hadde fortsatt **780 slettede sporede filer** ved siste read-only
statuskontroll. De må ikke følge en `sync` ved et uhell. Ikke reset, stash eller
gjenopprett dem som del av staging. Avstem brukerens eksisterende arbeid og
den konkrete release-diffen først. Arbeid på `main`; ingen ny worktree.
Det lokalt kontrollerte backendarkivet er sammensatt av produksjonscommiten
og bare manifestets 17 filer; arkivet er ikke en deployment og inkluderer
ikke arbeidsmappens uvedkommende endringer eller slettinger.

## Produksjonsrunbook

1. **Frys det konkrete releasegrunnlaget.** Registrer begge lokale HEAD-er,
   full gjennomgått diff, kontraktmanifest, testresultat og rollback-deploy.
   Hold kildecommiten adskilt fra senere lokale backendtilpasninger. Avstem
   alle preexisting endringer og 780 slettinger før staging.
2. **Etabler separat backend først.** Verifiser backendprosjekt, kildeisolasjon,
   eksisterende provider-/databasekonfigurasjon, OIDC, callback-verifikatorer,
   cron-/queue-eier og utestående utsendelser. Knytt `backend.utekos.no` til
   den verifiserte backend-deployen. Gamle storefronten skal fortsatt fungere.
3. **Verifiser bro og kompatibilitet.** Gyldig prosjekt/team/issuer/audience/
   miljø/origin må godtas; manipulerte påstander må avvises. Kontroller ekte
   besøks-IP/UA/geografi, rå webhook-HMAC, original plattformapp-OIDC,
   separate cookies, CORS og korrelert request-ID + begge deploy-SHA-er.
   Kontroller Klarna-broen uten å gjenta usikker betaling.
4. **Forbered overtakelsen av eksisterende storefront.** Gjennomgå hvordan
   v2-filer innføres i dagens repo/prosjekt, verifiser miljøvariablene og at
   backendkjøringen nå ligger separat. Ikke opprett et nytt v2-prosjekt.
   Kjør sluttkontrollene på det faktiske endringssettet.
5. **Publiser først etter konkret godkjenning.** Tillatt workflow er
   `pnpm run sync` slik `package.json` definerer den. Dagens headless-script
   gjør `git add .`, commit og push; derfor må arbeidsmappen først være
   gjennomgått og releaseavgrenset. V2-mappens nåværende `package.json` har
   ikke et `sync`-script. Verifiser riktig repo, script og deploy-target før
   kommandoen brukes; ingen alternativ push/deploy-kommando er foreslått her.
6. **Kontroller godkjent produksjonsreise og første naturlige kjøp.** Følg
   samme event-ID fra browser via bro, ledger og forsøk til uavhengig
   provider-readback. Kontroller kjøpsverdi, valuta, variant, attribusjon og
   ingen konkurrerende Purchase. Betalt testordre krever egen godkjenning.
   Overvåk feil og leveranser de første 24 timene uten å starte nye jobber i v2.

## Obligatoriske datapunkter før ferdigmelding

| Kontrollpunkt | Nødvendig bevis |
|---|---|
| GTM/Stape | Full aktuell web-/servertriggeravlesning, aktive klienter/tags/transforms og faktisk request/response gjennom `/__sgtm`; pausede Meta-tagger fortsatt pausede |
| Cookie Keeper/Safari | Førstegangsbesøk, gjenbesøk, slettede cookies og sen restaurering; samme ID før første Meta-hendelse; Safari og BFCache må observeres separat |
| Power Ups/Store/POAS | Faktisk feltkonsum/effekt per aktiv Power Up; innhold/readback fra Store/feed; variant-/kostavstemming; ingen sammenblanding av estimert/faktisk profit og kjøpsverdi |
| Leverandører | Samme event-ID/tid, én utsendelseseier, korrelert mottaksbevis hos Meta/Google og aktuelle Microsoft/Pinterest/Snapchat-grener; ingen uautoriserte destinasjoner |
| Checkout/kjøp/refusjon | Vanlig checkout og Klarna; feil/avbrudd/usikker status; gjentatte og omordnede webhooks; én kanonisk Purchase/refund med korrekte verdier |
| Drift | Skille mellom lagret, forsøkt, `accepted_unverified`, mottatt og rapportert konvertering; ingen rå PII-/cookie-/dataLayer-dump |
| Ytelse | Sammenlign JS, TTFB, LCP og INP før/etter i samme relevante miljø; særlig master-cookie-skriving og HTML-cache. Ingen ytelsesgevinst er påstått fra et grønt build |

## Tilbakeføring

Ved kritisk feil rulles storefront tilbake til den siste verifiserte
storefront-deployen i det eksisterende prosjektet. Backend-deploy, domene,
Supabase og idempotenslager beholdes, slik at rollback ikke introduserer ny
kjøpseier. Verifiser callback-ruting og én worker-eier også etter rollback.
Gjennomfør ikke nye betalingsforsøk for transaksjoner med ukjent status.

Dokumenter faktisk rollback-SHA/deployment og observert leveransestatus.
En produksjonsrelease er ikke ferdig fordi bygg eller HTTP-aksept er grønn;
åpne datapunkter skal fortsatt stå `unverified`.

## Separat backendrelease 7. oktober 2026

Kilde: `Team-Kelc-AS/utekos-tracking-backend`, lokal mappe `../utekos-tracking-backend`, main-commit `9183f9e9464a0108d161403ec843240ae94560f6`. Katalogprosjektet `utekos-backend` er beholdt urørt. Ren produksjonskilde + eksplisitte sporingsendringer er bygget med låste avhengigheter. Produksjonsbygg, TypeScript, avgrenset lint og 24 tester passerer.

Første backendrelease eksponerer bare `/healthz` og OIDC-broen. Inngangen er deaktivert inntil miljøparitet og live broaksept er verifisert. Ingen cron-/køtriggere, og køpublisering er deaktivert. Eksisterende headless er fortsatt eneste worker- og storefront-eier. `BACKEND-RELEASE.md` og `environment-readiness.json` i den nye kilden beskriver avgrensningen og manglende miljøbevis. Oppdatert publiseringsstatus finnes i `backend-provisioning.json`.

## Verifisert første backend-deploy

Deploy `dpl_B3fJEEJfJPiVHut4gxGC2SeAm39A` er READY. `GET /healthz` gir 200 med korrekt SHA, no-store og noindex. Rot, direkte PageView, Klarna og cron gir 404. Broen gir forventet 503 `storefront_tracking_not_activated`. Ingen gyldig kunde-, betalings- eller leverandørhendelse ble sendt i disse kontrollene.

Workflow SDK bygger fortsatt tre eksisterende workflow-definisjoner fra kildegrunnlaget og lager egne triggerkonfigurasjoner. De er ikke bevis på kjørte jobber. Påstanden om deaktivert køpublisering gjelder den kanoniske provider-køen; SDK-styrte triggere og utestående arbeid skal avstemmes før aktivering og worker-overtakelse.

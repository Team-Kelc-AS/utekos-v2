# Sporing og produksjonsovertakelse

Oppdatert 10. oktober 2026. **V2 overtar butikkfronten; `utekos-headless` er pensjonert og skal aldri publiseres igjen.** Kanonisk innsamling, Shopify-webhooks, provideradaptere og outbox tilhører den separate `utekos-tracking-backend`. Eksisterende kontoer, GTM, Stape og Supabase videreføres.

Les [status og verifikasjon](STATUS-2026-10-10.md), [stegvis plan](MIGRATION-PLAN.md) og [hendelsesmatrisen](migration-matrix.md). Historiske JSON-rapporter og headless-commits i denne mappen er kildeproveniens eller daterte øyeblikksbilder; de overstyrer ikke dagens status.

## Observert produksjonsstatus

- Backend og v2 er i produksjon. [Dagens statusrapport](STATUS-2026-10-10.md) er autoritativ for konkrete releases, API-mottak og gjenstående kontroller.
- Web-GTM live **175** viderefører søkfjerningen fra174 og gjør backend CAPI til eneste Microsoft PageView-eier. Business- og ID Sync-tagger er bevart. [Faktisk nettverks- og mottaksbevis](microsoft-pageload-owner.verification.json). Server-GTM44 og Stape Power Ups er videreført.
- Storefrontprosjektet heter fortsatt utekos-headless, men Git peker til Team-Kelc-AS/utekos-v2. Chrome-produkt/kurv/checkout og Meta/Microsoft-mottak er kontrollert. Brukeren har valgt første naturlige kjøp til siste Purchase-avstemming. Safari-kontrollen er fortsatt uavklart.
- Brukeren har uttrykkelig godkjent workers, køer, cron og publisering. Tidligere Brand Studio-begrensning er opphevet. Tre manglende Microsoft Purchase er levert med eventsReceived=1 uten valideringsfeil; fire utløpte redateres ikke.

Produktfeeder beholder `/klarna-feed.xml`, `/api/feeds/microsoft-merchant` og roten på `feed.utekos.no`, med eksakte rewrites til backend. Oppfølgingsrelease retter bortfalte ruter og checkout-validering; se statusrapporten for faktisk verifikasjon.

## Eierskap

| Del | Eier |
|---|---|
| V2 storefront-kilde | `Team-Kelc-AS/utekos-v2`, main |
| Storefront/caller-prosjekt | Eksisterende `prj_MpZN3Z0PDp8rfwpdzAeplGe4Di0s` |
| Team | `team_0B8gWWIxT2hGVIJnK8CwanAi` |
| Offentlige origins | `https://utekos.no`, `https://www.utekos.no` |
| Backendkilde | `Team-Kelc-AS/utekos-tracking-backend`, main, repo-root |
| Backendprosjekt/domene | `prj_EHFI28tMUlIQsNguxjcKHPlLAlFE`, `https://backend.utekos.no` |
| Stape transport | `https://edge.utekos.no`, via v2s `/__sgtm` |
| Varig sannhet | Supabase ledger, idempotens og provider-outbox |
| Autoritativ Purchase/refund | Verifiserte Shopify-webhooks; `orders/paid` eier Purchase |
| Eksisterende workers | Backend eier periodiske jobber; gamle deploymenter beholdes for historisk kødrenering |

V2 skal ikke få parallelle providerjobber. Bekreftelsesside, Klarna callback og `checkout_completed` oppretter ikke konkurrerende Purchase. Meta Pixel/CAPI eies av appen; pausede GTM-Meta-tagger forblir pausede. Microsoft PageLoad-endringen er publisert i live 175 etter verifisert CAPI-mottak; faktisk browser-reload og ID Sync er kontrollert. Se [PageLoad-bevis](microsoft-pageload-owner.verification.json). Google Data Tag-fordeling beholdes; `purchase`/`view_item` kopieres ikke inn i nye destinasjoner.

## Kontrakter og lokale reparasjoner

Manifestkontrollen omfatter 117 filer uten avhengighet til headless-checkout. Gjennomgåtte v2-avvik beholder opprinnelig proveniens. Kanonisk event-ID/tid følger browser, collector, ledger og retry; Pixel bruker samme eventID. Policyen `operator_policy` med granted beholdes som brukerbeslutning og er ikke bevis på faktisk brukersamtykke eller juridisk samsvar.

Dun-reservasjon registreres som uvaluert Lead etter akseptert e-post og varig backendlagring, med eksakt produkt/variant/farge/størrelse. Browser speiler bare bekreftet serverkvittering. Samme e-postinnsending gjentas ikke ved telemetriretry. Søk er fjernet fra aktiv ruting, mens passive historiske skjemaer beholdes.

Broen bruker Vercel OIDC med fast audience og eksplisitt operasjonsliste. V2 bygger besøkskontekst på serveren; backend kontrollerer issuer/team/prosjekt/miljø/origin. Shopify-kompatibilitetsruter bevarer rå bytes, HMAC/OIDC, cookies og CORS. Klarna beholder betalingslåsing og ingen automatisk betalingsretry. Gatewayen strømmer svar, bevarer separate cookies og filtrerer private/interne headere. Cookie Keeper-masteren `user_id` videreføres.

## Konfigurasjon før trafikkovertakelse

| Hvor | Navn / verdi | Kontroll |
|---|---|---|
| Storefront | `NEXT_PUBLIC_TRACKING_ENABLED` | Produksjon er satt til `true`; kanonisk innsamling og Meta/Microsoft-mottak observert fra v2 |
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

| Storefront | `SHOPIFY_STORE_DOMAIN` | Opprettet fra verifisert eksisterende myshopify.com-domene |
| Storefront, server | `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` eller eksisterende `STOREFRONT_PRIVATE_ACCESS_TOKEN` | Kanonisk navn har prioritet; begge bruker privat header. Ingen offentlig tokenfallback |
| Backend | `STOREFRONT_TRACKING_INGRESS_ENABLED=true`, `CANONICAL_PROVIDER_QUEUE_PUBLISH_ENABLED=true` | Verifisert aktivt i backend-runtime; ni cron-planer og privat kø |

Browser-sporing er sperret for local/preview og andre verter. Callback-/webhook-kontinuitet og allerede lagret arbeid er separate fra browserens tracking-bryter. Eksisterende containere er web `GTM-5TWMJQFP`, server `GTM-M8GT97CV`, Stape `gqnrnczg` og Meta Pixel `1092362672918571`.

## Release og verifikasjon

1. Gjennomgå hele dirty-diffen fordi `pnpm run sync` gjør `git add .`, commit og push. Bevar samtidige innholdsendringer. Arbeid bare på main; ingen ny worktree, reset eller stash.
2. Avstem backendmiljø, OIDC, Redis, webhook-/checkout-verifikatorer, gammel kø/backlog og én worker-/sweeper-eier. [Worker-planen](backend-worker-cutover.draft.md) beskriver eksisterende konsument og ni planlagte cron-ruter. Nytt backendprosjekt arver ikke automatisk gammel kø.
3. Verifiser at backend kan betjene faktiske callbacks og collectors før v2 overtar trafikken. Koble eksisterende storefrontprosjekt til aktiv v2-kilde, kontroller miljøparitet og bruk bare `pnpm run sync` for release. Ingen Vercel deploy-kommando eller publisering av headless.
4. Kontroller positiv OIDC og negative preview/manipuleringsforsøk, samme request-/event-/journey-ID, begge deploy-SHA-er, besøks-IP/UA/geografi og separate cookies. HTTP 200 alene beviser ikke provider-mottak eller deduplisering.
5. Følg Chrome/Safari, Cookie Keeper, annonseklikk-ID, Shopify checkout/Klarna og første naturlige kjøp/refusjon. Dokumenter lagret, forsøkt, accepted_unverified, provider-mottatt og attribuert separat. Betalt testordre eller kampanjeaktivering inngår ikke i utførte kontroller.

Lokale tracking-, kontrakt-, type-, lint- og byggkontroller er dokumentert i statusrapporten. Eksterne nettverkskall interceptes i browser-fixtures. Ingen ytelsesgevinst påstås fra grønt bygg alene; Safari-kontinuitet, Power Up-feltkonsum/POAS og faktisk provider-rapportering gjenstår.

## Tilbakeføring

Behold en verifisert tidligere storefront-deployment som mulig rollbackmål uten å publisere mer headless-kode. Backend, domene, Supabase og idempotenslager beholdes. Avstem callback-ruting, worker-eier og meldinger ved rollback, og gjenta ikke betalingsforsøk med ukjent status. Dokumenter faktisk rollback-deployment og observert leveranse.

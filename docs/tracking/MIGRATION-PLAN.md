# V2 overtar sporing – gjennomføringsplan

Oppdatert 10. oktober 2026. `utekos-headless` er pensjonert og skal aldri publiseres igjen. V2 viderefører butikkfronten; `utekos-tracking-backend` overtar kanonisk innsamling, webhooks og provider-outbox. Eksisterende kontoer, GTM, Stape og Supabase videreføres. Historiske headless-commits er bare kildeproveniens.

Brukeren har godkjent deploy, GTM-endringer og overføring av eksisterende workers. En nyere Brand Studio-instruks forbyr bakgrunnsjobber. Det begrenser aktivering, selv om brukerautorisasjonen foreligger. Ingen nye jobber er innført eller startet.

## Steg og status

1. **Eierskap og kilde.** Separat backend er deployet fra main `f236cac…` og verifisert via produksjons-health. Storefrontens Git-kobling til pensjonert headless er frakoblet. Prosjektet skal videreføres med v2, men v2 er foreløpig ikke koblet inn eller satt på produksjonstrafikk. Ingen headless-release.
2. **Tester og kontrakter.** Action-stier etter route groups er rettet. Semantiske avvik og loaderformat er gjennomgått; 117 kontraktfiler kontrolleres uten headless-checkout. Tracking/gateway, TypeScript, lint og produksjonsbygg er kontrollert. Samtidige innholdsendringer er bevart og gjennomgått før `git add .`.
3. **Søk og Dun.** Søkesporing er fjernet fra v2-bro og publisert GTM live 174. Funksjonelt søk beholdes. Dun-reservasjon gir uvaluert Lead etter akseptert e-post og backendlagring, med stabil ID og eksakt produkt/variant. Backenddelen er deployet; v2-speiling er lokalt testet. [GTM-readback](gtm-search-removal.verification.json).
4. **Microsoft.** Autoritativ server-Purchase og varig retry er reparert og deployet. Konto/UET/mål er autentisert avlest; UET er aktiv og alle ti Utekos-kampanjer er pausede. Customer-delte mål brukes også av aktive Comfyrobe-kampanjer, så ingen global målendring er gjort. Kampanjespesifikke Purchase-mål er et isolert forslag. PageLoad-utkastet er rebassert mot live 174, men upublisert; behold browser-PageView til CAPI faktisk leverer.
5. **Overtakelse av drift.** Avstem eksisterende kø/backlog, workflows og ni cron-planer før én backendkonsument overtar. Backend har fortsatt inngang/køpublisering av, `crons: []` og ingen køtrigger. Verifiser OIDC, Redis, miljønavn/scope, Shopify HMAC/checkout-OIDC og providerkonfigurasjon. Se [worker-planen](backend-worker-cutover.draft.md).
6. **Samordnet trafikkrelease og bevis.** Når backend kan betjene reisen, kobles eksisterende Vercel-prosjekt til `Team-Kelc-AS/utekos-v2`. Bare `pnpm run sync` brukes for kildepublisering/deploy; aldri headless. Aktiver tracking-opt-in gjennom nytt bygg, og verifiser Chrome/Safari, checkout/Klarna og første naturlige eller særskilt godkjente kjøp/refusjon med korrelerte ID-er og provider-readback.

## Gjenstående bevis

- Positiv produksjons-OIDC og negative preview/manipuleringsforsøk, Redis og én faktisk worker-/sweeper-eier.
- Shopify-produksjonspixel og butikkglobale webhook-abonnementer; `read_pixels` ble avvist, og app-scope-listen beviser ikke global tilstand.
- Microsoft CAPI-mottak, Purchase-verdi/valuta/ID, deduplisering og målvalg for konkrete fremtidige salgskampanjer. HTTP 200 er bare `accepted_unverified`.
- Stape Monitoring 409, Cookie Keeper i Safari, faktisk Enricher-/POAS-feltkonsum og annonseklikk-ID-kontinuitet.
- V2 browser → backend → ledger → outbox → provider → rapportert konvertering, inkludert refusjon og én kjøpseier.

Søk er ikke en produksjonsgate. `operator_policy` med granted beholdes som tidligere brukerbeslutning. [Statusrapporten](STATUS-2026-10-10.md) skiller implementert, testet, deployet, mottatt og attribuert.

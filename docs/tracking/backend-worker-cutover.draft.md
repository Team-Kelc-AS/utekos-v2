# Eksisterende workers: gjennomført backend-overtakelse

Oppdatert 10. oktober 2026. Filnavnet beholdes for eksisterende lenker. Workers og publisering er uttrykkelig godkjent; tidligere begrensning er opphevet. Utekos-headless skal aldri publiseres igjen.

Backend bcb7ddffd0c7a71fa5e19fa172c8951349229c07 er READY som dpl_EvdZTQSa4Pw8ACgVXpZaBoj6zFyQ på backend.utekos.no. Health bekrefter workers/ingress/køpublisering true, Redis/database OK og brokonfigurasjon klar. Transactional-email-modus er disabled; abandoned-checkout-recovery er avslått med egen featuregate.

## Én periodisk eier og historiske køer

Gamle storefront-crons deaktivert før backend-release: disabledAt=1791627484313. Backend har ni registrerte planer med disabledAt=null. V2 inneholder ingen provider-workers eller cron-planer.

Køer er prosjekt-/deploymentbundet. Backend arver ikke gammel kø. Gamle deploymenter beholdes for målrettet historisk drenering. Siste avstemte 12-timersvindu viste 488 publisert/mottatt/slettet, null redeliveries og maksimal meldingsalder ett sekund. Dette er ikke en øyeblikkelig pending-måling. Ved skiftet var ingen provider-outbox-rader pending/retry_scheduled/processing.

To eldre LaunchGuard-workflows ble gjennomgått separat. Kilden leser health/ledger og skriver incidents/varsling; ingen provider-konverteringsdispatch identifisert. De er ikke slettet eller erklært drenert.

## Privat kø og leases

canonical-provider-dispatch-v1-trigger er aktiv. Offentlig HTTP-kall gir 404. Operatorautentisert no-op-probe med tilfeldig, ikke-eksisterende attempt-ID er korrelert med provider_queue_no_pending_attempt på riktig backenddeployment. Ingen ledger-hendelse, attempt eller konvertering opprettes av proben.

Batch- og målrettet claim deler fem minutters lease, med attempt-fencing. SDK-retry følger lagret nextAttemptAt; terminalt/manglende arbeid kvitteres. Varig checkout-completion har lease/CAS innen eksisterende outbox-cron, uten ny scheduler. Promotion-feil stanser ikke øvrig provider-dispatch.

## Aktive cron-planer

Planene er avlest fra Vercel for deploymenten over. Tidene er UTC.

| Rute under /api/cron/ | Plan |
|---|---|
| provider-outbox-dispatch | */5 * * * * |
| shopify-dun-waitlist-sync | */5 * * * * |
| abandoned-checkout-recovery | */5 * * * * |
| shopify-order-snapshots | */15 * * * * |
| google-data-manager-status | */5 * * * * |
| provider-dispatch-health | */5 * * * * |
| meta-dataset-quality | 17 3 * * * |
| meta-dataset-quality-retry | 17 4 * * * |
| meta-ad-delivery-insights | 17 10 * * * |

meta-view-item-dispatch, shopify-commerce-reconciliation og sync-google-merchant er fortsatt unscheduled. Cron krever eksisterende operatorhemmelighet; offentlige collectors er stengt. [Konsumentsikkerhet](https://vercel.com/docs/queues/concepts#consumer-function-security), [deploymentbundne leveringer](https://vercel.com/docs/queues/concepts#stopping-deliveries-to-a-deployment).

V2-produksjons-OIDC og rå Shopify-HMAC er verifisert gjennom den publiserte v2-fronten. Korrelert naturlig checkout-completion/kjøp er neste bevisgrense. READY og HTTP-aksept er ikke dedupliserings-/attribusjonsbevis.

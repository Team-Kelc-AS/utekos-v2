# Eksisterende worker: overtakelsesutkast, ikke aktivert

10. oktober 2026. Backend er `utekos-tracking-backend`; pensjonert `utekos-headless` skal aldri publiseres igjen. Backend main `f236cac692c3ec964a4066583d3740803a51ffa2` er deployet og health-verifisert. Inngang/køpublisering og transactional-email-modus er avslått. Dette dokumentet aktiverer ingen jobb og endrer ingen Vercel-konfigurasjon.

Brukeren har godkjent overføring av eksisterende workers. En nyere Brand Studio-instruks sier likevel «ingen bakgrunnsjobber»; det er denne begrensningen som hindrer aktivering, ikke manglende brukerautorisasjon.

## Privat køforbruker

Backend har `crons: []` og ingen køtrigger i `vercel.ts`. Køpublisering alene er utilstrekkelig. Ved gjennomføring av den godkjente overtakelsen klargjøres den eksisterende funksjonen:

```ts
functions: {
  'src/app/api/queues/canonical-provider-dispatch/route.ts': {
    experimentalTriggers: [{
      type: 'queue/v2beta',
      topic: 'canonical-provider-dispatch-v1',
      initialDelaySeconds: 0,
      retryAfterSeconds: 15
    }]
  }
}
```

Dette er en privat intern funksjon under Vercels køisolasjon, ikke et offentlig HTTP-endepunkt. Behold offentlig proxy stengt. `handleCallback` er ikke en separat JWT-kontroll; sikkerheten må verifiseres i faktisk build/trigger/readback. Se [Vercel consumer security](https://vercel.com/docs/queues/concepts#consumer-function-security).

## Én eier og varige forsøk

- Avstem provider-outbox: pending, retry_scheduled og processing med alder, provider og deployment. Ingen kundedata eller tokens i rapporten.
- Dokumenter gammel worker-/deploymentbinding og utestående kømeldinger før overtakelse. En ny produksjonsdeployment stanser ikke nødvendigvis gammel konsument. Ikke slett gamle deploymenter automatisk. Se [stopping deliveries](https://vercel.com/docs/queues/concepts#stopping-deliveries-to-a-deployment).
- Avklar én forbruker, publiseringsgate, gjenforsøk og eksisterende recovery/sweeper før inngangen åpnes. Overføring av gamle planlagte jobber er godkjent av brukeren; avstemming og gjeldende instruksjonsbegrensning gjenstår. Ingen nye jobber opprettes.
- Bekreft at midlertidig providerfeil gir et varig senere forsøk, og at idempotent gjensending ikke gir ny konvertering. Et normalt callback-svar kvitterer meldingen; `retry_scheduled` håndteres nå lokalt med SDK-retry til lagret `nextAttemptAt` (1–3600 sekunder per gjensending). For tidlige leveringer/aktiv lease beholdes meldingen. Terminale rader kvitteres. Dette er testet uten aktiv kø; runtime må fremdeles verifiseres. Se [push-mode SDK](https://vercel.com/docs/queues/sdk#consuming-messages-in-push-mode).
- Verifiser positiv OIDC-bro, Shopify HMAC/checkout-OIDC, Redis, miljønavn/scope og provider-konfigurasjon på riktig deployment før v2 peker produksjonstrafikk mot backend.

Ingen av punktene over er bevist av et lokalt bygg, HTTP 200 fra provider eller en READY-deployment alene.


## Eksisterende cron-planer som skal avstemmes

Listen er lest fra backendens `config/cronRegistry.ts`. `vercel.ts` har fortsatt `crons: []`; tabellen er en overtakelsesplan, ikke aktiv konfigurasjon. Tidene er UTC.

| Rute under `/api/cron/` | Eksisterende plan |
|---|---|
| provider-outbox-dispatch | `*/5 * * * *` |
| shopify-dun-waitlist-sync | `*/5 * * * *` |
| abandoned-checkout-recovery | `*/5 * * * *` |
| shopify-order-snapshots | `*/15 * * * *` |
| google-data-manager-status | `*/5 * * * *` |
| provider-dispatch-health | `*/5 * * * *` |
| meta-dataset-quality | `17 3 * * *` |
| meta-dataset-quality-retry | `17 4 * * *` |
| meta-ad-delivery-insights | `17 10 * * *` |

`meta-view-item-dispatch`, `shopify-commerce-reconciliation` og `sync-google-merchant` er eksplisitt unscheduled; de skal ikke få nye timere som del av overføringen.

Backendens offentlige proxy tillater nå bare health og OIDC-broen. Cron-ruting/verifikasjon må derfor klargjøres og kontrolleres sammen med Vercel-planen, uten å åpne offentlige collectors. Køforbrukerens private trigger må verifiseres separat i faktisk deployment.

Vercel-køer er prosjekt-/deploymentbundet. Det nye backendprosjektet arver ikke gammel storefront-backlog. Les antall/alder/status i outbox, gamle kømeldinger og Workflow-inflight før skiftet, og dokumenter hvordan gammelt arbeid fullføres med samme event-ID og én utsendelseseier. Ikke slett gamle deploymenter eller anta at Git-frakobling stanser allerede kjørende arbeid.

Storefrontprosjektets Git-kobling til headless er frakoblet; dette er ikke en worker-overføring. V2-sporing og Microsoft PageLoad-overtakelse skal først aktiveres etter fungerende backend og korrelert provider-mottak.

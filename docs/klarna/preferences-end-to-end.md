# Klarna-preferanser: lagring, bruk og verifikasjon

Kontrollert 30. oktober 2026. Dette dokumentet skiller bekreftet lagring fra synkronisering og faktisk levering. Innlogging alene gir aldri samtykke.

## Kode og eierskap

| Ledd | Kode | Ansvar |
| --- | --- | --- |
| Skjema | `src/assets/components/klarna/KlarnaMarketingPreferences.tsx` | shadcn/Base UI, lukket som standard, eksplisitt lagring, validerte svar, feil og ny forespørsel |
| Utseende | `KlarnaMarketingPreferences.module.css`, `src/assets/components/ui/Accordion.tsx`, `accordion.module.css` | Utekos-palett, kontrollert chevron, tekstbryting og plass til ikon |
| Nettbutikkens API | `src/app/api/identity/klarna/prospect/route.ts` | Same-origin, størrelsesgrense, streng validering, kryptert innloggingssesjon og serverlest handlekurv |
| Backend-kall | `src/lib/klarna/prospect.ts` | Identitet fra den verifiserte sesjonen, Vercel OIDC-bro til backend |
| Database | Backend: `src/lib/customer-account/handleKlarnaProspect.ts` | Transaksjon og identitetslås, profil, samtykkehistorikk og handlekurvkopi |
| Shopify | Backend: `src/lib/customer-account/syncKlarnaProspectShopify.ts` | Samtykkestatus og segmenteringstagger, kvitteringer og nye forsøk |
| Nye forsøk | Backend: `src/app/api/cron/provider-outbox-dispatch/route.ts` | Ett avgrenset synkforsøk på eksisterende femminuttersplan |
| Annonsematching | Backend: `src/lib/customer-account/readKlarnaProspectMatchData.ts` og `src/lib/integrations/storefrontTracking/handleRequest.ts` | Oppslag krever samtykke i profilen og markedsføringssamtykke for hendelsen |

Backend-koden ligger i søsterrepoet `utekos-tracking-backend`.

## Hvor opplysningene faktisk lagres

Supabase-prosjekt `hkoawfbomhnzupcsdggb`, i skjemaet `customer_private`:

- `identity_prospects`: verifisert Klarna-identitet, passform, favorittfarge, interesser, separate samtykkeflagg og synkkvitteringer. Identitetsnøkkelen avledes av utsteder og Klarna-subjekt.
- `identity_prospect_consents`: historikk per kanal (`email`, `cart`, `ads`), valg, kilde, tekstversjon og tidspunkt. Uendrede valg lager ikke nye kvitteringer. Nye/endret valg bruker `klarna-marketing-v3`.
- `identity_prospect_carts`: serverlest, offentlig handlekurv-ID uten privat Shopify-nøkkel og varelinjer. Skrives bare med eget påminnelsessamtykke. Sletting av dette samtykket fjerner kopien.

Alle tre tabellene har RLS aktivert. Direkte tabellrettigheter for `anon`, `authenticated` og `PUBLIC` var tomme ved kontrollen. Nettleseren får preferansene via det autentiserte API-et, ikke databaseadgang.

Lagring og samtykkehistorikk skjer i samme databasetransaksjon. UI-et viser lagret først etter bekreftet transaksjon. Shopify-synk er en separat kvittering: ved avbrudd svarer API-et `saved: true, shopifySync: pending`; UI-et opplyser om ventende synk. Databasen er den autoritative kilden, og den eksisterende cron-ruten prøver igjen.

## Hva valgene brukes til

| Valg | Implementert bruk | Verifikasjonsgrense |
| --- | --- | --- |
| Passform, farge og interesser | Lagres privat. Ved e-postsamtykke synkes bare Utekos-tagger til Shopify, f.eks. `utekos_interest_hytte` og `utekos_comfyrobe_size_xs`. | Database tur/retur er testet med faktiske verdier. Shopify-synk og tilbaketrekking har kontrakttester; ingen ekte kundes abonnement endres for testing. Ingen automatisk personlig produktvisning er implementert. |
| Tilbud og produktnyheter | Eget e-postsamtykke; Shopify `SUBSCRIBED`/`UNSUBSCRIBED`, fjerning av egne tagger ved tilbaketrekking og varig ventende synk. | Lagring er ikke bevis på at en kampanje er sendt eller levert. Kampanjer krever vanlig målgruppe- og utsendelseskontroll. |
| Personlig tilpasset innhold | Eget `ad_matching`-flagg. Backend kan berike samtykkede hendelser med tillatte felt fra verifisert profil. Utløpte profiler brukes ikke til matching. | Testet samtykkeport og skjemakontrakt. Ingen reelle annonsehendelser eller leverandørkvitteringer er generert som del av denne UI-endringen. |
| Handlekurvpåminnelse | Eget flagg, privat handlekurvkopi, oppdatering ved endret kurv og sletting ved tilbaketrekking. | Ingen utsendelsesjobb for disse Klarna-kurvene er aktivert i den publiserte løsningen. Skjemaet opplyser om dette. Eksisterende checkout recovery er en annen flyt. |

## End-to-end-gater før handlekurvpåminnelser aktiveres

1. Koble bare kvalifiserte Klarna-kurver til en varig, deduplisert kø. Kontroller samtykke på nytt både ved kølegging og sending.
2. Slå opp fersk handlekurv, tilgjengelig variant, størrelse, farge, lager, pris, rabatt og gyldig checkout-lenke. Stopp tomme kurver og kurver med bekreftet kjøp. Avklar kobling til en eksisterende konto fremfor automatisk sammenslåing.
3. Kontroller avmelding, reservasjoner og sperrede mottakere. Ikke la innlogging eller et annet samtykke overstyre disse. Verifiser at tilbaketrekking stopper allerede kølagt arbeid.
4. Definer én påminnelse, ventetid, utløp og konfliktkontroll mot eksisterende checkout recovery. Gjentatte cron-kjøringer og provider-timeout må ikke gi dobbel utsending.
5. Test godkjent intern mottaker gjennom virkelig kø, leverandøraksept, levering og klikkbar gjenoppretting. Test også avmelding, manglende lager, fullført kjøp og provider-feil. Ingen kundesending før disse gatene består.
6. Verifiser håndhevet sletting/anonymisering. Dagens kode setter utløp (kort innloggingsprofil én dag, lagrede preferanser 180 dager, handlekurv 30 dager); en utløpskolonne alene dokumenterer ikke automatisk sletting. Bevar nødvendige samtykkekvitteringer etter en uttrykkelig definert regel.
7. Aktiver først etter godkjent utsendelsesopplegg, og overvåk kvalifiserte, stoppede, aksepterte og leverte meldinger separat. Lag en dokumentert stoppmekanisme.

## Repeterbar verifikasjon

Frontend, mot en startet nettbutikk:

```sh
KLARNA_PREFERENCES_BASE_URL=http://localhost:4321 node --test tests/klarna-preferences-browser.test.cjs
pnpm run typecheck
pnpm run build
```

Nettlesertestene bruker testdata og avskjærer skrivekall. De kontrollerer lukket standardtilstand, tastatur, eksakt tekst, 320/390/768/1440 px, 200 % tekststørrelse, gjeninnlasting, tomt/ugyldig API-svar, lagringsfeil og ventende Shopify-synk. Chromium og WebKit inngår. De dokumenterer UI og kontrakt, ikke virkelig innlogging eller provider-levering.

Backend:

```sh
pnpm run test:klarna-bridge
NODE_OPTIONS='--conditions=react-server' pnpm exec tsx --test tests/unit/app/api/cron/provider-outbox-dispatch/route.test.ts
KLARNA_PROFILE_DATABASE_TEST=1 NODE_OPTIONS='--conditions=react-server' node --env-file=.env.local --import tsx --test tests/unit/lib/integrations/storefrontTracking/klarnaStorage.database.test.ts
```

Databasetesten er eksplisitt påslått, bruker en unik syntetisk identitet, og rydder etter seg. Den bekrefter faktisk lagring/gjenlesing av passform, farge, interesser og samtykker, én profil ved gjentatt innlogging, ingen doble kvitteringer, serverlest kurvformat, sletting ved tilbaketrekking, og at en simulert Shopify-feil ikke skjuler en allerede lagret transaksjon. E-postsamtykke forblir av; testen sender ingen e-post og oppretter ingen Shopify-abonnent.

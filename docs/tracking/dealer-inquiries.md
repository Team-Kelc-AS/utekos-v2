# Forhandlerhenvendelser: web og PDF

Implementasjon 2026-10-08, lokalt på `main` i `utekos-v2` og `utekos-tracking-backend`. Ingen publisering eller reelle testhenvendelser. Eksisterende e-postlevering med utfylt PDF til `erling@utekos.no` videreføres.

## Hendelsene og kildene

| Brukerhandling | Canonical event | Identitet og avgrensning |
| --- | --- | --- |
| Åpne PDF, laste ned PDF, trykke send | `hero_interact` | `dealer_pdf_open`, `dealer_pdf_download`, `dealer_web_submit`, `dealer_pdf_submit`; side-URL og klikksekvens |
| Begynne å fylle ut | `form_start` | Én per sidevisning og `form_id=dealer_inquiry`; feltkategori, aldri feltverdi |
| Validerings- eller leveringsfeil | `form_error` | Forsøks-ID og feilkategori; ingen meldingstekst |
| Bekreftet mottak hos Resend | `form_submit` | Serverobservasjon, `result=accepted`, koblet til kvitteringen |
| Lagret forhandlerhenvendelse | `generate_lead` | Samme stabile lead-ID ved omlevering; `form_id` og `lead_type` er `dealer_inquiry` |

`/bli-forhandler` og `/bli-forhandler/pdf` har separate sidevisninger. Supabase lagrer `entry_point=dealer_web/dealer_pdf`; nye Meta/Microsoft-eksporter bruker `entry_point=web/pdf`. PDF-visningen bruker faktiske HTML-felt over PDF-en, slik at samme observer og Server Action fungerer på begge sider. Aktivitet i en nedlastet PDF utenfor nettstedet er ikke observerbar. PDF-nedlasting er en interessehandling, aldri et mottatt lead.

Ingen ny hendelsesfamilie, separat pixel eller klient-API til Shopify er innført. Den eksisterende canonical observeren, OIDC-broen, ledgeren og provider-outboxene er brukt. Offentlig nettleserinnsending av forhandler-`form_submit`/`generate_lead` avvises; den interne serveroperasjonen krever den eksisterende autentiserte broen.

## Lagring og mottakerfordeling

- `marketing.leads`: kontaktdata, butikknavn, sted, oppgitt kontaktperson, opprinnelig tidspunkt, entry point, observert samtykke og sidekontekst. Meldingen ligger bare i e-posten/PDF-en. Cookie-header lagres ikke i leadmetadata. Analyse-ID-er lagres bare når analysesamtykke er innvilget.
- `marketing.event_ledger`: canonical hendelser med eksisterende deduplisering. Leveringsforsøk og leverandørkvitteringer går i eksisterende outbox-/dispatch-tabeller. Database-RLS på `marketing.leads` ble bekreftet via read-only inspeksjon 2026-10-08.
- Google: eksisterende canonical Google-adaptere for alle fem hendelser. Eksisterende kvalifikasjons-, identitets- og samtykkeregler gjelder fortsatt.
- Meta: eksisterende `HeroInteract` og `Lead`; nye servereksporter `FormStart`, `FormError`, `FormSubmit` gjelder bare for forhandlerskjemaet. `Lead` får forhandlerklassifikasjon. Browser/CAPI bruker samme bekreftede event-ID for deduplisering av lead.
- Microsoft: registrerte adaptere og workers for de fem hendelsene, begrenset til forhandlerskjemaene og CTA-listen over. HTTP 200 er ikke nok: CAPI må bekrefte ett mottatt event uten valideringsfeil. Timeout går gjennom eksisterende retry-policy.

Markedsføringseksport krever markedsføringssamtykke etter eksisterende canonical policy. Den eksisterende `operator_policy` med granted som standard er bevart; dette er en konfigurasjonsbeslutning, ikke en ny vurdering av lovlighet. En forhandlerhenvendelse gir ikke nyhetsbrevabonnement: `consent_marketing=false` i leadregistreringen, og ingen Shopify email/SMS marketing-consent-mutasjon utføres.

Forhandlerleads har ingen dokumentert kroneverdi. Valuta og beløp utelates. Kontrakten har en eksplisitt unntaksgren for akkurat `dealer_inquiry`; andre leads beholder kravet om positiv verdi og valuta. Dette er også representert i genererte JSON-/OpenAPI-kontrakter.

## Shopify-segment

Segmentet er opprettet i Utekos, `erling-7921.myshopify.com`, og bekreftet med en separat lesing:

- Navn: **Forhandlerhenvendelser – Utekos**
- ID: `gid://shopify/Segment/1177048875256`
- Filter: `customer_tags CONTAINS 'utekos-forhandlerhenvendelse'`

Serveren slår opp nøyaktig e-postadresse. Eksisterende kunde får taggen uten endring av profil, øvrige tagger eller markedsføringsstatus. Ny kunde opprettes med e-post og tagg. Anonyme klikk og ufullførte skjemaer oppretter ikke kunder. Ingen testkunder er opprettet.

## Kvitteringer, feil og omlevering

Resend-kvitteringen bestemmer en stabil UUID. Bekreftelsen til brukeren gjelder e-postmottaket. Etterpå gjøres opptil to idempotente broforsøk med identisk lead-ID og tidspunkt. De sender ikke e-posten på nytt. Backend lagrer leadet før Shopify-/canonical-integrasjonene og avviser samme ID med endret kontaktidentitet.

`integration_status` på leadet viser Shopify-, canonical- og form_submit-status. Delvis feil gir 202 og et nytt broforsøk. Browser Lead returneres først etter kontrollert canonical-readback og fullført integrasjonsstatus. Ved permanent integrasjonsfeil beholdes e-postbekreftelsen; det logges `dealer_inquiry_tracking_unverified` med ID uten skjemainnhold. Det finnes ingen ny bakgrunnsjobb som skjuler eller automatisk reparerer denne feilen.

Manuell feilgjenoppretting skal begynne med den opprinnelige `marketing.leads`-raden og slå opp `generate_lead:<id>` i ledgeren. Bruk den lagrede e-posten for ny Shopify-tagging; ikke ta ny kontaktidentitet fra en vilkårlig omlevering. Bruk opprinnelig tidspunkt og dokumentert samtykke. Les eksisterende canonical event før eventuelt nytt forsøk; ikke konstruer manglende klikk-ID-er, cookie-identiteter, samtykke eller konverteringsverdi. Ved feil før leadet nådde databasen må Resend-kvitteringen og den originale henvendelsen avstemmes først. Provider-outboxenes eksisterende retry/dead-letter-verktøy gjelder leverandørlevering.

## Kontraktsopprinnelse og publiseringsgrense

V2s 117 importer er fortsatt forankret i headless-commit `e74e6cd8310c88f2777cbfdf5ad6b431647d7f77`. `contract-overrides.json` beskriver de to gjennomgåtte utvidelsene med både opprinnelig og ny hash. `vendor-contracts.py` kontrollerer begge og overskriver ikke utvidelsene ved ny import. Backendens genererte kontrakter må bygges fra samme schema/catalog.

Read-only `GET https://backend.utekos.no/healthz` 2026-10-08 viste deploy `b9723ac08e7c65c26ae20df7c52e21df0932d597`, `tracking_ingress_enabled=false` og `queue_publish_enabled=false`. Denne endringen aktiverer ingen flagg eller nye cron-/workflow-jobber. Eksisterende headless produksjonsansvar flyttes ikke av dette arbeidet.

Før produksjonslevering kan bekreftes må begge kodeendringene publiseres gjennom avtalt arbeidsflyt, og eksisterende cutover-/OIDC-/provider-gates være oppfylt. Verifiser deretter en uttrykkelig godkjent henvendelse gjennom Resend, Shopify-tag/segment, Supabase-ledger, outbox og faktiske kvitteringer hos Google, Meta og Microsoft. Lokal test eller adapterregistrering er ikke slik dokumentasjon. Konverteringsmål og rapportert konvertering i annonsekontoene er egne kontrollpunkter.

## Kilder

- Next.js 16.3.8, lokal `node_modules/next/dist/docs/01-app/02-guides/forms.md`.
- [Shopify segmentCreate](https://shopify.dev/docs/api/admin-graphql/latest/mutations/segmentCreate) og validert Admin GraphQL-skjema via Shopify MCP.
- [Google GA4 generate_lead](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#generate_lead).
- [Microsoft UET Conversions API](https://learn.microsoft.com/en-us/advertising/guides/uet-conversion-api-integration?view=bingads-13).
- Eksisterende canonical providerkontrakter, Utekos Docs MCP og provideradaptere i backend.

## Verifikasjon av denne endringen

- V2: `node --test --test-concurrency=1 tests/*.test.cjs` **199/199**, gateway-testene **11/11**, produksjonsbygg med TypeScript bestått og fokusert ESLint uten feil. Første parallellkjøring hadde én PDF-tidsavbruddsfeil under samtidige bygg; den uendrede testen og hele pakken besto sekvensielt.
- Backend: nye handler-/database-/Shopify-tester **40/40**, providertester **15/15**, manifesttester **4/4**. Fokusert ESLint, kontraktenes generate/check og endelig produksjonsbygg med TypeScript bestått.
- Begge repoers relevante kontraktfiler er kontrollert mot samme innhold, og v2s opprinnelige kontrakthasher er bevart som kildebevis.
- Bredere eksisterende backendtester har baselinefeil: planner **29/31**, events **35/40**, dispatch **5/8**. De samme feilene ble reprodusert fra et rent `git archive` av HEAD `b9723ac08e7c65c26ae20df7c52e21df0932d597`: gamle samtykkeasserts, manglende `vercel.json` og to ugyldige testimporter. De er ikke endret i denne leveransen. Regenerering fjernet to ekstra gamle kontraktdriftfeil.
- Ingen reelle e-poster, testkunder eller annonsekonverteringer er sendt. Bare Shopify-segmentet ble opprettet eksternt. Tester med leverandører bruker simulerte svar.

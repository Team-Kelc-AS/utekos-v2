# Mest leste artikler

Alle tolv artikler viser samme globale topp fem etter kildeavsnittet. En artikkel
som selv ligger i topp fem beholdes i listen og markeres med `aria-current="page"`.
Artikkeltitler, bilder og lenker kommer fra `knowledgeArticleList`.

## Datagrunnlag

- GA4-property: `489598217` (Utekos Marketing Group | Analytics).
- Metrikk: `screenPageViews`, gruppert på `pagePath`.
- Produksjonsverter: `utekos.no` og `www.utekos.no`.
- Måleperiode: de siste 30 hele dagene i `Europe/Oslo`.
- `/kunnskap/` og `/uteguiden/` normaliseres til samme registrerte artikkel.
- Bare registrerte artikler med målte visninger inngår. Ingen redaksjonell utfylling.
- Lik visningstelling sorteres stabilt etter artikkelslug.

«Mest leste» betyr her registrerte artikkelvisninger, ikke dokumentert fullført
lesning. Måleperioden vises alltid ved listen. GA4 og Vercel Web Analytics har ulik
dekning og rangering; data fra de to kildene blandes ikke.

Verifisert GA4-rapport hentet 5. november 2026: perioden 6. oktober–4. november,
13 rader, ingen sampling eller datatap rapportert. Én ukjent rute
(`/uteguiden/uteguiden`) utelates. Det lagrede grunnlaget ligger i
`src/lib/knowledge/articleViews.generated.json`.

| Artikkel | Visninger |
| --- | ---: |
| Hva skal man ha innerst | 34 |
| SherpaCore | 33 |
| HydroGuard | 29 |
| Vinterlagring av campingvogn og bobil | 28 |
| CloudWeave | 25 |

## Oppdatering og status

`getArticleReadership` støtter serverbasert innhenting fra GA4 med daglig
cache-revalidering ved trafikk. Det krever `GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON`
med en servicekonto som har lesetilgang til propertyen, samt
`GOOGLE_ANALYTICS_PROPERTY_ID=489598217`. Hemmeligheten skal bare ligge på serveren.
Ingen ny sporing, cronjobb eller klientforespørsel legges til.

Ved manglende konfigurasjon brukes den verifiserte rapporten med dens opprinnelige
datoer. Ved leverandørfeil logges avviket og samme daterte rapport vises. Ufullstendige,
samplede eller terskelbegrensede rapporter brukes ikke til en ny rangering.

Servertilgang ble verifisert 5. november 2026 med en direkte Node/GA4-forespørsel
som ga samme topp fem som MCP-rapporten. Etter brukerens klarsignal er
`GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON` lagt inn som **Sensitive** for **Production**
i Vercel-prosjektet `utekos-headless` (`prj_MpZN3Z0PDp8rfwpdzAeplGe4Di0s`).
Navn, type og miljø er lest tilbake fra Vercel. Eksisterende property-ID er bekreftet.

Den tidligere `GOOGLE_ANALYTICS_CREDENTIALS_PATH` peker til en manglende lokal
Mac-fil og brukes ikke av denne implementasjonen. Ingen hemmeligheter er lagt
i repositoryet. Selve nettsideendringen er ikke publisert; daglig oppdatering
trer i kraft når denne koden bygges og publiseres med produksjonsvariabelen.

Kilder: [GA4-metoder og metrikker](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema),
[GA4 API-tilgang](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart).

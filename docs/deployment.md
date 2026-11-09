# Preview og produksjon

Felles deployflyt for `Team-Kelc-AS/utekos-v2`. Denne filen og
[AGENTS.md](../AGENTS.md) erstatter eldre deployinstrukser om alltid å arbeide
på `main`, bare bruke `pnpm run sync` eller vente på en fremtidig v2-overtakelse.
Daterte releaserapporter beholdes som historisk dokumentasjon.

## Miljøkart

| Miljø | Branch | Fast adresse | Vercel-scope |
| --- | --- | --- | --- |
| Preproduksjon | `preview` | https://preview.utekos.no | Preview, med eventuelle branch-overstyringer |
| Produksjon | `main` | https://utekos.no (og `www.utekos.no`) | Production |

Begge bruker Vercel-prosjektet `utekos-headless`
(`prj_MpZN3Z0PDp8rfwpdzAeplGe4Di0s`) i team
`team_0B8gWWIxT2hGVIJnK8CwanAi`, med Git-kilde `Team-Kelc-AS/utekos-v2`.
Prosjektnavnet er historisk; ikke publiser fra `../utekos-headless`.
`preview` er en egen Git-branch, ikke en undermappe eller underbranch i `main`.
Andre branchers preview-deployer erstatter ikke den faste preview-adressen.

## Arbeidsflyt

Brukerens stående instruks er at avtalte implementasjonsoppgaver fullføres på
`preview.utekos.no` etter lokale kontroller. Ikke stopp ved localhost eller be
om nytt preview-klarsignal for samme avtalte scope. Unntaket er når brukeren
ber om kun lokalt arbeid. Produksjon krever fortsatt særskilt klarsignal.

1. Les `AGENTS.md`, kontroller `git status --short`, aktiv branch, `origin`,
   GitHub-kontoen `utekos-brand`, commit-forfatter og `.vercel/project.json`.
   Avgrens oppgavens filer og bevar eksisterende lokale endringer. Bruk isolert
   checkout/worktree ved behov; ikke bytt branch i et skittent arbeidstre for
   å få med alt til preview. `sync` gjør `git add .`, commit og push og er ingen
   sikker snarvei for et avgrenset scope.
2. Implementer og kjør kontroller som passer endringen. Ved bestilt
   preview-publisering: ta utgangspunkt i oppdatert `origin/preview`, gjennomgå
   diffen og commit/push kun avtalt scope til `preview`. Push utløser Vercel
   Git-deploy; ikke lag ekstra deployer uten behov. Rene lese- og vurderingsoppgaver
   gir ingen ny publiseringsbestilling.
3. Les den konkrete deploymenten via Vercel. Bekreft prosjekt, Git-branch
   `preview`, eksakt commit-SHA, deployment-ID, `READY` og at
   `preview.utekos.no` faktisk er alias på denne deploymenten. Noter også den
   unike deployment-URL-en: den faste adressen flyttes ved senere deployer.
4. Kontroller berørte sider og flyter på `https://preview.utekos.no`.
   Ved UI-endringer: kontroller mobil (omtrent 390 px) og desktop (omtrent
   1440 px), innhold, navigasjon og relevante feil. Kontroller SEO/metadata
   når berørt. Rapporter konkrete funn og miljøbegrensninger; `READY` alene
   beviser ikke at flytene virker.
5. Produksjon krever særskilt klarsignal for den konkrete endringen. Først da
   overføres kun avtalt, testet scope til oppdatert `main`. Gjennomgå den
   faktiske produksjonsdiffen; ikke merge hele `preview` hvis den inneholder
   andre forsøk eller endringer. Publiser avhengig backend før storefront
   når begge endres. Preview og produksjon kan bygges med ulike variabler;
   verifiser produksjon separat med eksakt SHA, deployment-ID, `READY`,
   `utekos.no` og kontroll av berørte sider/flyter og provider-mottak når relevant.

## Miljøvariabler, integrasjoner og tilgang

Preview er ikke dokumentasjon på at alle tjenester er isolert. Kontroller
Preview-scope og branch-overstyringer samt faktiske origins, backend-, database-,
Shopify- og Klarna-mål før tester med sideeffekter. Ikke kopier hemmeligheter
til Git, rapporter eller chat. Manglende variabler skal rapporteres konkret;
ikke løs det ved ukritisk å kopiere produksjonsoppsettet.

Bevar eksisterende sperrer mot produksjonssporing fra preview. Ikke legg
preview til produksjonens OIDC-/origin-tillatelser, endre betalingsoppsett eller
omgå samtykke som del av vanlig preview-testing. En avvist produksjonsintegrasjon
kan være forventet i preview og er ikke alene en produksjonsfeil.

Les faktisk Deployment Protection og robots/noindex før eksterne crawler- eller
delingstester; en fast preview-adresse beviser ikke offentlig tilgang eller
indekseringsstatus. Ikke skru av beskyttelse eller send preview til indeksering
for å få en kontroll til å passere.

## Verifisert oppsett 8. november 2026

Vercel MCP bekreftet `preview.utekos.no` som `verified: true`,
`gitBranch: preview`, `customEnvironmentId: null`; prosjektets liste over
Custom Environments var tom. Preproduksjon bruker dermed det vanlige
Preview-miljøet, ikke et eget Custom Environment.

Ved kontrollen pekte domenet på deployment `dpl_8bFq28sdvj2r8NaEoCj2fk61UAZE`,
`READY`, branch `preview`, commit `56122f3cdc73b3b57754c91927c816a3fb6ae24a`,
med unik URL https://utekos-headless-ctvewyj3b-utekos-marketing-group.vercel.app.
`utekos.no` pekte separat på `dpl_ZAYrfR1zLKtDwyV7xteg1wrX1Bwk`, `READY`,
branch `main`, target `production`, med samme SHA. Dette er et datert
oppsettsbevis, ikke et permanent deploymål eller en funksjonstest av butikken.
Les alltid aktuell tilstand tilbake før neste publisering eller test.

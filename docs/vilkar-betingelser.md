# Vilkår og betingelser: innholdsmigrering

Migrert lokalt 5. oktober 2026 fra
`../utekos-headless/src/db/config/terms.config.tsx`, sammenholdt med
[den offentlige vilkårssiden](https://utekos.no/vilkar-betingelser).

Alle 21 seksjoner er skrevet direkte i `src/app/vilkar-betingelser/page.mdx`.
Ordlyd, seksjonsankere og versjonsdatoen 03. november 2025 er beholdt.
Listeetiketter er uthevet, og e-postadressen er gjort klikkbar. Dette er en
innholdsmigrering, ikke en juridisk revisjon av vilkårene.

Den etablerte URL-en `/vilkar-betingelser` er beholdt med selvrefererende
canonical, metadata og lenker fra footer og sitemap. Interne lenker til
personvern og frakt/retur er videreført.

Serverlayouten bruker samme Utekos-palett og Google Sans Flex som
personvernsiden. Innholdsoversikten bruker eksisterende MDX-komponent med
native `details`/`summary`. Ingen nye klientkomponenter, avhengigheter,
bilder eller schema. Sporingslogikk er urørt. Ingen commit, push eller deploy.

## Kontroller

- ESLint for berørte TypeScript-filer, TypeScript og produksjonsbygg bestått.
  `/vilkar-betingelser` prerenderes statisk.
- Alle 21 seksjoners renderede tekst samsvarer med kilden ved normalisering
  av tegnsetting og mellomrom.
- Lokal HTTP 200, én H1, korrekt canonical, footerlenke og sitemap-oppføring.
  Lenker til personvern og frakt/retur gir HTTP 200.
- Visuelt kontrollert på desktop og mobil. Ingen horisontal sideoverflyt
  ved 320, 390 eller 1440 px. Alle 21 innholdslenker har gyldige ankere,
  og innholdsoversikten kan åpnes med tastaturet. Ingen nettleserfeil observert.

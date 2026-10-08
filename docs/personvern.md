# Personvern: innholdsmigrering

Migrert lokalt 5. oktober 2026 fra
`../utekos-headless/src/db/config/privacy.config.tsx`, sammenholdt med
[den offentlige personvernsiden](https://utekos.no/personvern).

Alle 13 seksjoner er nå skrevet direkte i `src/app/personvern/page.mdx`.
Ordlyd, lagringsfrister, seksjonsankere og versjonsdatoen 19. september 2026
er beholdt. Formatering er forenklet til Markdown og semantiske HTML-tabeller.
Ingen nye juridiske påstander eller behandlingsgrunnlag er introdusert.

Den tomme `layout.mdx` er erstattet med en serverrendret `layout.tsx` som
viser MDX-innholdet og setter metadata, canonical og brødsmuler. Siden bruker
eksisterende MDX-komponenter, Google Sans Flex og Utekos-palett.
Footer og sitemap lenker til den eksisterende adressen `/personvern`.
Ingen nye klientkomponenter, bilder, schema eller avhengigheter er lagt til.

## Avgrensning før produksjonssetting

Dette er migrering av den eksisterende erklæringen, ikke en gjennomgang av
om alle behandlingene er implementert identisk i v2. Leverandørregioner,
lagring/sletting og aktive behandlinger er ikke revidert i denne oppgaven.

Kildeteksten viser til «Endre cookie-innstillinger» og Facebook-innlogging.
Den nye footeren har foreløpig ingen knapp for cookie-innstillinger, og den
gamle sidens `FacebookLoginConnectionControl` er ikke migrert. Samtykke- og
Facebook-funksjonalitet må avstemmes med erklæringen før v2 publiseres.
Dette er ikke løst ved å legge til en knapp som ikke virker eller ved å
endre erklæringens juridiske innhold uten en egen vurdering.

Sporings- og samtykkelogikk er urørt. Ingen commit, push eller deploy.

## Kontroller

- ESLint for de berørte TypeScript-filene og produksjonsbygg med TypeScript:
  bestått. `/personvern` prerenderes statisk.
- Alle 13 seksjoners renderede tekst er sammenlignet mot kilden, med
  normalisert tegnsetting og mellomrom. Ingen tekstinnhold mangler.
- Lokal HTTP 200, selvrefererende canonical og én H1.
- Ingen horisontal sideoverflyt ved 320, 390 og 1440 px. Tabellenes
  vannrette rulling er avgrenset til fokuserbare, navngitte områder.
  Innholdsoversikten bruker native details/summary for å holde mobilvisningen kort.

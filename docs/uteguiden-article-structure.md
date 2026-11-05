# Uteguiden: artikkelstruktur og lesetid

Alle registrerte artikler bruker denne rekkefølgen:

1. `article > header`: brødsmulesti, én H1, ingress, forfatter, oppdatert dato og lesetid.
2. `article > figure`: hovedbildet i originalt sideforhold, med eventuell eksisterende bildetekst.
3. `article > div[data-article-body]`: artikkelinnhold og eksisterende hjelpefunksjoner.
4. Eksisterende kilder og anbefalinger etter artikkelinnholdet.

`KnowledgeArticleIntro` eier den felles headeren. `KnowledgeArticleScaffold` bruker den direkte; artikler med egen MDX-struktur bruker samme komponent med sin eksisterende tittel og ingress. Metadata vises som en kompakt linje, uten separat forfatterkort.

Datoen bruker `updatedAt` når denne er registrert. Ellers brukes datoen for første versjon (`publishedAt` eller `publishedMonth`), som er den siste kjente versjonen. En registrert måned gjøres ikke om til en oppdiktet eksakt dag. Oversiktskortene beholder publiseringsmåneden.

Vinterlagringsartikkelen har `showReadingTime: false` etter brukerens uttrykkelige ønske. Den viser forfatter og oppdatert dato, uten lesetid. De øvrige artiklene viser den beregnede lesetiden.

## Beregning

`scripts/build-article-reading-times.mjs` parser MDX med GFM-støtte og genererer `src/lib/knowledge/articleReading.generated.ts`. Beregningen kjøres før utviklingsserveren starter, ved produksjonsbygg og ved typekontroll. Ved redigering mens utviklingsserveren allerede kjører, kan tallene oppdateres med `pnpm run build:article-reading`.

Lesetid er `ceil(ord i artikkelinnholdet / 265)`, minimum ett minutt. Ord må inneholde minst én bokstav eller ett tall; tabellskilletegn og annen frittstående tegnsetting telles ikke.

Brødtekst, seksjonsoverskrifter, tabellinnhold, tommelfingerregler og artikkelens spørsmål/svar inngår. Header/ingress, brødsmuler, innholdsfortegnelse, læringsoversikt, AI-oppsummering, bilder/bildetekster, kildemarkører, referanseliste og anbefalte artikler inngår ikke. FAQ-svar teller også når leseren må åpne dem.

Kilder utelates både når de ligger i komponenter, egne seksjoner, `<details>` eller etter en Markdown-overskrift med «Kilder», «Referanser» eller «Referanseliste». Nye spesialblokker som ikke er artikkeltekst kan merkes `data-reading-exclude`.

Enhetstestene i `tests/article-reading-time.test.cjs` kontrollerer hastighet, avrunding, utelatelse av kilder og UI, tabeller og samsvar mellom alle registrerte artikler og genererte tall. Nettleserkontroll skal sammenligne genererte ordtall med faktisk gjengitt artikkelinnhold, inkludert åpnete FAQ-svar.

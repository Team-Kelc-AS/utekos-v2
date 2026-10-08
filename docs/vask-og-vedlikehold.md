# Vask og vedlikehold – migreringsgrunnlag

Migrert lokalt 7. oktober 2026 til `/handlehjelp/vask-og-vedlikehold`.

## Innhold og kilder

Kilden er `../utekos-headless/src/app/(store)/handlehjelp/vask-og-vedlikehold/page.mdx`
med tilhørende `layout.tsx`, sammenholdt med
[den offentlige siden](https://utekos.no/handlehjelp/vask-og-vedlikehold).
Den offentlige siden viste en eldre presentasjon; innholdet i søsterprosjektets
nåværende MDX er migreringsgrunnlaget.

- Fire generelle vedlikeholdssteg, egne råd for Dun/Mikrofiber/TechDown/Comfyrobe,
  impregneringsråd, fem spørsmål/svar og lenke til sortimentet er bevart.
- Temperaturer og materialråd er videreført fra kilden, uten nye produktpåstander.
  Vaskelappen for det konkrete plagget går fortsatt foran generell veiledning.
- Den opprinnelige innholdsdatoen 1. september 2026 er beholdt.
- Lenken til [teknologi og materialer](https://utekos.no/handlehjelp/teknologi-materialer)
  bruker dagens offentlige side, siden målruten ennå ikke finnes i v2.
- Det originale delingsbildet `og-image-utekos-produkter.jpg` er visuelt kontrollert
  og kopiert uendret i 1200 × 630. Filenes SHA-256 er identiske. Alt-teksten er rettet
  til to personer i mørkeblå plagg på en terrasse; det gamle bildet viser ikke et
  plagg som henger til tørk.

## Implementasjon

`page.mdx` bruker Markdown for overskrifter, avsnitt, lister og lenker. Felles
`TableOfContents`, `Callout`, `Details` og `Summary` kommer fra
`mdx-components.tsx`. Native spørsmål/svar trenger ikke JavaScript.
Seksjoner brukes bare til å bevare eksisterende ankerlenker og gi avstand.
Ingen side-CSS, nye avhengigheter eller egne klientkomponenter er lagt til.

`layout.tsx` eier brødsmuler, serverrendret ramme og metadata. Canonical, tittel,
beskrivelse og delingsbilde er videreført. URL-en er lagt til i footer og sitemap.
Den gamle sidens separate JSON-LD-modul er ikke flyttet; samme enkle oppdeling
som størrelsesguiden i v2 brukes. Ingen tracking er lagt til.

Felles MDX-stiler gir eksisterende Utekos-palett og Google Sans Flex med
`opsz: 120`, overskrifter i 800 og brødtekst i 500. Dette er kontrollert mot
fontkonfigurasjonen, Next.js-fontmetadata og nettleserens beregnede stiler.

Dokumentasjonen er hentet via Next Devtools og Utekos Docs
(`nextjs/guides/mdx`), og lest i installert Next.js 16.3.8:
`node_modules/next/dist/docs/01-app/02-guides/mdx.md`, metadata-, sitemap- og
fontreferansene. [Versjonens utgivelsesnotat](https://github.com/vercel/next.js/releases/tag/v16.3.8)
er kontrollert. Den eksisterende MDX-pipelinen beholdes.
`DOCS-SOURCES.md` ble ikke funnet i v2 eller roten av søsterprosjektet.

## Lokal verifikasjon

- Avgrenset ESLint og produksjonsbygg med TypeScript er bestått.
- Ruten inngår i bygget som delvis forhåndsrendret, sammen med butikkens felles ramme.
- HTTP 200, én H1, riktig canonical, unike ID-er og gyldige innholdslenker er kontrollert.
- Ingen horisontal overflyt ved 320, 390, 768 eller 1440 px.
- Ankeret `#dun` virker. Spørsmål/svar åpnes og lukkes med tastatur og fungerer
  i en egen nettleserkontekst med JavaScript deaktivert.
- Ingen konsollfeil. Den eksisterende footerens `IconWhite.svg` gir en Next.js-advarsel
  om CSS-bredde/-høyde; bildekomponenten er ikke endret i denne oppgaven.

Første separate TypeScript-kjøring fant at gamle byggruter og nye dev-ruter var
ute av synk. Et nytt produksjonsbygg regenererte rutetypene og bestod.
Ingen commit, push eller publisering er utført.

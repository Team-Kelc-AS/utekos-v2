# Hero på forsiden

Flyttet fra `../utekos-headless/src/components/frontpage/components/HeroSection/`
til `src/assets/components/frontpage/HeroSection.tsx`, brukt av `src/app/page.tsx`.
Undertittelen kommer fra headless-komponenten `TypographyH2.tsx`.

- Hero og bildevalg er serverkomponenter, beskyttet med `server-only`.
  Statisk innhold forhåndsrendres automatisk med eksisterende
  `cacheComponents: true`; ingen datahenting eller ekstra `use cache` trengs.
- `getImageProps` lager Next-optimaliserte bildekilder på serveren. Nettleseren
  velger én kilde via `picture`, med eager/high for Hero-bildet.
  `next/link` er den eneste klientkomponenten i Hero-treet; ingen egne hooks,
  hendelsesbehandlere eller animasjonsbiblioteker er lagt til.
- Originalfilene `TechDown_1.webp` (1080×1704), `Hero-iPad.webp` (1600×1067)
  og `TechDown_32.jpg` (2200×1467) er kopiert uendret. Bruddpunktene er
  fortsatt 640 og 1024 px. Bildenes egne forhold beholdes med bredde/høyde
  på kildene og `height: auto`, uten gammel beskjæring eller hover-zoom.
- Originalens mobilbilde inneholder wordmark og versaltekst i selve filen.
  Disse er bevart; levende tekst bruker setningskasus. Mobilvisningen beholder
  originalens skjulte overlay/CTA og undertittel.
- Ett H1-element: «Skreddersy varmen». Undertittelen er et avsnitt.
  Utekos-palett, Medium 500 og ExtraBold 800 er avgrenset til Heroen.
  Fontens faktiske WOFF2-fil er kontrollert: Google Sans Flex v4.005,
  STAT-navn «120pt» tilsvarer `opsz=120`, uavhengig av CSS-tekststørrelse.
- «Utforsk» peker foreløpig til den eksisterende `/produkter/varmeplagg`.
  Originalmålet `/skreddersy-varmen` er ikke migrert. Headless sin kanoniske
  `HeroInteract`-sporing er ikke migrert som del av denne visuelle seksjonen.
- Pilen har kun en CSS-effekt ved hover/fokus, deaktivert ved reduced motion.

Dokumentasjon kontrollert mot installert Next.js 16.3.8 i
`node_modules/next/dist/docs/` (server/client, caching, image og font),
Utekos Docs MCP og Vercel MCP. Offisielle kilder:
[server/client](https://nextjs.org/docs/app/getting-started/server-and-client-components),
[bilder/art direction](https://nextjs.org/docs/app/api-reference/components/image#art-direction),
[caching](https://nextjs.org/docs/app/getting-started/caching).

Lokalt kontrollert: ett H1, riktige bildekilder og ingen horisontal overflow
ved 320, 390, 639, 640, 768, 1024 og 1440 px. Visuelt kontrollert ved
390, 768 og 1440 px. Hero og tastaturnavigasjon via «Utforsk» fungerer
med JavaScript deaktivert. Reduced motion og synlig tastaturfokus er kontrollert.
Fokusert ESLint, `tsc --noEmit`, `pnpm build` og `git diff --check` passerte.
SHA-256 er identisk mellom alle tre kildefiler og kopiene.
Bygget har en eksisterende fontfallback-advarsel fra rotlayoutens separate
Google Sans Flex-oppsett. Nettleseren har en eksisterende dimensjonsadvarsel
for headerens `IconWhite.svg`, men ingen runtime-feil. Ikke publisert.

## Film under Hero

`HomeVideo.tsx` rendrer begge videoelementene på serveren. CSS velger desktop
fra 1024 px, ellers mobil/nettbrett. Begge vises i full bredde med sitt
originale sideforhold, uten avrunding eller beskjæring:

- Desktop: `857bdf220c614b7c89d78c7762b05833.mp4`, 1920×720,
  poster `/UtekosPoster-1920x720_2.webp`.
- Mobil: `424301d298594018bc0c33bc0fd21e96.mp4`, 1080×1920,
  poster `/Poster_1_1080x1920_2.webp`.

Filene leveres fra `https://cdn.shopify.com/videos/c/o/v/`. Dimensjonene er
verifisert via videoenes metadata; posterfilene er visuelt kontrollert.

`VideoPlayback.tsx` er den avgrensede klientkomponenten. En
[IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
starter den synlige filmen når minst 25 % vises og siden har blitt scrollet
ned. `preload="none"` og fravær av HTML-autoplay gjør at filmen venter på
denne hendelsen. Avspillingen starter lydløst med `playsInline`, pauses
utenfor synsfeltet eller når fanen skjules. Videoene har ingen synlige
avspillingskontroller eller tidsviser. Native `loop` starter filmen på nytt
umiddelbart ved slutten. Ved redusert
bevegelse, blokkert autoplay eller deaktivert JavaScript vises posteren.

Nettlesertester bekreftet riktige poster-/videopar, ingen MP4-forespørsler før
scrolling, kun riktig variants film under avspilling, pause utenfor
synsfeltet. Autoplay-blokkering er simulert og gir
ingen ubehandlet feil. En høy viewport der filmen allerede er synlig ved
innlasting starter heller ikke avspillingen før brukeren scroller.

# Utsatt lasting av videopostere

Utført lokalt 12. oktober 2026. Bestillingen gjelder de fire videoposterne som
ble lastet på forsiden før avspilling, samlet omtrent 806 KiB i den tidligere
produksjonsmålingen. Ingen publisering inngår i denne endringen.

## Plan og gjennomføring

1. Registrer posterforespørslene før endringen og kontroller gjeldende markup.
2. Utsett forsideposteren til riktig video nærmer seg synsfeltet. Behold
   serverrendret videomarkup, originalformat, scrollstyrt avspilling og loop.
3. Aktiver produktvideoposteren først når kunden trykker spill av. Behold
   produktbildet, avspillingsfeil, nytt forsøk og Escape/fokusretur.
4. Behold en responsiv posterfallback uten JavaScript.
5. Kontroller nettverk, responsivitet, avspilling og eksisterende sjekker.

Alle fem trinn er gjennomført.

## Implementasjon

`HomeVideo.tsx` sender posteradressen som et inaktivt `data-deferred-poster`,
ikke som `poster`. `VideoPlayback.tsx` aktiverer den innenfor 200 px av
synsfeltet. Den CSS-skjulte mobil-/desktopvarianten har ingen rendret boks
og får ingen poster. Observeren følger også med på senere viewportendringer.
Dette bruker den eksisterende klientgrensen; ingen ny pakke er lagt til.

Den eksisterende avspillingen krever fortsatt scrolling og minst 25 %
synlighet, og pauses utenfor synsfeltet, i skjult fane eller ved redusert
bevegelse. Poster aktiveres også når avspillingsobserveren treffer, slik at
den er tilgjengelig ved blokkert autoplay. En høy viewport kan legitimt laste
den synlige posteren ved innlasting; videoen venter fortsatt på scrolling.

En `noscript`-picture velger den originale desktopposteren fra 1024 px,
ellers mobilposteren. Videoelementene skjules i denne fallbacken. Målte
originaldimensjoner er 1920×720 og 1080×1920. Ingen filer, ratioer eller
produkt-/videokoblinger er endret.

`ProductCardVideo.tsx` setter poster direkte i klikkhåndtereren før
avspillingsforsøket. Dermed slipper skjulte produktvideoer å laste poster
før behov. Desktop-only-spilleren avviser også avspilling under 768 px.
Videokilder og fallbacklenker blir fortsatt rendret på serveren.
Sitemapens eksisterende video- og thumbnail-adresser er bevart.

## Verifisering

Førmålingen på lokal dev-forside, Chromium 390×844, registrerte alle fire:

- `/UtekosPoster-1920x720_2.webp`
- `/Poster_1_1080x1920_2.webp`
- `/videos/techdown-produkt.jpg`
- `/videos/techdown-detaljer.jpg`

De originale filene summerer til 824 053 byte. Det tidligere
produksjonstallet 825 340 byte inkluderer nettverksoverføring; dette er ulike
målegrunnlag og skal ikke presenteres som samme eksakte byteverdi.

Etter endringen, testet i både Chromium og WebKit:

- Ved 390, 768, 1023, 1024 og 1440 px, høyde 844 px: null forespørsler etter
  de fire posterne og ingen MP4-forespørsler før scrolling/samhandling.
- Nær videoen: bare riktig forsideposter lastes; produktposterne venter.
- Ved resize fra 390 til 1440 px: desktopposteren lastes når den blir relevant.
- Redusert bevegelse: valgt poster vises uten videoavspilling.
- JavaScript deaktivert ved 390 og 1440 px: én riktig originalposter vises.
- Høy viewport og simulert blokkert autoplay: riktig poster beholdes,
  uten avspilling før scrolling og uten ubehandlet avspillingsfeil.
- Produktvideo: poster lastes ved klikk; avbrutt medieforespørsel viser igjen
  produktbildet og mulighet for nytt forsøk.
- Faktisk mobil- og desktopvideo spiller fra eksisterende Shopify-kilde og
  pauses utenfor synsfeltet. Faktisk produktvideo starter ved klikk; Escape
  stopper den, viser produktbildet og returnerer fokus til spill av-knappen.
- Native loop, muted og fravær av synlige kontroller er bevart.
- Ingen ukontrollerte sidefeil i nettverks-/viewportscenarioene.

`pnpm run build`, TypeScript, fokusert ESLint og `git diff --check` bestod.
17 eksisterende tester for produktkort, native mobilgallerier, videometadata
og sitemap bestod. Byggets HTML er kontrollert: forsidevideoene har
data-attributtet og ingen aktiv poster; `noscript`-fallbacken er med.

Nettlesertestene brukte den allerede kjørende lokale dev-serveren. Dette er
lokal funksjons- og nettverksevidens pluss et bestått produksjonsbygg, ikke
verifisert deploy eller et nytt Lighthouse-/CrUX-resultat. Ingen bestemt
LCP-/scoreforbedring hevdes. Kjør ny produksjonsmåling etter eventuell deploy.

Rålogger, engangsskript og skjermbilder ligger i
`/tmp/utekos-deferred-posters/`. Eksisterende lokale endringer er bevart.

## Dokumentasjon

Next.js 16.3.8 ble kontrollert mot installert `guides/videos.md`, Next DevTools
MCP, Utekos Docs MCP og Context7. MDN MCP bekreftet at native video-lazy-lasting
omfatter poster, men mangler Safari-/Firefox-støtte; derfor brukes
IntersectionObserver fremfor å være avhengig av `loading="lazy"`.

- [Next.js video](https://nextjs.org/docs/app/guides/videos)
- [MDN video-attributter](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video)
- [MDN Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

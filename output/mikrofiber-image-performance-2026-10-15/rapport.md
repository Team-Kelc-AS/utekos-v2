# Mikrofiber – bildeytelse, 15. oktober 2026

**Anbefalt utgangspunkt for dette bildet og dette galleriet: 1200 × 1500 levert til desktop ved 2×, rundt 114–135 kB WebP (kvalitet 60–75).** Behold en større, god original som kilde. Den minste filen er rask, men har bare 640 × 800 piksler og gir ikke full detaljoppløsning ved cirka 600 CSS-piksler på en 2×-skjerm. Dette er et målt kompromiss for disse bildene, ikke en universell filstørrelsesgrense.

Målt på lokal produksjonsbygging av Next.js 16.4.0, på Fjellblå / Large. Ingen publisering. 49 fullførte sideinnlastinger er med i tabellene, normalt tre per alternativ. Én direkte PNG-kontroll. To innledende optimaliseringsmålinger i en avbrutt pilot er utelatt.

## Metode og avgrensning

- Playwright/Chromium, desktop 1440 × 1000 og iPad 820 × 1180, begge med DPR 2. CDP konfigurert til 1,6 Mbit/s ned, 0,75 Mbit/s opp, 150 ms latency og 4× CPU-brems. Observert lokal TTFB var ofte 12–40 ms; oppsettet skal derfor ikke tolkes som en nøyaktig simulering av en bestemt mobiloperatørs RTT.
- Ny nettleserkontekst og deaktivert nettlesercache hver gang. Første bildeoptimalisering hadde MISS, senere HIT. Medianer begrenser påvirkningen av første server-/cacheoppvarming. Kjørerekkefølgen roteres etter første runde, som startet med letteste fil.
- Samme reelle produktside, layout, HTML, CSS og JavaScript. Nettlesertesten omdirigerte kun forespørselen for første desktop-galleribilde til testfilen. Det nye bildet ble vist og skjermbilder lagret. Ingen permanent endring av bildevalget i galleriet. Alt-tekst/currentSrc i råmålingene refererer derfor til baseline; kandidat og respons-URL viser faktisk levert fil.
- Alle nye filer er 4:5. Ingen beskjæring, padding, strekking eller endring av ratio. Mobilgalleriet med 2:3-kilder er ikke erstattet.
- Tredjepartsforespørsler og de eksplisitte lokale måle-/annonseringsendepunktene er blokkert likt i alle runder for å unngå syntetiske annonsehendelser. Dette inkluderer blokkerte Klarna-skript; resultatene er ikke en måling av komplett tredjepartsopplevelse.
- HTTP/1.1 lokalt, ikke produksjonens CDN/HTTP/2/3. LCP er observert via PerformanceObserver og var hovedbildet i alle sammenlignede runder. CLS bruker sesjonsvinduer. load er window-load, ikke tidspunktet da all senere forhåndslasting er ferdig.
- TTFB, FCP, LCP, CLS, ressursstørrelser/-tider og lange hovedtrådoppgaver er lagret i JSON. Blokkeringstid er summen over 50 ms for lange oppgaver etter FCP i observasjonsvinduet, **ikke Lighthouse TBT**. Syntetisk åpne/lukke størrelsesguide gir event-varighet, **ikke feltmålt INP**. Ingen CrUX-konklusjon.

## Lett mot tung original, vanlig Next.js-levering

| Bilde / levering | n | Overført kB | LCP s | FCP s | load s | CLS |
|---|---:|---:|---:|---:|---:|---:|
| TEST_2.webp (lettest) | 3 | 69.3 | 2.57 | 1.20 | 5.16 | 0.0026 |
| Camping_1.png | 3 | 163.0 | 4.82 | 1.20 | 5.45 | 0.0026 |
| Camping_2.png | 3 | 159.4 | 4.78 | 1.17 | 5.44 | 0.0026 |
| Camping_TEST.jpg | 3 | 164.1 | 4.87 | 1.17 | 5.44 | 0.0026 |
| Camping_2.png uten optimalisering | 1 | 4111.8 | 28.42 | 1.20 | 28.41 | 0.0026 |

Felles filprefiks: 'UtekosMikrofiber_Fjellbla_1440x1800_'. Lettfilen 'Camping_TEST_2.webp' er faktisk 640 × 800, til tross for filnavnet. PNG-ene er 4,06 og 4,11 MB; den tunge JPEG-filen er 1,91 MB. 'Camping_TEST_2.png' er byte-identisk med 'Camping_2.png' og ble ikke telt som en tredje selvstendig PNG.

Next.js standard WebP/kvalitet 75 reduserer de tunge originalene til rundt 159–164 kB. Originalstørrelsen er dermed **ikke** størrelsen kunden laster ned. Uten optimalisering tok den 4,11 MB store PNG-en 28,42 s til LCP i én kontroll. Med optimalisering var medianen 4,78 s.

## Forsøk på forbedring

| Bilde / levering | n | Overført kB | LCP s | FCP s | load s | CLS |
|---|---:|---:|---:|---:|---:|---:|
| Camping_2.png → Next 1200 / WebP 75 | 3 | 135.2 | 4.17 | 1.17 | 5.40 | 0.0026 |
| Camping_2.png → Next 1080 / WebP 75 | 3 | 121.4 | 3.80 | 1.18 | 5.36 | 0.0026 |
| 1200 × 1500 WebP 60, direkte | 3 | 113.8 | 3.64 | 1.17 | 5.39 | 0.0026 |
| 1200 × 1500 WebP 75, direkte | 3 | 135.2 | 4.14 | 1.18 | 5.42 | 0.0026 |
| 1200 × 1500 WebP 85, direkte | 3 | 196.3 | 5.75 | 1.18 | 5.74 | 0.0026 |
| 1200 × 1500 AVIF 50, direkte | 3 | 87.0 | 2.98 | 1.17 | 5.29 | 0.0026 |
| Next 1200 / WebP 75 + utsatt sekundærlasting | 3 | 135.2 | 3.53 | 1.19 | 3.52 | 0.0026 |

- 1200w reduserer Camping_2 fra 159,4 til 135,2 kB (15,2 %). LCP gikk fra 4,78 til 4,17 s. 1080w er litt raskere, men under full 2×-dekning av galleriet på cirka 599 CSS-piksler.
- Samme 1200 × 1500-komposisjon med WebP 60/75/85 isolerer komprimeringsvalget. Q85 krever 45 % flere byte enn Q75, med LCP 5,75 mot 4,14 s. WebP 60 gir 113,8 kB og 3,64 s. Visuell stikkprøve av Q60/Q75 og den viste AVIF-versjonen er gjort; dette er ikke en blind kvalitetstest.
- Forhåndskodet AVIF 50 ga 87,0 kB og LCP 2,98 s med 1200 × 1500 piksler. Det er et lovende alternativ, men testen måler direkte levering av ferdig AVIF, ikke kald AVIF-koding i Next.js. Formatinnstillingen er ikke endret globalt. Den lokale engangskodingen tok omtrent 946 ms, mot rundt 141 ms for WebP 75 i genereringsforsøket; dette er diagnostikk fra én kjøring, ikke serverbenchmark.
- Sekundære bilder og RSC-prefetch konkurrerte med hovedbildet. Et eksperiment som ventet med dem til hovedbildet var nedlastet ga 3,53 s LCP med den samme 135,2 kB-filen. Dette er ikke implementert i applikasjonen. load blir også tidligere fordi sekundærtrafikken da havner senere i livsløpet; det betyr ikke at all trafikk forsvinner.

Nettverksloggen viste blant annet font cirka 89 kB, Judge.me-logo cirka 63 kB, fargeark cirka 73 kB, JavaScript og relaterte produktbilder under oppstart. For Camping_2 var hovedbildets ressurslastetid rundt 4,4 s, mens tiden fra ferdig nedlasting til LCP var omtrent 30 ms. **Nedlasting og ressurskonkurranse dominerte; bildevisning/dekoding etter nedlasting var liten i denne testen.** At load bare endret seg fra cirka 5,44 til 5,16 s mellom tungt og lett bilde, mens LCP flyttet seg over to sekunder, viser hvorfor de to målene ikke bør blandes.

## iPad-kontroll

| Bilde / levering | n | Overført kB | LCP s | FCP s | load s | CLS |
|---|---:|---:|---:|---:|---:|---:|
| TEST_2.webp (lettest) | 3 | 69.3 | 2.58 | 1.21 | 4.92 | 0.0052 |
| Camping_2.png | 3 | 91.5 | 3.11 | 1.18 | 5.05 | 0.0052 |

Ved 820 px er galleriet cirka 383 CSS-piksler bredt, og Next.js velger 828w. PNG-en blir dermed 91,5 kB allerede. Forskjellen til lettfilens 69,3 kB og 640-pikslers kilde er langt mindre enn på desktop. CLS-medianen er 0,0052, men én lettfil-runde fikk 0,1257. Det er ikke dokumentert en systematisk CLS-effekt av bildevalget; font-/layouttiming varierer. Desktop-medianen er 0,0026, med enkelte førsteinnlastinger på 0,0392.

## Implementert og kontrollert

'src/assets/components/product/ProductGallery.tsx': endret desktop-'sizes' fra 620 til 600 px ved skjermbredde ≥1280 px. Galleriet er rundt 600 px bredt. På DPR 2 velges nå 1200w i stedet for 1920w. Dette endrer kildevalget i den delte komponenten, ikke CSS-størrelsen eller bildeantallet. Mobil og iPad-grenene er uendret.

Målt på det **eksisterende** Shopify-bildet uten testomdirigering etter ny produksjonsbygging:

| Bilde / levering | n | Overført kB | LCP s | FCP s | load s | CLS |
|---|---:|---:|---:|---:|---:|---:|
| Eksisterende Shopify-bilde | 3 | 243.9 | 6.94 | 1.18 | 7.23 | 0.0026 |
| Eksisterende Shopify-bilde | 3 | 196.0 | 5.72 | 1.17 | 5.71 | 0.0026 |

Før/etter: 243,9 → 196,0 kB (19,6 % mindre). LCP 6,94 → 5,72 s (17,6 % bedre) i samme labprofil. Disse tallene gjelder det eksisterende bildet, ikke den nye Camping_2-komposisjonen. Syntetiske størrelsesguide-klikk ga 80 ms i median før og 72 ms etter; dette lille utvalget dokumenterer ikke en systematisk interaksjonsforbedring. Ingen påstand om felt-INP.

Produksjonsbygging, TypeScript-trinnet i byggingen, rutekontroll, fokusert ESLint, ti eksisterende galleritester og fokusert diff-check bestått. Responsiv kildekontroll lagret i 'final-responsive-check.json'. Originalbildene er urørt, midlertidige testfiler er fjernet fra public, og testserveren er stoppet. Ingen commit, push eller deploy.

## Praktisk valg

1. Bruk en god 1440 × 1800-original som kilde og la responsive varianter styre nedlastingen. Ikke velg originalfil utelukkende etter MB.
2. For dette desktop-galleriet: sikt på **1200 × 1500 levert**, WebP rundt **114–135 kB**, kvalitet **60–75**. Q75 er det konservative utgangspunktet; Q60 er et alternativ når lavere vekt prioriteres og detaljene godkjennes visuelt.
3. Den 640 × 800-store lettfilen er ikke mitt førstevalg som eneste desktop-master på 2×-skjermer. Den er raskest, men har bare omtrent én bildepiksel per CSS-piksel i dette galleriet.
4. AVIF-testen viser at 1200-pikslers detaljoppløsning kan komme nær lettfilens ytelse. Den ferdige AVIF-kandidaten og WebP-kandidatene ligger ved rapporten. Ingen format er automatisk publisert eller valgt som nytt permanent produktbilde.

Kilder: [Google om LCP-delene og ressurskonkurranse](https://web.dev/articles/optimize-lcp), [Web Vitals og lab/felt](https://web.dev/articles/vitals), samt installert Next.js 16.4.0-dokumentasjon under 'node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md' (sizes, formats, qualities, preload og cache). [Next.js Image-dokumentasjon](https://nextjs.org/docs/app/api-reference/components/image).

Råmålinger: 'runs-*.json'. Samlet tabell: 'summary.csv' og 'summary.json'. Komprimeringsmatrise: 'encoding-grid.json'. Skjermbilder og bildekandidater ligger i samme mappe. Testskript: 'measure.cjs'. Den avbrutte piloten 'runs-desktop-1792059508474.json' er bevart, men ekskludert fra tabellene; den stoppet fordi nyopprettede public-filer krevde omstart av produksjonsserveren. Et ekstra kald-cache-probeforsøk med kilde-query returnerte ikke et dekodbart bilde og er ikke brukt som evidens. Reproduksjon av den historiske baseline krever 620px-sizes og midlertidig tilgjengeliggjøring av direkte bildekandidater; dagens kode har den verifiserte 600px-endringen.

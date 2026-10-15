# Hvorfor tok det lille Mikrofiber-bildet 2,57 sekunder?

Undersøkt 15. oktober 2026. **2,57 s er marginalt over grensen for god LCP, men den lokale målingen klassifiserer ikke produksjonssiden.** Google bruker ≤2,5 s for god, >2,5–4 s for trenger forbedring og >4 s for dårlig. Vurderingen skal gjelde 75-persentilen av faktiske besøk, separat for mobil og desktop. Den tidligere verdien er medianen av tre lokale labkjøringer på et kunstig begrenset nettverk.

## Den konkrete 2,568-sekunderskjøringen

Fra `../mikrofiber-image-performance-2026-10-15/runs-desktop-1792059414913.json`, light / repeat 1:

| Del | Tid |
|---|---:|
| HTML TTFB | 13,5 ms |
| Fra TTFB til hovedbildets ressursforespørsel starter | 351,1 ms |
| Hovedbildets ressurslastetid, inkludert kø/forespørsel | 2167,8 ms |
| Fra nedlasting ferdig til bildet vises som LCP | 35,6 ms |
| Sum | 2568,0 ms |

Innenfor ressurslastetiden var omtrent 202 ms før requestStart, 1,2 ms fra requestStart til responseStart, og 1964,6 ms fra responseStart til responseEnd. Hovedbildet var 69 294 byte. Det er ikke tung bildevisning etter nedlasting som forklarer forsinkelsen. En 69 kB-fil trenger teoretisk omtrent 0,35 s med hele 1,6 Mbit/s-forbindelsen alene; her deles forbindelsen med mye annet, med protokoll-, kø- og testoverhead i tillegg.

## Ressurser og kode

Forespørsler som startet før LCP i den kjøringen omfattet 236 kB JavaScript (15 filer), 89 kB font, 43 kB CSS og 264 kB andre bilder, i tillegg til hovedbildet. Disse tallene er hele responsstørrelser for forespørslene, ikke et påstått antall byte ferdig overført før LCP.

- Hovedbildet har allerede `loading="eager"` og `fetchPriority="high"`. Problemet skyldes ikke at det er markert lazy.
- Google Sans Flex-filens preload konkurrerer om båndbredde. Den er rundt 89 kB, med display swap og 120pt-varianten bakt inn. Ingen font eller merkevarevalg er endret.
- Judge.me-logoen er 83 748 byte på disk, rundt 63 kB overført, men vises bare 7rem bredt. SVG-en inneholder to innebygde PNG-bilder, så den er ikke en lett ren vektorlogo.
- Fargearket på baksiden av relaterte produktkort lastes som uoptimalisert PNG, cirka 73 kB. Baksiden er rotert og inert, men bildet finnes i DOM. Dette forklarer at en visuelt skjult bakside likevel kan lastes.
- Relaterte produktbilder starter også før hovedbildet er ferdig. Native lazy loading laster nær skjermen, ikke bare det som allerede er synlig.
- **Korreksjon av en mulig overgeneralisering fra første rapport:** RSC-prefetch av andre sider startet rundt 3,54 s, etter 2,57 s LCP. Det er ikke årsaken til akkurat denne LCP-verdien, selv om prefetch kan konkurrere i langsommere bildescenarier.

## Kontrollerte forsøk

Samme produksjonsbygging og Fjellblå/Large-side. Samme lette bilde og 69 294 leverte byte i alle light-forsøk. 1440 × 1000, DPR 2, nettlesercache av, tredjeparts- og måletrafikk blokkert likt. Standardprofil: CDP 1,6 Mbit/s ned, 150 ms konfigurert latency, 4× CPU. Lokal navigasjons-TTFB viser at profilen ikke gjengir en virkelig mobiloperatørs RTT nøyaktig. Hver kandidat i JSON oppgir overstyring av standardprofilen. HTTP/1.1 lokalt, ingen simulering av produksjons-CDN/HTTP/2/3.

| Kontroll | n | LCP median | Spenn | CLS median |
|---|---:|---:|---:|---:|
| Lett bilde, opprinnelig struping | 3 | 2.62 s | 2.56–2.64 s | 0.0026 |
| Sekundære bilder / prefetch utsatt | 3 | 2.59 s | 2.59–2.59 s | 0.0026 |
| Font utsatt til bildet er lastet | 3 | 2.27 s | 2.25–2.28 s | 0.0027 |
| Font og sekundærtrafikk utsatt | 3 | 2.30 s | 2.30–2.32 s | 0.0026 |
| Samme nettverk, uten CPU-brems | 3 | 2.54 s | 2.54–2.62 s | 0.0026 |
| JavaScript utsatt til bildet er lastet | 3 | 2.19 s | 2.11–2.36 s | 0.0026 |
| Font, JavaScript og sekundærtrafikk utsatt | 3 | 1.42 s | 1.42–1.44 s | 0.0027 |
| Lett bilde, uten nettverks-/CPU-struping | 6 | 0.41 s | 0.08–0.46 s | 0.6106 |
| Ordinært produktbilde, uten struping | 3 | 0.62 s | 0.48–0.78 s | 0.6106 |

30 nye sideinnlastinger totalt. Font-/JS-forsøkene holder forespørsler tilbake til hovedbildets respons er ferdig. De er diagnostiske inngrep, ikke implementerte forbedringer eller ferdig validerte leveringsstrategier. De kan flytte andre kostnader til senere og forsinke interaktivitet. Bilde, layout og funksjonalitet må vurderes samlet før en reell endring.

**Tolkning:**

- Å fjerne CPU-bremsen gir liten endring når nettverket fortsatt er strupet. Det støtter at nedlasting veier tyngre enn prosessorkraft i denne situasjonen.
- Utsatt fontlasting gir rundt 0,36 s lavere LCP enn den nye baselinens 2,62 s. Utsatt JavaScript gir rundt 0,44 s lavere median, men spennet er større.
- Å utsette bare sekundære bilder/prefetch gir liten effekt for dette lille bildet. Man bør derfor ikke love en stor LCP-forbedring fra dette tiltaket alene.
- Samlet utsettelse gir 1,42 s LCP, rundt 46 % lavere enn den nye baselinen. Samspill og rekkefølge betyr mye; enkeltgevinstene skal ikke summeres som uavhengige effekter.
- Uten kunstig struping har den lokale siden median 0,41 s med testbildet og 0,62 s med det ordinære produktbildet. Dette er ikke forventet lastetid på internett; det viser hvor sterkt testprofilen påvirker resultatet.

## Separat, reproduserbart CLS-funn

På rask forbindelse ble median CLS **0,6106**. Dette ble bekreftet i alle tre kontroller med det ordinære produktbildet, uten bildeomdirigering. Google regner >0,25 som dårlig.

PerformanceObserver peker konkret på FOOTER: den starter ved y=392 og fyller de nederste 608 pikslene av skjermen, før den flyttes helt ut av skjermen. Denne flyttingen bidrar med 0,608 alene. Koden i `src/app/(storefront)/produkter/[handle]/page.tsx` har et ytre Suspense med `ProductFallback`, der main kun har `min-h-64`. Plassholderen reserverer ikke omtrent samme plass som ferdig produktside. Samsvaret mellom synlig fallback, footerens posisjon og koden peker på denne overgangen som årsak. En mindre flytting på 0,00257 følger senere. Den strupede testen skjuler i stor grad den store overgangen fordi første tegning skjer senere.

Dette viser også at det var for snevert å omtale lav CLS fra én langsom profil som et generelt stabilitetsresultat.

## Prioriterte videre tiltak

1. Reserver realistisk høyde/geometri i produktets fallback, og kontroller både rask og langsom lasting. Det dokumenterte layout-hoppet bør rettes.
2. Reduser JavaScript som må overføres før hovedinnholdet. Kartlegg de 15 filene før konkret splitting. Størrelsesguiden importerer dialog/tabell direkte; den er en kandidat for behovsstyrt lasting, ikke en dokumentert individuell hovedsynder. Søkedialog og handlekurvskuff har allerede betinget lazy loading.
3. Optimaliser fontlevering innen samme Google Sans Flex 120pt-identitet, med kontroll av tekstvisning og layoutskift. Utsettelse i testen er ikke i seg selv en anbefaling om å forsinke all merkevaretypografi.
4. Gjør Judge.me-logoen lettere og last skjulte fargeark ved behov. Dette er påviste unødvendig store/for tidlige ressurser, men den lille bilde-testen dokumenterer ikke stor gevinst fra dem alene.
5. Verifiser produksjon med p75-feltdata og reell CDN-levering før siden klassifiseres som god/dårlig for besøkende. Det er fortsatt ikke gjort her.

Ingen ny applikasjonskode, font, logo, produktbilder eller produksjonsinnstillinger er endret i denne undersøkelsen. Testartefakter ligger i denne mappen. Den tidligere sizes-endringen er beholdt. Den midlertidige testserveren er stoppet ved levering.

Kilder: [LCP og terskler](https://web.dev/articles/lcp), [LCP-delene](https://web.dev/articles/optimize-lcp), [lab versus felt](https://web.dev/articles/lab-and-field-data-differences), [CLS og terskler](https://web.dev/articles/cls), [native lazy loading](https://web.dev/articles/browser-level-image-lazy-loading), samt installert Next.js 16.4.0-dokumentasjon om lazy loading. Rådata: `runs-*.json`, sammendrag: `summary.json`, testskript: `measure.cjs`.

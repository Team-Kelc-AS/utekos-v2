# Designformat og overgang til app

## Implementert grunnlag

Studioet bruker `konva@10.9.1` og `react-konva@19.2.7`. React-bindingen er låst til en versjon som støtter prosjektets React 19.2; 19.3-serien krever React 19.3.

`src/lib/studio/document.ts` er den felles modellen, valideringen, geometrien og angre/gjør om-logikken. Den bruker JavaScript og Zod, uten React, Konva, DOM, nettleserlagring eller nettverkskall. En native klient kan benytte denne delen direkte. Modellen har egne tester som kjører uten nettleserglobals.

`StudioCanvas.tsx` oversetter modellen til Konva. Visningsbredden påvirker bare forhåndsvisningen. Kortet lagres i faste designenheter, og PNG eksporteres ved to piksler per designenhet, uavhengig av skjermbredde. Et standardkort på 1200 × 900 gir PNG på 2400 × 1800. Redigeringshåndtak ligger på et eget lag og inngår aldri i eksporten.

## Versjon 2 og migrering fra versjon 1

Nye designfiler identifiseres av `format: "utekos-design"` og `version: 2`. Versjon 1 åpnes gjennom en eksplisitt migrering: tekst får `align: "left"` og `verticalAlign: "top"`, mens innhold, bilder, plassering og dimensjoner beholdes. Det samme gjelder gamle IndexedDB-utkast. Ukjente versjoner og felt avvises; de blir ikke fjernet eller tolket som den gjeldende versjonen.

| Felt | Betydning |
| --- | --- |
| `width`, `height` | Kortets faste størrelse i designenheter |
| `background` | sRGB-farge som seks tegn med `#` |
| `elements` | Tegnerekkefølge, bakerst først. Hvert element har stabil ID, navn, type og geometri |
| `assets` | Originale PNG-, JPEG- eller WebP-bilder, inkludert i filen som MIME-type, base64 og dekodede dimensjoner |

Elementer har `x`, `y`, `width`, `height` og `rotation`. Origo er kortets øvre venstre hjørne, positiv Y går nedover og positiv rotasjon følger klokken rundt elementets øvre venstre hjørne. Elementer kan plasseres utenfor kortet og beholdes der i utkast og designfiler. Posisjoner er begrenset til ±8192 designenheter og dimensjoner til 4096; ingen automatisk tilpasning til kortets kant utføres.

- `text`: tekst, semantisk font-ID `utekos-sans`, vekt 500 eller 800, skriftstørrelse og farge. `align` er `left`, `center` eller `right`; `verticalAlign` er `top`, `middle` eller `bottom`. Teksten har ordombryting, linjehøyde 1,35 og null innvendig polstring. Ved størrelsesendring oppdateres boksens dimensjoner på hvert pekersteg, mens skriftstørrelse og tekstskalering beholdes. «Tilpass boksen til teksten» måler teksten med den lastede fonten og reduserer overflødig plass rundt innholdet.
- `rect`: farge og hjørneradius.
- `image`: referanse til originalbildet og relativ lysstyrke fra −1 til 1; 0 er uendret, og rendererens lysstyrkefaktor er `1 + brightness`. Sideforholdet følger originalbildet, også ved størrelsesendring. Ingen automatisk beskjæring eller strekk utføres. Bildedekoderen må respektere eventuell innebygd orientering.

`utekos-sans` tilsvarer prosjektets originale Google Sans Flex 120pt-variant, med Medium og ExtraBold. En annen renderer må laste de samme fontfilene og følge samme tekstregler. Det er ikke en instruksjon om tekststørrelse på 120 pt.

Ingen Konva-JSON, HTML, hendelsesfunksjoner, `blob:`-adresser eller midlertidige filstier lagres. Bilder er med i designfilen, så den kan åpnes uten opprinnelig nettleserlagring eller ekstern bildevert.

## Arbeidsflate og eksport

Konva-flaten dekker hele den prikkede arbeidsflaten, også området utenfor kortet. Kortet vises sentrert med en kant. Objekter tegnes og kan velges og flyttes på begge sider av kanten. PNG eksporteres fortsatt i kortets faste utsnitt: delene utenfor kortet blir ikke med i PNG, men beholdes i designfilen. Kortkant og håndtak er bare redigeringsgrafikk og eksporteres ikke.

Grensene i første format er 40 elementer, 24 MB designfil, 4 MB per bilde ved opplasting, maksimalt 24 megapiksler og 12 000 piksler per bildeside. Elementreferanser, ID-er, geometri og bildeproporsjoner valideres.

## Plattformgrenser

`src/lib/studio/platform.ts` definerer to porter:

- `StudioPersistence.load/save`: leser og skriver den versjonerte designfilen asynkront.
- `StudioFileDelivery.saveFile`: mottar filens bytes, MIME-type og filnavn.

Nettadapterne ligger i `browserPlatform.ts`. Utkast lagres i IndexedDB på den aktuelle enheten og origin. En designfil kan lastes ned og åpnes på en annen enhet. PNG bruker systemdeling der den støttes, ellers nedlasting. Avbrutt systemdeling regnes som brukerens avbrudd. Andre feil vises.

Lagring skjer i rekkefølge og starter først etter gjenåpning av utkastet. Et ugyldig utkast blokkerer automatisk overskriving. Lagringsfeil vises; brukeren kan ta vare på arbeidet ved å laste ned designfilen. Ingen sky-synkronisering, kundekonto eller produksjonsdatabase er koblet til.

## Faktisk vei til app

1. En app med WebView kan videreføre denne webeditoren. Appens filhåndtering og lagring kan kobles til portene gjennom en eksplisitt plattformbro. Broen og appskallet er ikke implementert i dette steget.
2. En helt native editor kan videreføre designformatet, valideringen og redigeringslogikken. Konva og React DOM-komponentene må da erstattes med en native renderer og native kontroller. Dette er ikke en automatisk konvertering.
3. Innlogging og synkronisering kan senere kobles til den samme dokumentkontrakten. Eksisterende filer skal migreres eksplisitt dersom kontrakten endres.

Denne avgrensningen gjør at kundens design og originalbilder kan følge med videre. Det er ikke dokumentasjon på ferdige iOS-/Android-apper eller identisk tekstgjengivelse i en renderer som ennå ikke er utviklet.

## Verifisering

```sh
node --test tests/studio-document.test.cjs
pnpm typecheck
pnpm build
pnpm exec next start --port 3100
node scripts/performance/check-studio.mjs http://localhost:3100
node scripts/performance/check-studio-workspace.mjs http://localhost:3100
```

Nettleserkontrollen dekker desktop og 390 px mobilbredde, touch-flytting og håndtak, tekst, figurer, bilder, angre/gjør om, IndexedDB-gjenåpning, ugyldige filer, bevaring av ugyldige utkast og import i en ny nettleserkontekst. Den sammenligner eksporterte PNG-er med og uten markering og på tvers av skjermbredder. Filer og rapport lagres i `outputs/design-studio-konva-qa/`.

Kontroll 9. november 2026: de fire modelltestene, ESLint, typekontroll, peer-avhengigheter, ordinær `pnpm build` (117 genereringstrinn og 28 interne MDX-lenker) og nettleserkontrollen mot det lokale produksjonsbygget besto. Ingen butikkbunter eller tredjepartsforespørsler ble lastet av studioet i kontrollen. PNG var identisk med og uten markering og på tvers av 1440 og 390 px visningsbredde. Rapporten ligger i `outputs/design-studio-konva-qa/report.json`.

Fysisk iPhone-/Android-testing, systemdeling, native appbro og distribusjon i appbutikk er fortsatt egne kontroller. Etter lokal kontroll publiseres det avtalte scopet til preview og kontrolleres der etter [felles deployflyt](deployment.md). Produksjon er et separat steg.

Arbeidsflatekontrollen lagt til 10. november 2026 dekker faktiske muse- og touchbevegelser. Den måler tekstskalering på hvert pekersteg og dimensjoner før og etter slipp, også ved rotert tekst. Den undersøker eksporterte bokstavpiksler for horisontal og vertikal justering, tilpasning av tekstboksen, flytting utenfor alle fire kortkanter, valg og gjenåpning av disse objektene, eksportens utsnitt samt migrering av versjon 1-filer og IndexedDB-utkast. Rapport og skjermbilder lagres i angitt output-mappe, som andre CLI-argument.

Kilder: [Konva React](https://konvajs.org/docs/react/index.html), [lagring av applikasjonstilstand](https://konvajs.org/docs/data_and_serialization/Best_Practices.html), [transformasjon](https://konvajs.org/docs/react/Transformer.html), [canvas-eksport](https://konvajs.org/docs/react/Canvas_Export.html).

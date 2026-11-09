# Designstudio med separate root layouts

Studioet kjører på `/design` i samme Next.js-app og Vercel-prosjekt som nettbutikken. Start fra prosjektroten med `pnpm dev` og åpne `http://localhost:3000/design`. Det trengs én utviklingsserver.

- `src/app/(site)/layout.tsx` beholder butikkens font, stilark, metadata, JSON-LD, header, footer, sporing og Klarna-komponenter.
- `src/app/(site)/` samler de eksisterende sidegruppene og forsiden uten å endre deres URL-er.
- `src/app/(studio)/layout.tsx` har et eget HTML-dokument med delt font og et avgrenset stilark. Ruten ligger i `(studio)/design/page.tsx`.
- `src/app/brand-tokens.css` gir de to layoutene et felles sett med fargetokens. Studioets Tailwind-kilde er begrenset til studio-komponentene.
- `/design` og underliggende stier er ekskludert fra butikkens proxy-matchere. Øvrige proxy-regler beholdes.
- `FreeformStudio` ligger i `src/assets/components/studio/`. `modern-screenshot` lastes dynamisk ved eksport.

Navigasjon mellom root layouts starter et nytt dokument. Tilbake-lenken bruker derfor en vanlig lenke. Global 404 og felles API-er ligger fortsatt utenfor sidegruppene. Ingen PWA eller native app er opprettet.

Det tidligere lokale multi-zone-oppsettet og omskrivingene til port 3001 er avviklet. Den tidligere appmappen ble bevart i den lokale midlertidige sikkerhetskopien som ble tatt før migreringen.

## Dokumentasjon

- [Next.js Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Root layouts](https://nextjs.org/docs/app/api-reference/file-conventions/layout#root-layout)
- [Global 404](https://nextjs.org/docs/app/api-reference/file-conventions/not-found#global-not-foundjs-experimental)
- [CSS chunking](https://nextjs.org/docs/app/api-reference/config/next-config-js/cssChunking)

## Kontroll og måling

`pnpm typecheck` og ESLint for de endrede layoutene, komponenten og proxyen kontrollerer kildekoden. Alle 101 eksisterende side- og endepunktfiler ble bevart ved flyttingen; `/design` ble lagt til.

For nettleserkontroll av et lokalt produksjonsbygg:

```sh
pnpm exec next start --port 3100
node scripts/performance/check-studio.mjs http://localhost:3100
```

Skriptet lagrer rapport, PNG-eksport og skjermbilder i `outputs/design-studio-qa/`. Det kontrollerer tekstredigering, temavalg, tastaturflytting, eksport, mobilbredde og overganger mellom butikk og studio. Det måler faktiske lastede filer og kontrollerer at butikkens klientbunter ikke lastes. Nexts klientmanifest inneholder også tilgjengelige referanser fra global 404; en slik referanse er ikke i seg selv en nedlastet fil. Gzip-størrelser i rapporten er estimater fra dekodede responser, ikke målt trafikk i produksjon.

Måling fra testbygget 8. november 2026 (desimal kB):

| Del | Størrelse |
| --- | --- |
| Initial JavaScript, inkludert Next.js og React | 170,3 kB gzip-estimat |
| Studioets egen klientbunt, inkludert i totalen | 4,2 kB gzip-estimat |
| Initial CSS, tre filer | 5,1 kB gzip-estimat |
| Eksportør, lastet etter eksportklikk | 9,2 kB gzip-estimat |
| Google Sans Flex 120pt Latin, én WOFF2 | 61,7 kB filstørrelse |

Ingen av sporingsbuntene som var listet i global-404-referansene ble lastet av studioet, og studioet gjorde ingen tredjepartsforespørsler i testen. Proxyens genererte stiregler matchet ikke `/design` eller `/design/test`, men matchet fortsatt `/produkter` og `/designer`.

## Begrensninger ved kontrollen 8. november 2026

Ved første kontroll stoppet `pnpm build` i kontrollen av utdaterte, lagrede AI-oppsummeringer. En direkte Next.js-bygging med oppsummeringer aktivert stoppet også ved prerendering av `glamping-i-norge` av samme grunn.

De opprinnelige layoutmålingene ble derfor gjort på et lokalt testbygg med `NEXT_PUBLIC_AI_SUMMARY_ENABLED=false pnpm exec next build`. Overstyringen gjaldt kun testkommandoen; miljøfilene ble ikke endret.

Senere samme dag ble oppsummeringene for julegaveartikkelen, Glamping i Norge og HydroGuard™ oppdatert redaksjonelt mot gjeldende kilder og bundet til deres nye kildeversjoner. De ni øvrige oppsummeringene ble bevart. Etter dette besto ordinær `pnpm build` med oppsummeringer aktivert, alle 117 genereringstrinn og MDX-rutekontrollen. Alle 28 AI-oppsummeringstester besto. Valideringskravene og byggsperrene er beholdt.

De målrettede regresjonstestene ga 82 beståtte og to feil: en test refererer til den manglende `src/lib/customer-auth/google.ts`, og en annen forventer 1200 px bredde for et eksisterende 1920 px OG-bilde. Ingen auth-implementasjon eller bildefiler ble endret i denne migreringen.

Målingene viser lokal oppførsel. Mobilens systemdeling, native app-distribusjon og providerlevering er ikke verifisert.

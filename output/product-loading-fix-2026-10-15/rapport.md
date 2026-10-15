# Rettet produktlasting – lokal verifikasjon 15.10.2026

## Endringer

- Responsiv serverrendret lasteplassholder i begge Suspense-grensene. Samme kolonnebredder og bildeproporsjoner som galleriet; minst én skjermhøyde reservert slik at footer og detaljer ikke vises i første skjermbilde og deretter flyttes.
- Størrelsesdialogen importeres på klikk. Knappen og sporingsattributtene beholdes, lastestatus og ny forsøksmulighet ved feil er lagt til. Dialogen beholder innhold og utseende og returnerer fokus til samme knapp.
- Google Sans Flex 4.005 / 120pt deles i forhåndslastet Latin-fil (61 684 byte, 245 tegn) og original full font ved behov (88 832 byte). Samme glyphform og tegnbredde verifisert ved vekt 500 og 800; vektakse 1–1000 beholdt. Originalfont og PDF-font uendret.

## Sammenlignbare målinger

Tre kjøringer før og etter, produksjonsbygg, Chromium, 1440×1000 / DPR 2, 1,6 Mbps ned / 0,75 Mbps opp, konfigurert 150 ms latency og CPU 4×. Ny browser context og deaktivert nettlesercache. Lokal image optimizer HIT. Eksterne forespørsler og lokale analyseendepunkter blokkert identisk. Tallene er lokale laboratoriemålinger, ikke feltdata eller en kontroll av produksjonssporing.

**Lett testbilde** (69 294 leverte byte): det første desktopbildets nettverksforespørsel erstattes bare i testharnessen. Produktets faktiske bildekilde er ikke byttet i koden.

| Måling | Før (median) | Etter (median) |
|---|---:|---:|
| LCP, sek | 2.580 | 2.472 |
| FCP, sek | 1.220 | 1.184 |
| Load-event, sek | 5.165 | 4.852 |
| JS startet før LCP, kB | 231.851 | 206.692 |
| Font, kB | 88.832 | 61.684 |

JS-tallet summerer hele de komprimerte ressursene som starter før LCP, ikke antall byte som allerede er mottatt ved LCP. Forbedringen er moderat: omtrent 0,11 sek i median. Det er ikke dokumentert at faktiske besøkende nå har LCP under 2,5 sek.

## Layout og funksjon

Ustrupede desktoptester med opprinnelig produktbilde: før maksimalt CLS 0,610569 (én av tre nye kjøringer; også gjentatt i tidligere diagnose), etter 0,002569 i alle tre. Mobil etter: 0 i alle tre. iPad etter: 0,005201 i alle tre. Restbevegelsen er ikke footer-hoppet.

Playwright på 390×844, 820×1180 og 1440×1000 kontrollerte Enter-åpning, dialogtabell, Escape, Lukk-knapp, fokus tilbake, manglende horisontal overflow, ingen pageerror og beholdte sporingsattributter. Alle bestod. Initialt lastes bare 61 684-byte-fonten; injisering av Ł henter fullfonten.

Separate bilder uten JavaScript holder stream-placeholderen synlig for kontroll: footer ligger under skjermen på alle tre bredder. Dette er en test av plassholderen, ikke en påstand om full funksjonalitet uten JavaScript.

Skjermbilder lagret som *-page.png, *-dialog.png og *-skeleton.png. Desktop-side og mobil-placeholder visuelt inspisert. Klarna-feilmeldingen i testbildene skyldes eksplisitt blokkert tredjepart i testen.

## Evidens og begrensninger

Rådata: before/runs-*.json og after/runs-*.json. Aggregater: summary.json. Funksjon: verification.json. Placeholder: skeleton-verification.json. Fontgeometri: font-verification.json. Harnessen er kopiert fra tidligere diagnose. Ressurser startet etter knappeklikk i verification.json kan også inkludere urelatert prefetch og blokkerte eksterne requests; ikke alle er dialogkode.

Dokumentasjon: installert Next.js 16.4.0 font.md og lazy-loading.md; Utekos Docs nextjs/guides/api/font; [Base UI Dialog](https://base-ui.com/react/components/dialog), kontrollert mot installert 1.8.0 Popup-typer; [fontTools subset](https://fonttools.readthedocs.io/en/latest/subset/index.html).

Ingen publisering, commit eller push. Eksisterende arbeid i andre filer er beholdt. Endringene gjelder fontlasting på alle sider som bruker den eksisterende fontdefinisjonen; sider med utvidede tegn kan hente begge fontfiler. Tracking-kontrakter og produktbilder er ikke endret. Ingen felt-INP eller ekstern checkout er validert i denne blokkerte testen.

Endelig `pnpm run build` bestod (inkludert TypeScript, motion-budget og 26 interne MDX-lenker). Fokusert ESLint på de fire endrede TS/TSX-filene og `git diff --check` bestod. Egen testserver på port 3001 er stoppet; eksisterende devserver er ikke stoppet.

# Redusert fontlevering — 12. oktober 2026

Implementert lokalt i `src/lib/fonts.ts`. Ikke deployet.

## Endring

Samme Google Sans Flex 4.005 leveres gjennom `next/font/local` i én WOFF2-fil.
120pt-varianten er verifisert i originalfontens STAT-tabell (`opsz=120`).
Optisk størrelse og de øvrige ubrukte aksene er låst til eksisterende verdier.
Alle 535 Unicode-tegn og hele vektområdet 1–1000 beholdes, inkludert Medium
500 og ExtraBold 800. CSS-størrelser, farger, tekst, logo og PDF-font er uendret.
Kilde, lisens, SHA-256 og gjenskapingskommandoer står i
[`src/assets/fonts/README.md`](../../src/assets/fonts/README.md).

`subsets` i `next/font/google` styrer hvilke filer som forhåndslastes, ikke
hvilke øvrige Unicode-filer nettleseren kan hente. Piler utløste store filer
selv om fonten mangler selve piltegnene. De bruker fortsatt samme systemfallback.
Den nye filen fjerner disse ekstraforespørslene og variasjonsdata som siden
ikke bruker. Preload, `display: swap`, CSS-variabel og fallback beholdes.

## Målinger

Tallene gjelder fontenes innhold, uten HTTP-headere. Tidligere Lighthouse-
målinger fra produksjon viste omtrent 473 kB overført inkludert headere.

| Rute | Før, eksisterende fontinnhold | Etter, lokal nettverksmåling | Reduksjon |
| --- | ---: | ---: | ---: |
| `/` | 471 960 B / 4 filer | 88 832 B / 1 fil | 81,2 % |
| `/produkter/techdown` | 471 960 B / 4 filer | 88 832 B / 1 fil | 81,2 % |
| `/produkter/camping-og-bobil` | 471 960 B / 4 filer | 88 832 B / 1 fil | 81,2 % |

Før-tallene er fra dagens opprinnelige Lighthouse-rapporter; forsiden og
TechDown er også målt lokalt før endringen. Etter-tallene er bekreftet i
Chromium og WebKit, på 390 og 1440 px, med nye nettleserkontekster per rute.
Next.js sitt utviklingspanel kan hente sin egen Geist-font; den er holdt
utenfor butikkens fontmåling. Produksjonsbygget inneholder bare den nye WOFF2-filen.
Dette dokumenterer reduserte fontdata, ikke en målt forbedring i LCP eller CrUX.

## Verifikasjon

- `pnpm run build`: bestått, inkludert TypeScript, 65 genererte sider,
  bevegelsesbudsjett og kontroll av MDX-lenker.
- Fokusert ESLint og `git diff --check`: bestått.
- 12 nettleserscenarioer: tre gyldige ruter × to bredder × Chromium/WebKit;
  én fontfil, ingen horisontal overflyt.
- Kontrollert sammenligning i samme DOM med opprinnelige Google-filer og
  ny font: samme tekst og overskriftshøyder i alle scenarioer. Breddeavvik
  under 0,2 px; ingen endret linjebryting i de kontrollerte overskriftene.
- Tegnprøve ved 400/500/600/700/800: ÆØÅ, æøå, aksenter, ™, priser,
  matematiske tegn og systemfallback for piler/✓ kontrollert visuelt.
- Alle opprinnelige Unicode-mappinger beholdt. 878 tegnforekomster fra de
  ti opprinnelige webfontfilene sammenlignet ved hver av fem vekter;
  konturstruktur identisk. Største koordinatavvik etter instansiering var
  1,51 av 2000 fontenheter, tilsvarende under 0,025 px ved 32 px tekst.

Råbevis finnes lokalt i `/tmp/utekos-fonts/`: `before.json`,
`verified-after.json`, `controlled.json`, `glyph-proof.json`, tegnprøver,
skjermbilder og kontrollskript. Innledende `/camping`-forsøk traff feil rute;
sluttverifikasjonen bruker riktig URL og krever HTTP 200.

Dokumentasjonsgrunnlag: installert Next.js 16.3.8 `font.md`, Utekos Docs
`nextjs/guides/api/font`, Context7, [Next.js fontreferanse](https://nextjs.org/docs/app/api-reference/components/font)
og [fontTools instancer](https://fonttools.readthedocs.io/en/latest/varLib/instancer.html).
Next.js 16.3.8-utgivelsen er kontrollert; ingen rammeverksoppgradering er gjort.

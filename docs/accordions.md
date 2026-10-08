# Accordion på produktsider og i FAQ

Lokalt implementert 5. oktober 2026. Ikke publisert.

Alle produktdetaljer, produktstørrelsesguider og FAQ-er på NBCC, Kontakt oss,
Om oss og Frakt og retur bruker `src/components/ui/Accordion.tsx`.
Dette er prosjektets shadcn Accordion med Base UI 1.8.0 og Utekos-ikoner.
`multiple={false}` er standard: bare ett felt kan være åpent per gruppe.

Sidene, MDX og innholdskomponentene forblir serverkomponenter. Wrapperne har
ingen `use client`; bare Base UIs interaktive primitiver har klientgrense.
`hiddenUntilFound` beholder lukkede svar i serverrendret HTML og lar støttede
nettlesere åpne treff ved søk på siden. Vanlig åpning/lukking krever JavaScript.
Innhold, rekkefølge og eksisterende fragment-ID-er er bevart.

Kildegrunnlag: [shadcn Accordion](https://ui.shadcn.com/docs/components/base/accordion),
[Base UI Accordion](https://base-ui.com/react/components/accordion),
[Base UI-utgivelser](https://base-ui.com/react/overview/releases),
Next.js 16.3.8 sine lokale guider om server-/klientkomponenter og MDX,
og samme komposisjonsveiledning via Utekos Docs MCP.

Kontrollert lokalt:

- 64 felt på 10 URL-er: HTTP 200, serverrendret svarinnhold med JavaScript av,
  og maksimalt ett åpent felt per gruppe etter interaksjon.
- Enter/mellomrom, gyldig kobling til åpent panel og Base UIs `beforematch`-håndtering.
- Representative produktsider og alle FAQ-sider ved 320, 390 og 1280 px:
  accordionene holder seg innenfor skjermen, uten avklipping av åpne paneler.
- Lint og applikasjonens TypeScript-kontroll bestått. Ingen Next.js-runtimefeil.
- Full typesjekk og produksjonsbygg blokkeres av eksisterende import av manglende
  `./config/cronRegistry` i `vercel.ts`. Byggets kompilering besto før typesjekken
  stoppet. Den separate applikasjonskontrollen utelot kun `vercel.ts`.

NBCC-sidens eksisterende hero stikker omtrent 9 px utenfor skjermen ved 320 px;
dette kommer fra heroens layout, ikke accordionene. Heroen er ikke endret.
Innholdsoversikter og kildelister i Uteguiden er utenfor denne produkt-/FAQ-endringen.

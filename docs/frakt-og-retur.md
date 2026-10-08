# Frakt og retur – migreringsgrunnlag

Gjennomgått 5. oktober 2026. Implementasjonen er lokal i v2.

## URL og søkemotorer

Behold `/frakt-og-retur`. Den finnes allerede i den offentlige butikken, footer,
sitemap og returpolicy i `utekos-headless`. Den er kort, på norsk og beskriver
innholdet. Et nytt `/kundeservice/`-ledd gir ingen dokumentert fordel for denne
siden. Bevaring unngår en unødvendig URL-migrering og behov for omdirigering.
Dette er en kvalitativ vurdering; ingen trafikk-, søkevolum- eller
rangeringsgevinst er målt.

- [Google: beskrivende URL-er, brukerens språk og bindestreker](https://developers.google.com/search/docs/crawling-indexing/url-structure).
- [Google: migrering kan gi midlertidige rangeringssvingninger](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).
- [Google: tydelig, offentlig tilgjengelig returpolicy, frister, metode og kostnader](https://support.google.com/merchants/answer/14011730?hl=en).
- [Google: nyttig og pålitelig innhold](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
- [Bing: crawlbare lenker, tilgjengelig innhold og konsistente URL-er](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a).
- [Microsoft Merchant Center: returpolicy-URL, returfrist og kundeservice](https://learn.microsoft.com/en-us/advertising/msa-help/hlp_ba_conc_bmc_ucp).

Siden har én H1, unik tittel/beskrivelse, egen canonical, footerlenke og
sitemap-oppføring. Eksisterende fragment-ID-er for retur, refusjon,
størrelsesbytte og spørsmål er bevart. FAQ bruker felles shadcn Accordion (Base UI), med ett åpent felt per gruppe.
Spørsmål og svar rendres på serveren. `hiddenUntilFound` beholder lukkede
svar i HTML-en; åpne/lukke-interaksjonen krever JavaScript. Ingen JSON-LD, microdata eller FAQPage er lagt inn.
[Google avviklet FAQ-utvidelser i søkeresultater 7. mai 2026](https://developers.google.com/search/updates).

## Forretningskilder og presiseringer

Kildene er lest i søsterprosjektet `../utekos-headless` og sammenholdt med
[den offentlige siden](https://utekos.no/frakt-og-retur):

- `src/lib/policies/returnPolicy.ts`: returadresse, kontaktkanaler,
  kundebetalt ordinær retur, 14 dagers frister, refusjon innen normalt
  1–3 virkedager etter mottak/kontroll og vilkår for gratis størrelsesbytte.
- `src/app/(store)/frakt-og-retur/data/shippingReturnsContent.ts` og sidens
  komponenter: frakt 99 kr, fri-fraktgrense 999 kr og normal levering 2–5
  virkedager. Den offentlige siden presiserer tiden fra PostNord henter pakken.
- `src/constants/free-shipping-threshold.ts`,
  `src/lib/merchant-feeds/klarna/buildKlarnaFeed.ts` og
  `src/lib/merchant-feeds/pinterest/buildPinterestCatalogFeed.ts`:
  grensen er 999 og sammenligningen `>=`. Derfor sier v2 «fra 999 kr»;
  den gamle sideteksten «over 999» / «under 999» avklarte ikke nøyaktig 999 kr.
  Betalings- og fraktberegningen er ikke endret eller kjørt i denne oppgaven.
- Løftet om sending samme dag før kl. 16 er utelatt: gammel FAQ og offentlig
  brødtekst har motstridende angivelser av unntaksdager.

Lovfestet fristberegning er presisert til dagen etter mottak, og siden opplyser
om forlengelse når angrefristen ender på lørdag/helligdag/høytidsdag. Refusjonsfristen
er 14 dager fra angremeldingen, med lovlig tilbakehold til mottak eller dokumentert
retur, det som skjer først. Normal intern behandlingstid erstatter ikke denne
fristen. Kilder: [angrerettloven §§ 6, 24 og 25](https://lovdata.no/dokument/NL/lov/2014-06-20-27)
og [Forbrukerrådets veiledning](https://www.forbrukerradet.no/forside/angrer-du-pa-et-kjop/).

Størrelsesbytte beholder sin egen dokumenterte kontaktadresse
`kundeservice@kelc.no`; ordinær retur bruker `kundeservice@utekos.no`.

## Arkitektur og verifikasjon

`page.mdx` eier innholdet. `layout.tsx` eier metadata og serverrendret ramme.
Eksisterende MDX-komponenter, brødsmuler og Google Sans Flex gjenbrukes.
Accordion bruker Base UIs eksisterende klientkomponenter med serverrendret
innhold som children. Ingen skjemainnsendinger eller sporingsendringer.
Ingen avhengigheter er lagt til. Dokumentasjonen i Next.js 16.3.8-pakken
og Utekos Docs sin MDX-guide er brukt; InKeep/Zod ble konsultert, men
statisk, lokalt MDX-innhold trenger ingen ny runtime-validering.

Evidence-Based Marketing ble konsultert om fysisk tilgjengelighet og konsekvent
merkevarebruk. Kortere vei til retursteg og tydelige kostnader er en UX-hypotese,
ikke et målt løft i konvertering. Ingen effektstørrelser er påstått.

Ved den opprinnelige migreringen, før overgangen til shadcn Accordion, ble følgende
kontrollert lokalt: lint, TypeScript, produksjonsbygg med statisk
`/frakt-og-retur`, HTTP 200, canonical, sitemap, footerlenke, interne lenker,
ankermål, unike ID-er, én H1, mobil/desktop og native FAQ med tastatur og
JavaScript avslått. Ingen horisontal overflyt ved 320 og 390 px.

Design Premium sin statiske prosjektkontroll fant ett eksisterende forhold i
`src/app/kontaktskjema/ContactForm.tsx:73` (textarea-resize). Det er utenfor
denne sideendringen og er ikke endret. Nettleserens Next.js-feilrapport var tom.
Merchant Center-konfigurasjon, produksjonsutrulling og faktisk SEO-/CRO-effekt
er ikke verifisert eller endret.

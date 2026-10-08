# Forhandlersider

Implementert og kontrollert lokalt 8. oktober 2026. Ingen publisering eller reelle testhenvendelser er utført. NBCC-siden og URL-en er beholdt.

## Innhold og kilder

`src/lib/retailers.ts` er felles register for oversikten, de tre butikksidene, metadata, strukturert data og sitemap. Sortimentet Utekos TechDown™ er bekreftet av Utekos. Størrelser, farger, priser og lagerstatus er ikke utledet fra Google.

| Butikk | Kilde for besøksopplysninger | Google Place-ID |
| --- | --- | --- |
| Intersport Laksevåg | https://www.intersport.no/butikker/intersport-laksevag | `ChIJ48v9snT8PEYRmBkalZRODmE` |
| MLS Fritid AS | https://mlsfritid.no/kontakt/ | `ChIJm4-ukqEWz0URKRXiiadw4E0` |
| Os Caravan & Fritid | https://www.oscaravan.no/kontakt-oss | `ChIJjVLtiF9ZPEYRyzDbjoTMijE` |

Besøksadressene i registeret overstyres ikke av Google. Intersports besøksadresse bruker 5163 Laksevåg, selv om Google returnerte et annet postnummer. Inngangsbilder og logoer er brukerens originale filer, vist med opprinnelige proporsjoner.

## Åpningstider

Kun `GOOGLE_MAPS_KEY` ble kopiert fra headless til den ignorerte lokale miljøfilen. Eksisterende verdier ble bevart. Produksjonsmiljø er ikke endret.

`src/lib/retailers/opening-hours.ts` bruker Places API (New), med feltutvalget `businessStatus,currentOpeningHours.weekdayDescriptions,attributions`, norsk språk, `cache: "no-store"` og fire sekunders tidsavbrudd. Nøkkelen sendes i serverens forespørselsheader. Serverkomponenten ligger bak `Suspense` og bruker `connection()` for henting ved forespørselen. Resten av siden kan vises straks.

Ved manglende nøkkel, timer, ugyldig svar, API-feil, tidsavbrudd eller stengt virksomhet vises lenke til butikkens åpningstider og telefon. Ingen status for «åpent nå» beregnes. Uten JavaScript er hovedinnholdet og denne reserveløsningen tilgjengelig. Google Maps-kildemerking og eventuelle leverandørattribusjoner vises sammen med Google-data. Kart og veibeskrivelse åpnes med eksterne Maps-lenker; ingen kart bygges inn.

Kilde: https://developers.google.com/maps/documentation/places/web-service/policies

## Forhandlerhenvendelser

`/bli-forhandler` og `/bli-forhandler/pdf` gjenbruker kontaktoppsettets Resend-konfigurasjon. Forhandlerhenvendelser sendes til `erling@utekos.no`, med utfylt PDF vedlagt. Mottakeren velges på serveren; innsendte felter kan ikke endre den. Vanlige kontakthenvendelser bruker fortsatt `CONTACT_FORM_SEND_TO_EMAIL`. Butikknavn, sted, kontaktperson, e-post, telefon og melding er påkrevd. Personvernbekreftelse, spamfelt og servervalidering følger eksisterende kontaktskjema. Den personlige kontaktlenken går til `erling@utekos.no`.

Bekreftelse gis bare etter en gyldig Resend-kvittering. Feil beholder verdiene. Den delte sendefunksjonen bevarer kontaktformularens eksisterende kontrakt og bruker separat idempotensprefiks for forhandlerhenvendelser. Eksisterende `recordAcceptedForm` brukes med `dealer_inquiry` og en kvitteringsbasert innsending-ID. Meldingsinnhold og kontaktfelter legges ikke i analysedata. Eksisterende aktiveringsgrenser for produksjonssporing er uendret.

## Verifikasjon

- 42 tester bestått: `node --test tests/retailers.test.cjs tests/contact-attachments.test.cjs tests/dealer-pdf.test.cjs`. Google-feil, manglende timer, tidsavbrudd, skjema-/spamvalidering (inkludert tomt telefonnummer), leveringsfeil og bekreftet mottak bruker simulerte leverandørsvar.
- Avgrenset ESLint: ingen feil eller advarsler. `pnpm lint`: ingen feil, 623 eksisterende advarsler i prosjektet.
- `pnpm exec tsc --noEmit` og `pnpm build`: bestått.
- Lokal produksjonsserver: alle fem sider returnerte 200 med selvrefererende canonical og brødsmuler. Ukjent butikkslug returnerte 404. Sitemap inkluderte alle fem URL-er, inngangsbildene og eksisterende NBCC-URL.
- Reelle Places-svar: alle tre Place-ID-er returnerte 200, operativ virksomhet og syv dagsbeskrivelser. Disse ble vist på butikksidene.
- Google-nøkkelen var fraværende i de fem HTML-svarene og 121 filer i nettleserbygget.
- Nettleserkontroll: desktop, mobil ned til 320 px uten horisontal overflyt, originale bilder/logoer, lenker, tastaturfokus og feilvisning. Ugyldig skjema uten JavaScript ga servervalidering og bevarte butikknavn; ingen e-post ble sendt. Hovedinnhold og åpningstidslenker var lesbare uten JavaScript. Forhandleroversikten viste ingen konsollfeil.
- Laveste kontrollerte tekstkontrast i den nye paletten var 4,71:1 på handlingsknappene.

Den midlertidige produksjonsserveren ble stoppet etter verifikasjonen. Eksisterende utviklingsserver ble beholdt.

## PDF ved forhandlerskjemaet

Originalen `public/images/kunnskap/forhandler.pdf` har syv sider og ingen skjemafelt. Den beholdes som kildefil. `forhandler-utfyllbar.pdf` inneholder de samme syv originalsidene og en utfyllbar side satt inn som side 7, før baksiden.

«Åpne og fyll ut PDF» åpner `/bli-forhandler/pdf` i en ny fane. Visningen bruker lokalt levert PDF.js 6.4.299 og tilgjengelige HTML-felter plassert over PDF-ens AcroForm-felt. «Les teksten på side …» gir et tekstalternativ som også kan leses av skjermlesere. Sidebytte og zoom beholder inntastede verdier. Alle seks kontaktfeltene og personvernbekreftelse er påkrevd. Nedlastingslenken tilbyr den tomme PDF-malen; den kan også fylles ut og lagres i en PDF-leser med AcroForm-støtte.

«Send henvendelsen» bruker samme validerte serverhandling som det vanlige nettskjemaet. Serveren lager en utfylt PDF fra vår lokale mal og sender den automatisk som vedlegg til `erling@utekos.no` via Resend. Nettleseren sender bare feltene; ingen PDF lastes opp av kunden, og ingen e-postklient må åpnes. Det vanlige nettskjemaet får også PDF-vedlegget. Bekreftelse vises først etter leverandørens mottakskvittering. Validerings- og leveringsfeil beholder feltene. Identiske forsøk får samme idempotensnøkkel. Ingen kontakt- eller meldingsinnhold legges i analysedata.

PDF-en har ingen JavaScript-handlinger. Automatisk innsending skjer i nettvisningen, ikke fra en nedlastet fil i en separat PDF-leser. PDF-siden har `noindex` og peker til `/bli-forhandler` som canonical. Dersom visningen ikke kan lastes, eller JavaScript er deaktivert, finnes lenke til det vanlige nettskjemaet.

Bygg PDF-en på nytt med `uv run scripts/build-dealer-pdf.py` etter `pnpm build`. Skriptet gjenbruker Google Sans Flex fra Next-fontene og det originale hvite wordmarket. Det skriver også `src/assets/fonts/GoogleSansFlex120pt-Medium.ttf` som brukes til serverens PDF-utfylling. Kilde-PDF-en overskrives ikke. Den nye siden bruker samme sideformat som originalen, Google Sans Flex 120pt Medium/ExtraBold og Utekos-paletten. Kjør `pnpm pdf:worker` ved oppdatering av PDF.js for å synkronisere den lokale workeren med installert versjon.

Dokumentasjon: [PDF.js 6.4.299](https://github.com/mozilla/pdf.js/releases/tag/v6.4.299), [pdf-lib skjemafelt](https://pdf-lib.js.org/#fill-form), [Resend vedlegg](https://resend.com/docs/api-reference/emails/send-email), lokale Next.js 16.3.8-dokumenter om Server Actions og skjema.

Automatisk innsending er kontrollert med simulert Resend: 42 tester i `tests/retailers.test.cjs`, `tests/contact-attachments.test.cjs` og `tests/dealer-pdf.test.cjs`. PDF-testene åpner det faktiske vedlegget igjen og kontrollerer alle felt, norske tegn, flerlinjet melding, personvernbekreftelse, stabilt innhold ved gjentakelse og uendret blank mal. Feil ved PDF-generering sender ingen e-post; manglende kvittering og leveringsfeil gir ingen suksess eller akseptert skjema-hendelse. Ingen reelle henvendelser er sendt.

Lange verdier som ikke får plass i skjemafeltets utskriftsvisning får henvisning til lesbare fortsettelsessider før den originale baksiden. Hele den innsendte verdien beholdes også i AcroForm-feltet og e-postteksten. Avgrenset linjebryting unngår PDF-lib sin kostbare layout for svært lange avsnitt. Maksimal melding på 5000 tegn, inkludert en sammenhengende streng uten mellomrom, er testet sammen med feltenes makslengder. Vanlige korte henvendelser har fortsatt åtte sider.

Sluttkontroll for automatisk PDF-innsending: avgrenset ESLint uten advarsler, prosjektlint uten feil (623 eksisterende advarsler), TypeScript og produksjonsbygg bestått. PDF-mal og TTF-font finnes i begge forhandlerrutenes produksjonssporing. Alle syv originalsidene er kontrollert piksel for piksel mot kilden; originalfilens SHA-256 er uendret. PDF og worker svarer med HTTP 200 og riktige innholdstyper. Nettleseren er kontrollert på desktop og 390 px mobil, med tastaturnavigasjon, sidebytte, zoom, bevarte felt og servervalidering. Selve dokumentet kan rulles horisontalt på mobil; nettsiden har ingen horisontal overflyt. Feil ved lasting av PDF og deaktivert JavaScript gir lenke til det vanlige nettskjemaet. Midlertidige nettleserinnstillinger er tilbakestilt. Ingen publisering eller reelle testhenvendelser.

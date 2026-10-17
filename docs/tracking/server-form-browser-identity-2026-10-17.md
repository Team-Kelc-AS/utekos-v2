# Nettleseridentitet i serverregistrerte skjemahendelser

`recordAcceptedForm` sendte `form_submit` uten `browser_id`, selv når den faktiske
HTTP-forespørselen hadde `_ga`. Backendens generiske skjemamottak henter ikke
Google-ID fra den videresendte cookie-headeren. Google-planleggeren utelot derfor
hendelsen med `missing_client_id`.

Monitorens lesekontroll 17. oktober viste én slik serverhendelse hvor andre
hendelser fra samme sidevisning hadde Google-ID. Tre regresjonskontroller
reproduserte mangelen før rettingen. Dette forklarer ikke de øvrige 33
nettleserhendelsene eller én webhook-hendelse med samme årsakskode.

## Endring

Serveren bruker nå eksisterende `extractBrowserIds` på cookie-headeren fra den
faktiske forespørselen og gjeldende sporingsautorisasjon. Resultatet legges i
`browser_id` når det finnes. Skjulte skjemafelter kan ikke overstyre denne
headeren. Manglende eller feil URL-kodede cookies gir ingen oppdiktet ID.

Den eksisterende hjelperen filtrerer analyse- og markedsføringsidentifikatorer
separat. Ingen samtykkepolicy, hendelses-ID, e-postkvittering, endepunkt,
provider-konfigurasjon eller historisk hendelse endres.

Google krever `clientId` for denne typen webhendelse. Backendens eksisterende
normalisering og Google-mapping støtter allerede `_ga`-formatet via `ga_client`.
Ingen pakkeoppgradering er nødvendig for rettingen.

## Verifikasjon

- Fire nye regresjoner dekker faktisk Google-ID, forfalsket skjult cookie-kontekst,
  fravær/feil koding og separate analyse-/markedsføringstillatelser.
- 102 relevante tester består, inkludert eksisterende kontakt-, nyhetsbrev-,
  venteliste- og forhandlerflyter.
- Typesjekk og produksjonsbygg består.
- En isolert kontroll mot backendens faktiske normalisering, Google-mapping og
  leveringsplanlegger bekrefter korrekt `clientId` og kvalifisert Google-levering.
- Lint av de endrede filene består. Lint av kildekoden med lokale `output/**`
  utelatt har 0 feil og 624 eksisterende advarsler. Ufiltrert lint finner også
  44 feil i ignorerte, lokale undersøkelsesskript under `output/`.

Dette er kilde- og lokalverifikasjon. Deploy og naturlig Google-mottak må
rapporteres separat; testene sender ingen hendelser til produksjon.

## Dokumentasjon kontrollert

- [Google: send events](https://developers.google.com/data-manager/api/devguides/events/send-events)
- [Google: recommended and custom events](https://developers.google.com/data-manager/api/devguides/events/analytics/recommended-custom-events)
- [Google: release notes](https://developers.google.com/data-manager/api/reference), inkludert v1.6 og v1.8.
- Installert Next.js 16.4.0: `headers` er asynkron og skrivebeskyttet; eksisterende
  `await headers()` beholdes.

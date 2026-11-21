# Meta client IP (IPv6) for CAPI

Meta Dataset Quality flagget at Pixel sender IPv6 mens CAPI sender IPv4, og at
IP-adressene ikke stemmer for de fleste webhendelser (PageView, ViewItemList,
LandingScrollDepth m.fl.). Årsakene er to separate feil, og begge må rettes:

1. **`_fbi` kan aldri bli IPv6.** `getIpFn` spurte bare `utekos.no/api/meta/client-ip`.
   `utekos.no` ligger på Vercel, som ikke støtter IPv6, så svaret var alltid IPv4.
2. **Bare PageView brukte Parameter Builder sitt IP-valg.** Alle andre webhendelser
   sendte rå forespørsels-IPv4 fra Vercel, uten `_fbi`.

## Løsning (tre deler)

| Del | Repo / system | Hva |
| --- | --- | --- |
| A | Server-GTM `GTM-M8GT97CV` på `edge.utekos.no` | Klienten `Edge peer echo` (`docs/tracking/sgtm/edge-peer-echo.tpl`) svarer på én eksakt sti med `{"client_ip_address": "<tilkoblende adresse>"}`. Den kjører aldri containeren, setter ingen cookies og tillater CORS kun for `https://utekos.no`. |
| B | `utekos-v2` | `src/lib/analytics/fetchMetaClientIp.ts`: `getIpFn` spør edge først (CORS-enkel POST uten body og cookies, 1,2 s), og faller ellers tilbake til dagens same-origin-oppslag (2,5 s). Etter én feil hoppes edge over resten av dokumentet. Krever markedsføringssamtykke. |
| C | `utekos-tracking-backend` | `resolveMetaClientIpAddress`/`withMetaClientIp`: for alle webhendelser med markedsføringssamtykke velger Parameter Builder IP fra `_fbi`-cookien og forespørsels-IP (offentlig IPv6 først), lagrer den som `browser_id.fbi` og sender den som Meta `client_ip_address`. `fbi` fra nettleseren erstattes alltid. Kanonisk `client_ip_address` forblir bar IP for Google, Pinterest, Snapchat, UET og intern trafikkfiltrering. |

Regler:

- `getIpFn` må aldri rutes gjennom `utekos.no` eller `/__sgtm`. Vercel er
  IPv4-only, så et proxyet oppslag kan aldri se IPv6.
- Stien i `ECHO_PATH` (`edge-peer-echo.tpl`) og `META_EDGE_CLIENT_IP_URL`
  (`fetchMetaClientIp.ts`) må være identisk.
- `fbc`/`fbp`, `event_name`/`event_id`, hendelsestid og samtykke er uendret.
  Meta CAPI Gateway forblir av, og sGTM får ingen Meta-tagg.

## Før publisering av A (krever eierens godkjenning)

1. **IPv6-probe uten endring.** Åpne GTM server Preview og bruk «send requests
   manually». Send `curl -6` og `curl -4` POST til `https://edge.utekos.no/data`
   med preview-headeren og en JSON-body med `event_name: "ip_family_probe"`
   (treffer ingen trigger) og uten `ip`-felt. Kontroller at `ip_override`
   (fra `getRemoteAddress()`) har riktig adressefamilie og er avsenderens egen
   adresse. Gjenta med `X-Forwarded-For: 192.0.2.1` for å se om verdien kan
   forfalskes. Noter bare familie og ja/nei, aldri adresser. Ikke del eller
   commit preview-headeren.
2. Hvis proben feiler: fallback er en AWS CloudFront Function på `ip.utekos.no`
   (ny underdatabehandler). Del B og C gjenbrukes, bare URL-en endres.
3. Importer `edge-peer-echo.tpl` som klientmal i workspace, opprett klienten med
   høyere prioritet enn GA4, `gtm_client` og Data Client, og test i Preview:
   POST med `Origin: https://utekos.no` gir 200, JSON med én nøkkel, ACAO
   `https://utekos.no`, `Vary: Origin`, `Cache-Control: no-store, private`, ingen
   `Set-Cookie`. Annen eller ingen origin gir ingen ACAO. OPTIONS gir 204, GET 405.
   Ingen tagger fyrer. `/g/collect`, `/data`, `/gtm.js`, `/ubz6rnxUB9GwSM3tBJqi` og
   `/healthy` virker som før.
4. Kontroller at workspace-diffen mot live inneholder bare den nye malen og
   klienten. Publiser aldri web-containeren `GTM-5TWMJQFP` samtidig; workspacen
   der har urelaterte, upubliserte endringer.

## Rekkefølge i produksjon

Backend (C) først, deretter sGTM (A), deretter storefront (B). Hvert steg krever
eget klarsignal. Hvis B kommer før A, faller alle oppslag tilbake til IPv4.
Tilbakerulling: fjern edge-URL-en i B (fallback til IPv4) eller avpubliser
sGTM-versjonen. C kan bli stående.

## Måling

Aggregert SQL på `ops.provider_dispatch_attempts` (provider `meta`, webhendelser,
per `event_name`): andel med `browser_id.fbi` (forventet ~100 % etter C), fordeling
av suffiks (`AQYC` cookie mot `AQQA` forespørsel) og IPv6-andel av sendt
`client_ip_address` (stiger etter A og B). Følg Meta Events Manager Test Events og
Dataset Quality-diagnostikken over 24–72 timer, sammen med fbc-integritet,
dedupliseringsrate og leveringsforsinkelse.

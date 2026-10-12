# Privat cache for Google-taggen

Implementert lokalt 12. oktober 2026. Ikke deployet.

Gatewayen bevarer nå Stapes `Cache-Control: private, max-age=900` for den
observerte typen Google-JavaScript under `/__sgtm/fps/<container>/<opaque-script>`
og Safari-varianten `/__sgtm/gtag/js`.
Før overskrev den også disse svarene med `no-store`, slik at en varm reload
overførte omtrent 208 kB for Google-taggen på nytt.

## Avgrensning

Et svar kvalifiserer bare når alle vilkårene er oppfylt:

- GET eller HEAD, HTTP 200 og den avgrensede `/fps/.../...`-skriptstien eller `/gtag/js`.
- MIME-type `application/javascript` eller `text/javascript`.
- Upstream tillater uttrykkelig `private` med én gyldig `max-age` på 1–900 sekunder.
- Ingen `public`, `no-store`, `no-cache`, `Set-Cookie` eller `Vary: *`.

Original cacheheader, `Vary`, validators og øvrige tillatte response-headere
beholdes. Alle andre svar bruker fortsatt `no-store, max-age=0`.
Det gjelder blant annet `/fps/.../a`, eventtransport, Cookie Keeper, ukjente
skript, feil og delvise svar. Separate Set-Cookie-headere beholdes.

`CDN-Cache-Control` og `Vercel-CDN-Cache-Control` forblir `no-store` på alle
svar. Gatewayens upstream-fetch er fortsatt `cache: 'no-store'`; endringen
gjelder bare besøkerens nettlesercache, uten server-/CDN-cache.

Google-taggen kan fortsatt oppdateres når Stapes private cachefrist utløper
eller skript-URL-en endres. Endret upstream-policy, ukjent sti eller cookies
fører konservativt tilbake til `no-store`. Dette reduserer gjentatt
overføring, ikke første nedlasting eller JavaScript-arbeidet ved ny sidevisning.

## Verifikasjon

- 13 gatewaytester bestått. Nye tilfeller dekker GET/HEAD, private-cache,
  bevarte Vary/ETag og 19 avvisningstilfeller for transport, cookies, status,
  MIME-type og ugyldig cachepolicy, mot begge tillatte skriptstier.
- Generert Stape-loader og opprinnelige kildehasher er bevart.
  `gateway-source-manifest.json` registrerer en ny kontrollert målfils-hash
  for response-headerendringen; provenienstesten består.
- Den faktisk observerte Google-skriptstien og dagens Stape-svar er også
  kontrollert gjennom den nye headerfunksjonen: HTTP 200,
  `private, max-age=900` beholdt, begge CDN-headere `no-store`, ingen Set-Cookie.
  Bevis: `/tmp/utekos-google-cache/current-headers.json`. Dette er en direkte
  upstream-kontroll, ikke en deploy eller en produksjonsmåling av rettingen.
- Chromium og WebKit mot en lokal HTTP-fixture som bruker den faktiske
  `proxyServerGtmRequest` med injisert upstream, uten providerutsendelser:

| Regel | Upstream-kall etter første last | Etter reload |
| --- | ---: | ---: |
| Før: blanket `no-store` | 1 | 2 |
| Ny: privat Google-skriptcache | 1 | 1 |
| Ny: svar med Set-Cookie | 1 | 2 |

Skriptet kjørte på begge sidevisningene også når det ble hentet fra cache.
Fixture bruker et inert skript, ikke produksjonens Google-tag. Råbevis og
testskript finnes i `/tmp/utekos-google-cache/browser.json` og `browser.ts`.
Safari-stien er kontrollert separat med samme gateway-fixture i
`/tmp/utekos-stape-readiness/safari-cache.json` og `safari-cache.ts`.

- Fokusert ESLint og `git diff --check`: bestått.
- `pnpm run build`: bestått, inkludert TypeScript, 65 genererte sider,
  bevegelsesbudsjett og MDX-lenkekontroll.

Etter deploy må den faktiske Google-ressursen og varm reload kontrolleres i
produksjon. Besparelsen på rundt 208 kB er basert på den tidligere målte
produksjonsressursen; den er ikke målt etter en deploy av denne rettingen.

Dokumentasjon: installert Next.js 16.3.8 for `fetch` og Route Handlers,
native MDN MCP og [HTTP Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control).
Utgangspunktet er [trackingoppstart-auditen](tracking-startup-audit.md).

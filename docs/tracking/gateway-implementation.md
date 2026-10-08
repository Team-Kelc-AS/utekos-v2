# Stape-gateway og driftsmåling i v2

Implementert lokalt 7. oktober 2026. Ikke publisert eller verifisert mot leverandører.

Kildegrunnlag: headless-commit `e74e6cd8310c88f2777cbfdf5ad6b431647d7f77`.
Eksakte kildefiler, SHA-256 og tilpasningsmarkører finnes i
`gateway-source-manifest.json`. Generert Stape Custom Loader er kopiert byte-for-byte.

## Ruter og eierskap

- `/__sgtm/[[...path]]` → fast `https://edge.utekos.no`, direkte fra v2.
  Next.js-mappen heter `%5F_sgtm`: en vanlig `__sgtm`-mappe ville blitt privat og ikke eksponert en rute.
- GET, HEAD, POST og OPTIONS beholder metode, query, status, strømmet respons og separate Set-Cookie-headere.
- Request/response bruker `no-store`; CDN og Vercel CDN får også eksplisitt `no-store`.
- Alle provider-utsendelser, køer og gjenforsøk tilhører headless. V2s kopierte køtrigger og cron-import er fjernet fra `vercel.ts`.
- Vercel Analytics og Speed Insights bruker de fem eksisterende `/telemetry/v1/*`-adressene, omskrevet til de faste `/_vercel`-endepunktene. Ukjente telemetry-ruter avvises.

## Miljø og identitet

`productionTrackingEnabled()` krever `NEXT_PUBLIC_TRACKING_ENABLED=true` og
`NEXT_PUBLIC_VERCEL_ENV=production`. Serveren krever dessuten
`VERCEL_ENV=production`. `NODE_ENV=production` alene aktiverer ingenting.

Scripts, gateway, telemetry og identitetsproxy tillater bare HTTPS på `utekos.no`
og `www.utekos.no`. Dette stopper også en produksjonsartefakt åpnet gjennom et
Vercel deployment-alias. Stape-gatewayen gjør ingen fetch når sperren er aktiv.
Preview/local får ingen ordinære produksjonsleveranser. Miljøvariablene må
være riktige ved bygg; klientverdier blir bygget inn av Next.js.

`StapeScripts` skal bare monteres fra rotlayouten. Consent-defaults settes til
`granted` før interaktive scripts. Kanonisk policy er fortsatt
`resolveTrackingAuthorization()` med `source=operator_policy`, `version=1`;
ingen Cookiebot-hendelse eller registrert brukersamtykke opprettes av dette.
Den genererte loaderen har sin opprinnelige etter-interaktiv rekkefølge.

Proxyen bruker den låste server Parameter Builder (`capi-param-builder-nodejs`
1.3.2) for `_fbp` og `_fbc` fra faktiske request-cookies og `fbclid` i URL-en.
Den oppfinner ingen besøks-IP. Browser/collector-broen eier eventuell videre
IP-berikelse. Eksisterende gyldige Meta-identifikatorer beholdes.

Cookie Keeper beholder den eksisterende `user_id`-kontrakten: 32 heksadesimale
tegn, uendret gyldig verdi, 400 dagers levetid, `Domain=utekos.no`, Secure og
SameSite=Lax. Full HTML-navigasjon refresher cookie-alder som i kildeversjonen.
RSC, prefetch og statiske ressurser skriver ikke disse cookiene.

**Cacheavveiing:** Den bevarte master-cookie-kontrakten setter cookie på hver
ekte HTML-navigasjon. Disse responsene er derfor private/no-store også ved
gjenbesøk. Kildeparitet er valgt her; effekten på HTML-cache, TTFB og LCP må
måles før produksjonsgodkjenning. Ingen effektmåling er gjort lokalt.

## Avgrensede tilpasninger

- Gatewayen avbryter upstream-kallet etter 10 sekunder eller når besøksrequesten
  avbrytes. Det finnes ingen automatisk gateway-retry som kan doble Data Tag.
- Authorization, Vercel OIDC, protection-bypass og interne `x-utekos-*`-headere
  sendes aldri til Stape.
- Hemmelige cart-/Facebook-session-/OAuth-cookies fra v2 og headless filtreres
  bort. Sporingscookies og master-identiteten beholdes.
- Produksjonsscripts har vertsvern uten at generert loadertekst endres.
- Vercel beforeSend fjerner hele query og fragment fra URL og avviser andre
  origins. Det logges ingen cookie-, kundedata- eller dataLayer-objekter her.

## Lokalt verifisert

`node --import tsx --test tests/tracking-gateway.test.ts`: 11 tester bestått.
Testene bruker bare fiktive identifikatorer og injisert fetch, uten nettverk.

De dekker metode/body/query/status, headerfiltrering, separate cookies,
no-store, ugyldige paths, feil uten retry, eksplisitt miljøsperre, redirect-alias,
Cookie Keeper-ID/livstid, HTML kontra prefetch/RSC, Meta-cookie-bevaring ved
gjenbesøk, Google consent-rekkefølge, generert Safari-loadergren og hashparitet.
Avgrenset ESLint for de nye gateway-, proxy-, script- og testfilene er bestått.

## Åpne produksjonskontrollpunkter

Disse er **unverified** og skal ikke utledes fra lokale tester:

1. Publisert Next-rute, reelle response-headere og deploy-SHA.
2. Safari 16.4+ med første besøk, gjenbesøk, slettede marketing-cookies og sen
   restaurering. Kontroller samme `_fbp`/`_fbc`/`_ga` etter restaurering og at
   første Meta-hendelse bruker identiteten som faktisk ble restaurert.
3. GTM Data Tag sin eksplisitte feltliste og fortsatte utelatelse av `purchase`
   og `view_item`; Meta-tagger skal fortsatt være pausede i GTM.
4. Aktivitet og faktisk effekt per Stape Power Up: Cookie Keeper, User ID,
   Click ID Restorer (`backup_msclkid`), GEO/UA, Enricher, Store og produktfeed.
   Enricher i Stape dokumenterer ikke berikelse av direkte app-Meta CAPI.
5. POAS-feed, variantkobling og kostgrunnlag; estimerte marginer skal ikke
   erstatte faktisk fortjeneste eller ordinær kjøpsverdi.
6. HTML-cache/TTFB/LCP/INP før og etter, samt faktisk Vercel-receipt for vitals.

Offisielt dokumentasjonsgrunnlag lest under implementeringen:
[Stape Cookie Keeper](https://stape.io/helpdesk/documentation/cookie-keeper-power-up),
[Vercel Analytics](https://vercel.com/docs/analytics/package),
[Vercel URL-redigering](https://vercel.com/docs/analytics/redacting-sensitive-data),
[Speed Insights](https://vercel.com/docs/speed-insights/package), og installerte
Next.js 16.3.8-guider for Proxy, Script, Route Handlers og private mapper.

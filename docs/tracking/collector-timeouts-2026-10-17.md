# Tidsgrenser for hendelsesinnsamling

## Bekreftet feil

17. oktober 2026 kl. 13:57–13:58 UTC returnerte storefront transportfeil for
to view_item_list og én view_category. De samme tre request-ID-ene ble funnet
i backend med HTTP 202 omtrent 10,2 sekunder etter start, rundt 2,2 sekunder
etter storefront hadde sluttet å vente. Backend hadde akseptert hendelsene.

Storefront-broen hadde 8 sekunders tidsfrist. Nettleserleveringen hadde 10
sekunder. Backend lagrer hendelsen og venter deretter på Meta-utsendingen,
som alene har en HTTP-tidsfrist på 10 sekunder. De ytre tidsfristene kunne
derfor avbryte før en gyldig kvittering kom tilbake. De tre Meta-forsøkene
ble senere registrert med HTTP 200 ved andre forsøk i eksisterende outbox.
Dette beviser ikke hvorfor de opprinnelige Meta-kallene tok så lang tid.

## Endring

| Ledd | Før | Nå |
|---|---:|---:|
| Storefront til backend, kun /api/events/* | 8 s | 20 s |
| Nettleserens canonical-event-levering, per forsøk | 10 s | 25 s |
| Vercel-funksjonen /api/events/[...path] | Ikke eksplisitt i ruten | 30 s |

Felles verdier ligger i src/lib/tracking/timeouts.ts. Dette er applikasjonens
begrensede ventebudsjett, ikke et løfte om leverandørlevering. Normale svar
returneres straks de foreligger. Grensene for Shopify-callbacker, Klarna,
Meta parameter-context og øvrige brooperasjoner er ikke endret.

Nettleseren har fortsatt høyst to forsøk med samme serialiserte hendelse,
ID og tidsstempel. Broen innfører ingen egne gjentakelser. Signatur/OIDC,
origin, samtykke, crawlerfiltrering, datalagring og outbox-eierskap er uendret.
Ingen bakgrunnsjobb er lagt til. HTTP 200/202 betyr fortsatt
accepted_unverified; 204 betyr suppressed; manglende svar gir fortsatt feil.

## Verifikasjon

- Isolert test kjører faktisk nettleserlevering og bro mot et lokalt simulert
  backend-svar etter 10 200 ms. Ingen nettverks- eller providerkall utføres.
  Testen feilet før rettingen med collector_http_502, og består etterpå med
  HTTP 202, ett nettleserforsøk, én videresending og ingen transportfeil.
- En fastlåst upstream blir fortsatt avbrutt og gir HTTP 502 én gang.
- 35 eksisterende og nye bro-/leveringstester består samlet, inkludert
  autentisering, samtykke/crawlerfiltrering og bevaring av hendelsesidentitet.
- Lint, typesjekk, bygg og produksjonsstatus registreres separat i leveringen.
  Lokal simulering beviser ikke en ny langsom produksjonsforespørsel.

## Dokumentasjonsgrunnlag

Installert Next.js 16.4.0: node_modules/next/dist/docs/01-app/03-api-reference/
03-file-conventions/route.md og 04-functions/fetch.md. Native Vercel MCP og
Utekos Docs ble konsultert. Next fetch støtter native AbortSignal og
cache=no-store. Vercel maxDuration begrenser hele funksjonsinvokasjonen:
https://vercel.com/docs/functions/configuring-functions/duration .

# Web Analytics: handelshendelser

Lokal implementasjon 28. oktober 2026. Dette er en ekstra visning i Vercel-prosjektet `utekos-headless` (`prj_MpZN3Z0PDp8rfwpdzAeplGe4Di0s`), ikke en ny kilde til ordre eller et bevis på provider-mottak. Supabase-ledgeren i tracking-backenden er fortsatt fasit.

| Hendelse | Trigger | Vercel-prosjekt |
|---|---|---|
| `add_to_cart` | Backend svarer 202 for ny canonical hendelse fra `/api/events/add-to-cart`, med `consent.analytics=granted` | `utekos-headless` |
| `begin_checkout` | Backend svarer 202 for ny canonical hendelse fra `/api/events/begin-checkout`, med `consent.analytics=granted` | `utekos-headless` |
| `purchase` | Backend lagrer en ny, verifisert Shopify `orders/paid`-hendelse eller en ny kanonisk avstemmingshendelse, med `consent.analytics=granted`; backend sender en OIDC-signert overføring til v2 | `utekos-headless` |

Bare `currency` og `value` sendes som custom properties. Kundeidentitet, ordre-ID, handlekurv-ID, produktene og hele canonical payloaden sendes ikke til Vercel. `event_id` brukes i den interne kjøpskvitteringen, men sendes ikke som Vercel-property. En backend-duplikat (200) lager ikke ny Vercel-hendelse. Kjøpsruten godtar bare produksjonstoken fra backend-prosjektet `prj_EHFI28tMUlIQsNguxjcKHPlLAlFE` i team `team_0B8gWWIxT2hGVIJnK8CwanAi`.

## Før publisering

1. Kontroller at teamet har Pro eller Enterprise; Hobby støtter ikke custom events. På Pro er to custom properties per hendelse tillatt.
2. Storefrontprosjektet har Vercel Authentication på ikke-egne domener. Vercels server-SDK sender som standard til deployment-URL-en og kan få 401. Kontroller om en **Protection Bypass for Automation** finnes; opprett den ved behov og verifiser at serverhendelser mottas. SDK-et leser `VERCEL_AUTOMATION_BYPASS_SECRET` automatisk. Opprettelse er en sikkerhetsendring som må vurderes særskilt.
3. Publiser den avgrensede v2-endringen før backend-endringen. Bekreft at den interne kjøpsruten avviser manglende/feil OIDC-token og at et lovlig kall gir `submitted_unverified`.
4. Verifiser ett naturlig nytt kjøp mot `orders/paid`, Supabase-ledgeren og Vercels `purchase`-tall. Kontroller også ett nytt `add_to_cart` og `begin_checkout` med 202/duplikat og statistikksamtykke hver for seg.

Vercels `track()` gir ingen dokumentert idempotensnøkkel eller provider-kvittering. Backend sender kjøpsprojeksjonen én gang etter ny ledgerinnsetting; en tapt nettverksrespons kan derfor gi et hull i Vercel uten å endre den kanoniske ordren. `submitted_unverified` betyr bare at v2-ruten kalte Vercels SDK. Historiske ordre tilbakefylles ikke, og Vercel-tall skal ikke brukes som autoritativ ordretelling eller omsetning.

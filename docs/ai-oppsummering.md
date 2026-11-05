# AI-oppsummering på produktsider og i Uteguiden

Oppsummering aktiveres ved klikk. Ingen modellkall gjøres under sidevisning,
prefetch eller bygg. AI-klienten og schema-valideringen lastes først etter
aktivering. Eksisterende tekst, kjøpsflyt og metadata er fortsatt
sidens primærinnhold. Resultatet strømmes som et strukturert objekt med et
kort avsnitt, 2–4 hovedpunkter og eventuelle kildebelagte forbehold.

## Kilder og oppdateringer

- Produkter: samme lokale beskrivelse og trekkspilldata som produktsiden,
  med Shopify-beskrivelsen som reserve når lokal tekst mangler. Bare publiserte
  Storefront-handles aksepteres. Pris, lager, varianter og omtaler sendes ikke.
- Artikler: MDX parses uten å kjøre kode. `build:ai-sources` lager en JSON-fil
  som kun importeres på serveren. Alle 12 registrerte artikler har inngang til
  funksjonen, også artiklene som ikke bruker `KnowledgeArticleScaffold`.
- `pnpm dev` og `pnpm build` regenererer artikkelkildene. Ved endring i MDX
  under en allerede startet utviklingsserver: kjør `pnpm build:ai-sources`.
- Cache-nøkkelen bruker SHA-256 av tekst, sidens identitet, tittel, modell og
  promptversjon/instrukser. Tekstendringer gir ny nøkkel. Ingen manuell
  invalidering er nødvendig for korrekt innhold etter neste kildebygg.

## AI SDK og Vercel

Implementasjonen bruker AI SDK 7 `streamText`, `Output.object` og React
`useObject`, kontrollert mot dokumentene i de installerte pakkene. AI Gateway
er standard provider. Modellen `google/gemini-3.8-flash` ble funnet i Gateways
modelliste 5. november 2026; `AI_SUMMARY_MODEL` kan overstyre den på serveren.

Gateway bruker `AI_SUMMARY_GATEWAY_API_KEY` når den er konfigurert, ellers
`AI_GATEWAY_API_KEY` eller Vercel OIDC. Den dedikerte nøkkelen lar funksjonen
ha eget budsjett uten å påvirke andre AI-funksjoner. En eksisterende nøkkel
ble bekreftet som konfigurert for preview og production i det lokalt koblede
Vercel-prosjektet. Dette er ikke bevis for at funksjonen er deployet eller at
en produksjonsgenerering fungerer. Lokalt trengs gyldig Gateway-tilgang.

Vercel Runtime Cache (`@vercel/functions`, allerede installert) lagrer bare
validerte, fullførte resultater i 24 timer. Dette lar kalde svar strømme og
varme svar gjenbrukes uten et nytt modellkall. Cache-API-et bruker minne lokalt;
faktisk delt cache og treffrate på Vercel må kontrolleres etter deploy.
Cache-lesefeil stopper generering, mens skrivefeil logges uten å skjule et
ellers gyldig svar. Feil, avbrudd og ufullstendige svar caches ikke. Både avbrutt HTTP-forespørsel
og lukket responsstrøm stopper modellkallet via AbortSignal.

Forespørsler aksepterer bare `{ kind, slug }`, ikke vilkårlige URL-er, filbaner
eller prompts. API-et avviser kryssorigin, ugyldig JSON og mer enn 512 bytes.
Det har en avgrenset, instanslokal grense på 10 forespørsler/minutt per
adressehash. Dette er ikke en distribuert kvote eller et globalt kostnadstak.
Bruk AI Gateways budsjetter og Vercel Firewall ved behov for delte grenser.
Generering har 25 sekunders timeout, maks én vanlig retry og 2400 outputtokens.

Loggene har `ai_summary_cache_hit`, `ai_summary_completed`,
`ai_summary_unconfigured`, `ai_summary_failed` og
`ai_summary_cache_write_failed`, med request-ID, side, modell, varighet og
tokenbruk. Prompt, respons, API-nøkler og klientadresse logges ikke.
Ingen eksterne varsler eller modellfallback er konfigurert av denne endringen.

## Verifisering

```sh
pnpm build:ai-sources
node --test tests/ai-summary.test.cjs
pnpm typecheck
pnpm build
```

Kontroller mobil og desktop: én inngang per produkt/artikkel, ingen kall før
klikk, gradvis tekst, kollaps/gjenåpning uten nytt kall, avbryt, feil med
«Prøv igjen», og fortsatt tilgjengelig originalinnhold. API-responsen har
`X-AI-Summary-Cache: MISS` eller `HIT`. Schema-validering er ikke en semantisk
faktasjekk; stikkprøver må også sammenlignes med kilden.

### Releasekontroll 5. november 2026

Releasegrenen `codex/ai-summary-production-ready` er isolert fra produksjons-
commit `91b4590471c7113a572a3cb628ee296c55642882`. Den inkluderer kun AI-kilder,
API/UI, integrasjon på produkt-/artikkelsidene, avhengigheter og tester.
Artikkeltekstene genereres fra innholdet i denne grenen.

- 13 kontrakttester dekker kildeavgrensning, cache, strømfeil, avbrudd,
  ufullstendige svar, separat Gateway-nøkkel og ratebegrensning.
- Full `pnpm typecheck`, avgrenset ESLint og `pnpm build` bestod i releasegrenen.
  Bygget genererte 110 sider og validerte 30 interne MDX-lenker.
  Lokalt bygg brukte eksisterende Shopify-miljø uten å skrive eller vise nøkler.
- Preview skal verifisere ekte produkt- og artikkelsvar, Runtime Cache
  `MISS → HIT`, ingen modellkall før klikk, mobil/desktop og avbryt/prøv igjen.
- Begrensningen i minnet er per instans. Et Gateway-budsjett er separat og
  må kontrolleres mot autentiseringsmetoden som faktisk brukes. Et prosjekt-
  budsjett gjelder OIDC; en nøkkel trenger nøkkelbudsjett. Ikke bruk automatisk
  fallback til annen nøkkel/modell når budsjettet er brukt opp.
- Produksjon krever eget klarsignal etter `AGENTS.md`. Etter publisering må
  eksakt commit, `READY`, alias og funksjon på `utekos.no` bekreftes.

Lokale sensitive miljøvariabler kan være utelatt av `vercel env run`.
En lokal Gateway-test kan bruke eksisterende OIDC:

```sh
vercel env run -e preview -- pnpm dev
```

En lokal test er ikke bevis for delt Runtime Cache. Preview-testen skal
bruke den konkrete deployment-URL-en med eksisterende Vercel-autentisering.
Ikke slå av Deployment Protection eller lagre testenes OIDC-token.

Oppdaterte referanser:
- https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
- https://ai-sdk.dev/docs/ai-sdk-ui/object-generation
- https://vercel.com/docs/caching/runtime-cache
- https://vercel.com/docs/ai-gateway/authentication-and-byok
- https://vercel.com/academy/ai-summary-app-with-nextjs

Academy-serien er gjennomgått, men dens `generateObject`-eksempler og gamle
modellvalg er ikke brukt. Wikiens klikkmønster er videreført uten kunstig
ventetid, vilkårlig lesing av MDX-filbaner eller den separate Watsonx-reserven.

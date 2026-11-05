# Kortversjonen

Funksjonen er deaktivert som standard. Både UI og API krever
`NEXT_PUBLIC_AI_SUMMARY_ENABLED=true`. Produksjon skal være deaktivert inntil
brukeren godkjenner den reviderte versjonen. Kun preview-grenen
`codex/ai-summary-production-ready` har aktiveringsvariabelen.

## Innhold og datakilder

- Brain-ikon og tittelen «Kortversjonen» på produkter, og «Oppsummer denne
  artikkelen for meg» på artikler. Ingen synlig genereringssetning;
  en liten indikator har tilgjengelig status og respekterer redusert bevegelse.
- Produkter har ett avsnitt på maksimalt 35 ord, inkludert vesentlige forbehold,
  og inntil 20 ord om kundeerfaringer i tillegg.
- Artikler har 950–1000 tegn med mellomrom, fordelt på «Omfang» (ca. 15 %),
  «Hva lærer du?» (ca. 20 %) og «Rask oppsummering av innhold» (ca. 65 %).
  Den siste delen har 3–5 hovedpunkter med minst ett underpunkt. Fordelingen
  tillater fem prosentpoeng avvik per del. Tegn telles som Unicode-kodepunkter
  etter NFC-normalisering og sammenslåing av mellomrom, med ett mellomrom
  mellom hver tekstblokk. De tre underoverskriftene inngår; knapptittel,
  AI-merknad, JSON og CSS-punktmarkører inngår ikke.
- Produkter bruker samme lokale beskrivelse og trekkspilldata som siden,
  med Shopify-beskrivelsen som reserve. Bare publiserte handles aksepteres.
- Judge.me hentes med `getJudgeMePreview(product.id, 40)` fra den
  offentlige produktwidgeten. Ett kall med fem sekunders timeout unngår full
  paginering mens leseren venter. Den eksisterende adapteren kontrollerer produkt-ID
  og publiserte omtaler, og cacher data i fem minutter. Butikkomtaler blandes
  ikke inn i produktomtaler. Manglende data er ikke null omtaler.
- Gjennomsnitt og totalantall kommer direkte fra Judge.me, uten modellberegning.
  Modellen får maksimalt 40 publiserte omtaler, med stjerner og avgrenset tittel/tekst.
  Navn, ID, kjøpsstatus og dato sendes ikke til modellen. Ved delvis dekning
  viser UI hvor mange omtaler som inngår. Kritikk må beholdes; kundeerfaringer
  skal ikke presenteres som dokumenterte produktegenskaper.
- Artiklene bygges fra MDX uten å kjøre uttrykk/importer. Alle 12 registrerte
  artikler støttes. `pnpm dev` og `pnpm build` regenererer kildene; ved redigering
  under en kjørende server brukes `pnpm build:ai-sources`.

## Modell, streaming og cache

AI SDK 7 `streamText`, `Output.object` og `useObject` brukes via AI Gateway.
Modellen er `google/gemini-3.8-flash`, bekreftet i Gateways katalog 5. november
2026. `thinkingConfig.thinkingLevel: 'low'` settes i både `providerOptions.google`
og `providerOptions.vertex`, siden Gateway kan bruke begge leverandørene.
Akkurat denne modellen støtter bare `low` og `high` ifølge modellkatalogen.
Den generelle `reasoning: 'minimal'` kan oversettes til `high`, og native
`minimal` støttes ikke av denne modellen; begge ble forkastet etter feil i
preview. En direkte sammenligning av tre modeller viste at 3.8 Flash med `low`
beholdt tydelige material-/produktforbehold med langt lavere latenstid.
Outputtaket er 1600 tokens for å gi plass til både intern
resonnering og gyldig JSON, mens synlig tekst har egne lengdegrenser.
Timeout reduseres fra 40 til 15 sekunder, med maksimalt én retry ved
midlertidig leverandørfeil innenfor samme tidsgrense. Funksjonsgrensen er 30 sekunder. `AI_SUMMARY_MODEL` kan overstyre
modellen; et bytte må testes for støtten til reasoning og strukturert output.
Artikler har maksimalt tre utkast innen én samlet frist på 15 sekunder, uten
automatisk leverandørretry. Ved feil lengde/fordeling får neste utkast målt
tegnantall og konkret korrigeringsbehov. Når ett tekstfelt kan bringe hele svaret
innenfor kravene, skrives bare dette feltet om; øvrig innhold beholdes.
Ugyldig JSON, leverandørfeil og avbrudd
stopper genereringen. Tekst avkortes eller fylles aldri mekanisk.

Ingen modellkall skjer ved sidevisning, prefetch eller bygg. SDK-klienten
lastes ved klikk. API-et strømmer først verifisert ratingmetadata og deretter
modellens kompakte produktobjekt. Artikkelutkast holdes tilbake til struktur,
tegnantall og fordeling er validert, slik at en eventuell korrigering ikke viser
leseren et ugyldig utkast. Resultatet valideres strukturelt og mot lengdegrenser.
Manglende omtaler kan aldri gi generert omtaletekst; tilgjengelig omtaletekst
må faktisk tas med. Validering er ikke en semantisk faktasjekk.

Vercel Runtime Cache lagrer bare fullførte, validerte svar i 24 timer. SHA-256-
nøkkelen inkluderer produkt-/artikkeltekst, omtaler, rating, antall, modell,
reasoning og promptversjon. Artikler har egen promptversjon; produktnøklene
endres ikke ved denne artikkelrevisjonen. Endringer i kilden gir nytt svar etter at kildecachen
oppdateres. Cache-lesefeil stopper generering; skrivefeil logges. Avbrudd og
ufullstendige svar lagres ikke. HTTP-avbrudd stopper modellen.
`vercel.ts` aktiverer Vercels nødvendige `supportsCancellation` kun for
`src/app/api/ai-summary/route.ts`; klientens abortsignal alene er ikke nok på
plattformen.

Et validert produkt-/omtalegrunnlag lagres også delt i fem minutter. Derfor
trenger et cachet svar ikke vente på Shopify/Judge.me ved hvert klikk eller
ved bytte av serverinstans. Endringer slår gjennom etter oppdatering av de
eksisterende Shopify-/Judge.me-cachene og utløp av kildens fem minutters cache;
dette er ikke sanntidsdata. Ukjent/feilet omtalegrunnlag caches ikke og gir
«Prøv igjen» uten modellkall; null publiserte omtaler er fortsatt et gyldig svar.

## Kostnader og kontroll

`AI_SUMMARY_GATEWAY_API_KEY` er dedikert til funksjonen, med godkjent tak på
10 USD per måned inkludert BYOK. Eksisterende autentiseringsreserve er
`AI_GATEWAY_API_KEY` eller Vercel OIDC når dedikert nøkkel ikke er konfigurert;
produksjon/preview skal derfor ha den dedikerte nøkkelen. Budsjettavslag gir
feil og bytter ikke automatisk nøkkel eller modell.

API-et tar bare `{ kind, slug }`, aldri fri tekst eller URL. Det avviser
kryssorigin, ugyldig JSON og mer enn 512 bytes. Den instanslokale grensen på
10 forespørsler/minutt er ikke et distribuert kostnadstak.

Logger registrerer request-ID, kilde/model, cachetreff, totalvarighet,
kildetid, tid til første modelltekst, antall utkast, input/output- og reasoning-tokens.
For artikler er første modelltekst et internt tidspunkt; leseren får først det
ferdig validerte resultatet. Tokenantall summeres over alle artikkelutkast.
Prompt, svar, nøkler og klientadresse logges ikke. Ingen nye bakgrunnsjobber,
varsler eller automatisk publisering er opprettet.

## Verifisering og publisering

Kjør `node --test tests/ai-summary.test.cjs`, avgrenset ESLint, `pnpm typecheck`
og `pnpm build`. Test aktivert versjon med preview-variabelen, ekte Gateway
og Judge.me. Kontroller kald generering, første tekst, ordgrenser, direkte
ratingtall, kritikk, manglende omtaler, delt cache MISS/HIT, mobil/desktop,
feil/prøv igjen, avbryt og ingen forespørsel før klikk. Sammenlign modelltekst
med kildene. Produksjonsaktivering krever nytt klarsignal etter AGENTS.md.

5. november ble den tidligere versjonen tatt ut i commit `587cf83`.
Revisjonens målinger og skjermbilder lagres utenfor Git i
`outputs/kortversjonen-20261105/` i den opprinnelige arbeidsmappen.

## Gjennomgåtte kilder

- [Review Display Components](https://vercel.com/academy/ai-summary-app-with-nextjs/review-display-components)
- [Modern Next.js Setup](https://vercel.com/academy/ai-summary-app-with-nextjs/modern-nextjs-setup)
- [Dynamic Routes and Static Generation](https://vercel.com/academy/ai-summary-app-with-nextjs/dynamic-routes-static-generation)
- [Type-Safe Data Layer](https://vercel.com/academy/ai-summary-app-with-nextjs/type-safe-data-layer)
- [Streaming Summaries](https://vercel.com/academy/ai-summary-app-with-nextjs/streaming-summaries)
- [AI Gateway Setup](https://vercel.com/academy/ai-summary-app-with-nextjs/ai-gateway-setup)
- [Structured Output](https://vercel.com/academy/ai-summary-app-with-nextjs/structured-output)
- [Prompt Engineering](https://vercel.com/academy/ai-summary-app-with-nextjs/prompt-engineering)
- [First AI Summary](https://vercel.com/academy/ai-summary-app-with-nextjs/first-ai-summary)
- [Smart Caching](https://vercel.com/academy/ai-summary-app-with-nextjs/smart-caching)
- [Observability and Monitoring](https://vercel.com/academy/ai-summary-app-with-nextjs/observability-monitoring)
- [AI SDK Google thinking configuration](https://ai-sdk.dev/providers/ai-sdk-providers/google)

Prinsippene for datakilder, kort prompt, streaming, cache og målinger er
anvendt på den eksisterende løsningen. Tutorialens eksempeldata, automatiske
modellkall ved sidevisning og oppgitte ytelsestall er ikke brukt som bevis for
Utekos. Installasjonens AI SDK 7- og Next.js-dokumentasjon styrer API-bruken.

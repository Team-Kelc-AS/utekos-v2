# Kortversjonen

Funksjonen er deaktivert som standard. Både UI og API krever
`NEXT_PUBLIC_AI_SUMMARY_ENABLED=true`. Produksjon skal være deaktivert inntil
brukeren godkjenner den reviderte versjonen. Kun preview-grenen
`codex/ai-summary-production-ready` har aktiveringsvariabelen.

## Innhold og datakilder

- Brain-ikon og tittelen «Kortversjonen». Ingen synlig genereringssetning;
  en liten indikator har tilgjengelig status og respekterer redusert bevegelse.
- Ett avsnitt på maksimalt 35 ord, inkludert vesentlige forbehold.
  På produktsider kommer inntil 20 ord om kundeerfaringer i tillegg.
  Tidligere hovedpunkter og egen forbeholdsliste er fjernet.
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
2026. `reasoning: 'minimal'` erstatter leverandørens standardnivå. Outputtaket
reduseres fra 2400 til 600 tokens, timeout fra 40 til 15 sekunder, uten automatisk
modellretry. Funksjonsgrensen er 30 sekunder. `AI_SUMMARY_MODEL` kan overstyre
modellen; et bytte må testes for støtten til reasoning og strukturert output.

Ingen modellkall skjer ved sidevisning, prefetch eller bygg. SDK-klienten
lastes ved klikk. API-et strømmer først verifisert ratingmetadata og deretter
modellens kompakte objekt. Resultatet valideres strukturelt og mot ordgrenser.
Manglende omtaler kan aldri gi generert omtaletekst; tilgjengelig omtaletekst
må faktisk tas med. Validering er ikke en semantisk faktasjekk.

Vercel Runtime Cache lagrer bare fullførte, validerte svar i 24 timer. SHA-256-
nøkkelen inkluderer produkt-/artikkeltekst, omtaler, rating, antall, modell,
reasoning og promptversjon. Endringer i kilden gir nytt svar etter at kildecachen
oppdateres. Cache-lesefeil stopper generering; skrivefeil logges. Avbrudd og
ufullstendige svar lagres ikke. HTTP-avbrudd stopper modellen.

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
kildetid, tid til første modelltekst, input/output- og reasoning-tokens.
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

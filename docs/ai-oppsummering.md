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

## Svartid, forberedelse og cache

Utseendet styres med Tailwind CSS 4-klasser i `ArticleSummaryDisclosure.tsx`,
`ProductAiSummary.tsx` og `PageAiSummaryContent.tsx`. Komponentene har ingen
CSS-modul. Markørens animasjoner registreres som `--animate-*` i Tailwinds
`@theme` i `globals.css`; spinneren bruker standard `animate-spin`.

Artiklene har ingen generering i klikkflyten. De tolv validerte oppsummeringene
ligger i `articleSummaries.generated.json` og rendres som lukket, innebygd
HTML `<details>` i siden. Med JavaScript viser klikket en tydelig merket
visningsanimasjon: «Leser artikkelinnhold...», «Analyserer kilder..» og
«Skriver oppsummering...» ved 0, 800 og 1600 ms. Merknaden «Visningsanimasjon –
teksten er generert på forhånd.» gjør det klart at dette ikke er ny behandling.
Fra 2500 ms avdekkes teksten ordvis, med små tilfeldige variasjoner og pauser
ved tegnsetting, innen et fast tidsbudsjett. Hele teksten er synlig ved 4000 ms;
markøren blinker ferdig og forsvinner ved 4800 ms. Klokken starter i klikkhendelsen,
og lukking avbryter animasjonen. Samme artikkel animeres bare ved første
åpning i den gjeldende nettlesersiden, også ved klientnavigasjon bort og tilbake.
En full sideoppdatering nullstiller dette; ingen cookies eller varig lagring
brukes. Ved ny åpning etter avbrudd vises hele teksten direkte.
Redusert bevegelse og JavaScript avslått gir
direkte visning. Det skjer ingen AI- eller API-kall ved klikk. Artikkelendepunktet kan
også returnere det samme ferdige resultatet med `X-AI-Summary-Cache: PREPARED`.

SHA-256-nøkkelen binder hver tekst til artikkelens tittel, ingress, MDX-innhold,
modell, reasoning og artikkelprompt. En endret kilde kan ikke bruke gammel
oppsummering. `pnpm build` kontrollerer at alle registrerte artikler har en
oppdatert og validert oppsummering; mangler stopper bygget. Kontroll gjør aldri
modellkall. Manuell forberedelse kjøres eksplisitt med
`pnpm prepare:article-summaries` i et Gateway-autentisert miljø, og tekstene
skal gjennomgås før publisering. Skriptet gjenbruker uendrede tekster og gir
maksimalt tre utkast per endret artikkel. Ved retting av ett felt beholdes
resten. Dette er redaksjonelt arbeid før publisering, aldri ventetid for leseren.

Modellen ved forberedelse og produktsammendrag er `google/gemini-3.8-flash`,
med `thinkingConfig.thinkingLevel: 'low'` for både Google og Vertex gjennom
AI Gateway. AI SDK 7 `streamText` og `Output.object` validerer struktur;
servervalidering håndhever tegnantall, fordeling, underpunkter og produktgrenser.
Produktvisningen bruker `useObject`, med fem sekunders maksimal nettverksventing.
Et produktmodellkall har 4,5 sekunders tidsgrense og maksimalt én leverandørretry
innen samme grense. Avbrudd stopper modellen; ingen delvise resultater caches.
`vercel.ts` aktiverer `supportsCancellation` for API-ruten.

Vercel Runtime Cache lagrer ferdige produktresultater i 24 timer. Nøkkelen
inkluderer produktdata, omtaler, rating, antall, modell, reasoning og prompt.
Et validert produkt-/omtalegrunnlag lagres delt i fem minutter, i tillegg til
Shopify-/Judge.me-cachene. Ukjent omtalegrunnlag gir feil uten modellkall;
null publiserte omtaler er et gyldig svar. Cachelesefeil stopper generering;
skrivefeil logges. Artiklene har ingen tidsbasert utløpstid: de følger den
publiserte kildeversjonen, så første leser slipper også å vente.

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
kildetid, tid til første modelltekst og input/output-/reasoning-tokens for produkter.
Artikkelendepunktet logger bare levering av ferdig resultat, uten modellbruk.
Prompt, svar, nøkler og klientadresse logges ikke. Ingen nye bakgrunnsjobber,
varsler eller automatisk publisering er opprettet.

## Verifisering og publisering

Kjør `node --test tests/ai-summary.test.cjs tests/article-presentation.test.cjs tests/judgeme.test.cjs`, avgrenset
ESLint, `pnpm typecheck` og `pnpm build`. Kontroller alle tolv artikler mot
kildene, tegnantall, tredeling og underpunkter. Verifiser statusrekkefølge,
delvis tekst, markør, full tekst innen fem sekunder fra klikk, lukking/åpning,
redusert bevegelse og visning uten JavaScript på mobil og desktop. Produkter skal beholde Judge.me,
35/20-ordsgrenser, cache, avbryt og feil/prøv igjen; femsekundersfristen testes
med forsinket svar. Produksjonsaktivering krever nytt klarsignal etter AGENTS.md.

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

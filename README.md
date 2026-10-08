# Utekos v2

Server-first omskriving av Utekos-nettbutikken med Next.js, React og Shopify.
Arbeidet lagres foreløpig i det private repoet `Team-Kelc-AS/utekos-v2`.
`utekos-headless` er referanseprosjektet og skal ikke motta endringer fra denne
arbeidskopien før en senere, uttrykkelig avtalt overføring.

Sporingsbackend ligger separat i `Team-Kelc-AS/utekos-tracking-backend`.
Se [sporingsoversikten](docs/tracking/README.md) og
[forhandlerflyten](docs/tracking/dealer-inquiries.md) for kontrakter og
produksjonsgrenser.

## Lokal utvikling

Bruk pnpm-versjonen angitt i `package.json`. Miljøvariabler legges i
`.env.local` via prosjektets sikre miljøoppsett; hemmeligheter følger ikke repoet.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Kontroller

```sh
pnpm build
pnpm lint
pnpm tracking:contracts
node --test --test-concurrency=1 tests/*.test.cjs
NODE_OPTIONS='--conditions=react-server' pnpm exec tsx --test tests/tracking-gateway.test.ts
```

## Git

Arbeid på `main`. Kontroller endringene og `git remote -v` før innsending.
Den avtalte innsendingen er:

```sh
pnpm run sync "Beskriv endringen"
```

Kommandoen legger til lokale endringer, oppretter en commit og pusher til
oppsatt upstream. Denne innsendingen setter ikke opp Vercel-publisering.
Produksjonssetting og senere overføring til `utekos-headless` avtales separat.

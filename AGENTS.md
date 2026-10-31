## Prosjektets formål

Utekos v2 er en omskriving av `../utekos-headless` for en ryddigere, raskere og mer vedlikeholdbar nettbutikk. Migrer nødvendig innhold og funksjonalitet, og vurder gammel kode kritisk. Prioriter server først, minimal klientlogikk, Utekos-identitet, SEO, brukervennlighet og konvertering. Unngå unødvendige URL-endringer som kan svekke eksisterende SEO.

## Kritisk: annonser, sporing og deploy

- `utekos.no` bygges fra `Team-Kelc-AS/utekos-v2` i Vercel-prosjektet `utekos-headless` (gammelt prosjektnavn). `backend.utekos.no` bygges fra `Team-Kelc-AS/utekos-tracking-backend` i `utekos-backend`. Shopify-appen har eget repo, `Team-Kelc-AS/utekos-shopify-platform-app`, og krever egen appversjon. Bekreft `origin`, `.vercel/project.json`, eksakt commit og kontoen `utekos-brand`; bruk ikke avviklet `UtekosKristoffer`.
- Spor hele kjeden fra annonse-URL og uendret `fbclid` via Next.js `proxy.ts`, `_fbc`/`_fbp`, Parameter Builder, Meta Pixel, Shopify Admin/custom pixels og Klarna til backend, Redis/Supabase og direkte CAPI. Ta med GTM/Stape-tagger og parameterfiltrering, Vercel, Shopify-apper/webhooks, Resend-lenker, GA4/Google Ads og Microsoft Ads/UET. Meta CAPI Gateway skal forbli avslått; ingen ekstra Meta-servertransport.
- Bevar klikk-ID og hendelsestid; ikke forkort, endre tegnstørrelse eller bytt identitet. Respekter samtykke og bruk samme hendelses-ID for Pixel/CAPI-deduplisering. Les gjeldende leverandørdokumentasjon og verifiser faktisk payload, naturlig mottak og leveringstid; organisk trafikk eller grønne tester alene forklarer ikke lav ClickID-dekning.
- Følg gjeldende brukerautorisasjon ved publisering. Reparer manglende miljøvariabler i riktig Preview/Production-miljø og bygg på nytt; la ikke ferdig arbeid bli liggende som utkast. Publiser avhengig backend før storefront, kontroller Vercel `Ready` på riktig domene og aktiv Shopify-appversjon, og mål deretter naturlige hendelser hos Meta.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI DESIGN

Se [DESIGN.md](./DESIGN.md)

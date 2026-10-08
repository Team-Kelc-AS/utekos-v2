# Produktsider og handlekurv

Lokalt implementert på `main` 5. oktober 2026. Ikke publisert. Klarna Express Checkout er fortsatt uferdig og avventer avklart betalings-/capture-ansvar og integrasjonstester.

## Implementasjon

De seks eksisterende produkt-URL-ene bruker samme serverbaserte `getProduct`, cachepolicy, metadata og canonical. Spørringen henter produkt-ID, alle bilder og varianter med paginering, alternativer, variantbilder og førpris. Manglende eller gjentatt cursor gir feil fremfor avkortede data.

`SelectedProduct` velger varianten på serveren fra numerisk/GID `variant` eller eksisterende `farge`, `storrelse` og `kjonn`. TechDown-aliasene er bevart og Liten er skjult. Pris, lagerstatus, galleri, ønskeliste og begge kjøpsknappene får samme variant. `VariantOptions` håndterer bare navigasjon, ventetilstand og fokus. Produktbeskrivelse, detaljer, størrelsesguider, fraktinformasjon og relaterte produktlenker rendres på serveren; informasjon foldes ut med den felles shadcn Accordion-komponenten (Base UI). Bare ett felt kan være åpent per gruppe. `hiddenUntilFound` beholder også lukkede svar i serverrendret HTML; Base UI håndterer interaksjonen på klienten.

Galleri, kjøpsknapp, lokal ønskeliste og dialogutløsere er egne klientøyer. Mobil kjøpslinje bruker serverrendret produkt-/varianttekst og den samme lille kjøpsknappen. Bilderekkefølge, produkttekst og størrelsesdata er hentet fra headless. Originalfiler er bevart; responsive `picture`-kilder beholder faktiske dimensjoner. Google Sans Flex med den verifiserte opsz=120-mappingen, Medium 500/ExtraBold 800 og Utekos-paletten brukes.

Handlekurven bruker egne typede Route Handlers og eksisterende private Shopify-klient, uten Hydrogen. Mutasjoner returnerer oppdatert kurv og Shopify-varsler. En vanlig endring i eksisterende kurv krever én Shopify-mutasjon. Komplett kurv-ID ligger i en HttpOnly-cookie; svar er private/no-store. Serveren validerer origin, variant, handling og antall. Lagerbegrensninger håndteres av Shopify og vises i panelet. Dobbel innsending blokkeres i klienten. Kurvpanelet lastes ved åpning eller etter tillegg; headeren kan forhåndslaste panelets kode ved fokus/pekerinteresse. Ingen produkt-provider eller sideoppfriskning ved kurvendring.

Ønskelisten bruker samme `utekos_wishlist_v1`-format per variant. Dialogen og Facebook SDK-koden er utsatt. E-post/Google går til samme Shopify-hostede kontoalternativ som dagens ukonfigurerte OAuth-fallback i headless. Kontosynkronisering av ønskelisten er ikke implementert. Facebook er en separat, valgfri identitetstilkobling; manglende konfigurasjon vises bare i dialogen. SDK-ens automatiske apphendelser er deaktivert. Ingen ny sporing er lagt til.

Dun viser ventelisten automatisk etter tre sekunder når produktet er utsolgt. Navn, e-post, telefon og personvernbekreftelse sendes gjennom eksisterende Resend-oppsett. Markedsføringssamtykke er separat og frivillig. Med Admin-konfigurasjon utføres minimal kundeoppdatering og separat samtykkemutasjon bare ved opt-in; uten konfigurasjon sendes ønsket til kundeservice og dette forklares i kvitteringen.

## Verifikasjon

- Avgrenset ESLint uten feil/advarsler, `pnpm exec tsc --noEmit`, `pnpm build` (40 ruter) og `git diff --check` passerer.
- `node --test tests/product-commerce.test.cjs`: 20/20 tester. Dekker variantlenker/aliaser/ugyldige kombinasjoner, skjult Liten, paginering/cursorfeil, ventelistevalidering, providerfeil, idempotens og separat samtykke. Provider-kall er isolerte mocks, uten ekte e-postutsending.
- Seks produkter × 375/767/768/1440 px: kontrollert font/opsz/vekt, bildeformat, mobil kjøpslinje og overflow; ingen JavaScript-sidefeil. Originale representative bilder er åpnet og kontrollert. 54 opprinnelig migrerte lokale bilder ble hash-sammenlignet med headless; de to ekstra Comfyrobe-mobilbildene ble også kopiert direkte fra originalene.
- Nettlesertest: variantlenker, størrelsesalias, fargevalg, tilbake/frem, fokus etter navigasjon, utsolgt Dun, tresekunderspopup, valgfritt samtykke, ønskeliste etter reload, Escape/fokusretur og nullstilling av mobilmeny ved desktopbredde passerer.
- Ekte Shopify Storefront-kurv: opprett, legg til, endre antall, hent og fjern passerer. Checkout-endepunktet returnerte HTTPS-adresse. Kurvcookie er HttpOnly; kurv-ID/hemmelig nøkkel finnes ikke i JSON-svaret. Ingen ordre, betaling eller kundepåmelding ble gjennomført.
- Cross-origin og ugyldige kurvoperasjoner avvises; simulert nettverksfeil vises lokalt i kurven uten sideoppfriskning.

Testartefakter: `/tmp/utekos-product-verification/` (skjermbilder, matrix-*.json, flows.json, baseline.json, after.json og testskript). De første lange nettleserkjøringene ble avbrutt/timet ut og ble erstattet av fullførte kjøringer per bredde. En Shopify CDN-forespørsel timet ut; en ny direkte kontroll ga HTTP 200. Dette er ikke bevis på CDN-oppetid over tid.

## Målt ytelse

Tre nye nettleserkontekster per versjon, Chrome headless, mobil 375×812, 80 ms nettverkslatens, 2 Mbps ned/1 Mbps opp og 4× CPU-throttling; lokalt produksjonsbygg på `/produkter/utekos-techdown`. Målepunkt: network-idle + tre sekunder, før interaksjon. Ingen andre testskript kjørte parallelt med de rapporterte ettermålingene.

| Måling | Før (minimal produktside) | Etter (denne leveransen) |
| --- | --- | --- |
| Overført JavaScript inkl. ressursheadere | 148 160 byte | 157 172 byte |
| Dekodet JavaScript | 485 519 byte | 508 338 byte |
| Ressursforespørsler | 20 | 23 |
| LCP, tre kjøringer | 2816 / 1148 / 1108 ms | 1600 / 1952 / 1240 ms |
| CLS, tre kjøringer | 0,15349 / 0 / 0 | 0,00019 / 0,02619 / 0,00019 |

Baseline manglet galleri og handelsfunksjoner. Første baseline hadde kaldere serverrespons (TTFB 1644 ms; øvrige 34–45 ms), mens ettermålingene hadde 24–83 ms. Tre lokale laboratoriemålinger med ulik funksjonsmengde kan ikke dokumentere bedre faktisk brukeropplevelse eller felt-INP.

18 offentlige varianter er kontrollert med direkte variant-ID: valgt variant, produktbeskrivelse og navigasjonslenker finnes i serverens HTML. Fem utsatte dialog-/SDK-chunks var fraværende før åpning. Galleritastatur og utfoldet størrelsestabell uten mobil-overflow er også kontrollert. Event Timing for galleritastatur, størrelsesguide og ønskeliste viste 16–56 ms under samme nettverks-/CPU-begrensning. Dette er observerte laboratorieinteraksjoner, ikke felt-INP.

## Eksterne forutsetninger

Resend-leveranse og markedsføringssamtykke er kontrakttestet, ikke bekreftet mottatt av eksterne tjenester. Facebook-konfigurasjon mangler lokalt, og ekte Facebook/Google/e-postinnlogging er ikke fullført. Vanlig produktvisning og Shopify-kurv fungerer uten disse tjenestene.

Relevante kilder: installerte Next.js 16.3.8-guider for Server/Client Components, lazy loading og Route Handlers; [Shopify cart warnings](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/cart-warnings); [Hydrogen React AddToCartButton](https://shopify.dev/docs/api/hydrogen-react/latest/components/cart/addtocartbutton). Native Shopify-dokumentasjon og skjemavalidering bekreftet `cartCreate.warnings` og separate Admin-mutasjoner for kunde og e-postsamtykke.

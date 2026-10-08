# Migreringsmatrise for sporing

Kilde låst til headless-commit `e74e6cd8310c88f2777cbfdf5ad6b431647d7f77`.
Denne matrisen er laget fra evaluert `src/lib/analytics/eventCatalog.ts`, de faktiske
Zod-skjemaene, `server/providerAdapterRegistry.ts`, backend-rutekatalogen og
v2s runtime/UI. Katalogens ord «active» er kildekodestatus, ikke ferskt bevis på
leverandørmottak. **Alle produksjonsleveranser og mottakerdeduplisering er
`unverified` inntil en korrelert testreise er observert.**

## Felles kontrakt

Alle kanoniske hendelser beholder `schema_version=1`, opprinnelig `event_time`
(ISO med offset), `event_id` (UUID), `event_name`, faktisk source og miljø.
Gjensending gjenbruker ID og tid. Nettbutikkhendelser bruker operator-policy
`analytics=marketing=preferences=granted`, `source=operator_policy`, `version=1`.
Dette er ikke et registrert brukervalg. Shopify privacy beholdes separat som
observerte plattformdata.

`page_view_id`, `journey_id`, `previous_page_view_id`, faktisk side/referrer og
source-bevis korrelerer reisen. Hendelses-ID i Pixel er samme ID som collector,
ledger og CAPI. Ledger-idempotens er `event_name + event_id`; leverandørnøkler
beholder provider/event/ID-kontrakten fra headless.

Commerce bruker faktisk Shopify product-/variant-GID og varelinjedata:
`item_id`, `product_id`, `variant_id`, `quantity`, `unit_price`,
`gross_unit_price`, `tax_amount`, `tax_rate`, `taxable`, `price_includes_tax`,
`currency`, `value`, `gross_value`, `tax_value`, tilgjengelighet, valgte opsjoner
og reelle katalogmetadata. Nettobeløp, brutto, skatt, kjøpsverdi,
`estimated_profit` og faktisk `profit` holdes adskilt.

Browser-correlasjon samler ekte click IDs, `_fbp`/`_fbc`, GA client/session og
Microsoft-identitet. Serververifisert Facebook-ID, IP/UA/geografi og eventuell
kundeidentitet kommer fra betrodd backendbro, ikke fra klientpåstander.
Klientpayload, komplette cookies og rå kundeopplysninger skal ikke logges.

## Hendelseskilder, collectors og domenenøkler

`V2` betyr at faktisk UI-/mutasjonsflate finnes og har et lokalt kodepunkt.
Beskrivelsene angir kontrakten som skal verifiseres; de utgjør ikke automatisk
bestått akseptanse. Collectors med `/api/events/` er relative adresser i v2 og
sendes bare gjennom den avgrensede autentiserte broen til headless.

| Hendelse | V2-kilde / beholdt ansvar | Collector / inngang | Domenenøkkel fra kildekatalog |
|---|---|---|---|
| `page_view` | V2: `reportNavigation` etter committed navigasjon; ny ID ved ekte ny visning. | `/api/events/page-view` | `navigation_id` |
| `view_item_list` | V2: synlige ProductCard/VariantCard med navngitt liste. Bevar 50% / 1000 ms / 50 ms batch / maks 20. | `/api/events/view-item-list` | `page_view_id + item_list_id + impression_sequence` |
| `select_item` | V2: akseptert produktlenke fra faktisk varekort. | `/api/events/select-item` | `interaction_id` |
| `view_item` | V2: resolved PDP-variant og synlig produktsentinel. Gammel RSC-DOM skal avvises. | `/api/events/view-item` | `page_view_id + product_id + variant_id + view_sequence` |
| `add_to_wishlist` | V2: vellykket ny localStorage-mutasjon; bruk faktisk saved.added/mutationId/addedAt. | `/api/events/add-to-wishlist` | `wishlist_mutation_id` |
| `add_to_cart` | V2: bekreftet Shopify-delta; aldri bare knappeklikk eller optimistisk state. | `/api/events/add-to-cart` | `cart_mutation_id` |
| `remove_from_cart` | V2: bekreftet negativt Shopify-delta; normal ordre-mutasjon blir ikke en ekstra hendelse. | `/api/events/remove-from-cart` | `cart_mutation_id` |
| `view_cart` | V2: handlekurvflaten åpnet med resolved innhold. | `/api/events/view-cart` | `page_view_id + cart_id + view_sequence` |
| `begin_checkout` | V2: bekreftet checkout-URL/Express-forberedelse og skrevne attribusjonsattributter før navigasjon. | `/api/events/begin-checkout` | `checkout_id + creation_revision` |
| `add_shipping_info` | Beholdt headless: verifisert Shopify checkout-observasjon; ingen ny v2-generator. | `/api/shopify/checkout-observations` | `Shopify checkout_shipping_info_submitted event_id` |
| `add_payment_info` | Beholdt headless: verifisert Shopify payment_info_submitted; beviser ikke betalt ordre. | `/api/shopify/checkout-observations` | `Shopify payment_info_submitted event_id` |
| `purchase` | Beholdt headless: HMAC-verifisert orders/paid. V2 er bare kompatibilitetsrute. | `/api/shopify/webhooks/orders-paid` | `Shopify order legacy ID + paid state` |
| `refund` | Beholdt headless: HMAC-verifisert refunds/create. V2 er bare kompatibilitetsrute. | `/api/shopify/webhooks/refunds-create` | `refund_id` |
| `search` | Ingen aktiv v2-søkekilde funnet; behold kontrakt, send ingen konstruert hendelse. | `/api/events/search` | `search_id` |
| `view_search_results` | Ingen aktiv v2-søkeresultatkilde funnet. | `/api/events/view-search-results` | `search_id + result_revision` |
| `view_promotion` | V2: faktisk kampanjeelement minst 50% synlig sammenhengende i 1 sekund. | `/api/events/view-promotion` | `page_view_id + promotion_id + impression_sequence` |
| `select_promotion` | V2: akseptert lenkehandling fra faktisk kampanjeelement. | `/api/events/select-promotion` | `interaction_id` |
| `generate_lead` | V2: akseptert Dun-venteliste persisteres i eksisterende headless lead-flyt med gjeldende verdipolicy. Kontakt produserer bare `form_submit`. Browser speiler Lead først etter kanonisk readback. | Intern brooperasjon `/internal/storefront/accepted-dun-waitlist`; kanonisk headless-handler | `submission_id` |
| `form_start` | V2: første meningsfulle verdiendring i kontakt/venteliste, aldri focus alene. | `/api/events/form-start` | `form_id + page_view_id` |
| `form_submit` | V2 har kontakt/venteliste. Krever serveraksept og original submission_id; source=server. | `/api/events/form-submit` | `submission_id` |
| `form_error` | V2 har kontakt/venteliste. Krever vist definitiv feil og original attempt_id; ingen fritekst/PII. | `/api/events/form-error` | `attempt_id` |
| `filter_apply` | Ingen aktiv v2-filtermutasjon med committed result_revision funnet. | `/api/events/filter-apply` | `interaction_id + result_revision` |
| `sort_apply` | Ingen aktiv v2-sorteringsmutasjon med committed result_revision funnet. | `/api/events/sort-apply` | `interaction_id + result_revision` |
| `variant_select` | V2: valgt variant faktisk committed av RSC; lenkeklikk alene er utilstrekkelig. | `/api/events/variant-select` | `interaction_id + variant_id` |
| `size_guide_view` | V2: synlig størrelsesguide-side eller åpnet PDP-guide. | `/api/events/size-guide-view` | `page_view_id + guide_id + open_sequence` |
| `checkout_error` | Katalogstatus blocked_source. Ingen fabrikasjon fra timeout/usikker betalingsstatus. | `Ingen aktiv collector` | `checkout_attempt_id` |
| `payment_error` | Katalogstatus blocked_source. Ingen fabrikasjon fra timeout/usikker betalingsstatus. | `Ingen aktiv collector` | `payment_attempt_id` |
| `scroll_depth` | V2: første kryssing av 25/50/75/90% per page_view. | `/api/events/scroll-depth` | `page_view_id + threshold` |
| `view_category` | V2: aktuell kategori synlig; gammel kategori under overgang skal avvises. | `/api/events/view-category` | `page_view_id + category_id + view_sequence` |
| `hero_interact` | V2: faktisk klikk på hjemmesideheroens CTA. | `/api/events/hero-interact` | `page_view_id + cta_id + click_sequence` |
| `interact_with_accordion` | V2: bruker åpner tidligere lukket PDP-accordion; resolved faktisk variant. | `/api/events/interact-with-accordion` | `page_view_id + product_id + variant_id + accordion_id + interaction_sequence` |
| `open_quick_view` | Ingen quick-view-dialog finnes i v2. Ikke erstatt produktnavigasjon med denne hendelsen. | `/api/events/open-quick-view` | `page_view_id + source_surface + product_id + variant_id + open_sequence` |
| `video_progress` | V2: faktisk video passerer 10/25/50/75/90/100%, én gang per side/video/milepæl. | `/api/events/video-progress` | `page_view_id + video_id + milestone` |
| `meta_app_event` | Eksisterende autentisert headless-produsent. Ikke en nettbutikkhendelse; ingen v2-generator. | `Beholdt autentisert headless-ingest` | `source_type + source event_name + source event_id` |
| `meta_offline_event` | Eksisterende autentisert headless-produsent. Ikke en nettbutikkhendelse; ingen v2-generator. | `Beholdt autentisert headless-ingest` | `source_type + source event_name + source event_id` |

## Eksakte utløsere og nødvendige felt

Ordlyden nedenfor er beholdt fra kildekatalogen for kontroll av semantisk paritet.
Det er ingen tillatelse til å opprette hendelser for funksjoner som mangler i v2.

| Hendelse | Trigger fra kilde | Gjentakelse | Nødvendige kildedata |
|---|---|---|---|
| `page_view` | Create after the initial canonical view is committed or a Next.js navigation has completed with its final URL. | Once per committed navigation. | `final canonical URL`, `page title`, `page_view_id`, `consent snapshot` |
| `view_item_list` | Create when a named product list and its resolved items are actually visible. | May repeat for a new list impression sequence on the same page. | `page_view_id`, `item_list_id`, `impression_sequence`, `resolved items` |
| `select_item` | Create when an accepted product or variant selection resolves its destination and selected item context. | Each accepted product-selection interaction is new. | `interaction_id`, `item_list_id`, `selected item`, `resolved destination or variant URL` |
| `view_item` | Create when the product and selected variant are resolved and the product view is visible. | May repeat for a new product view or a newly resolved variant context. | `page_view_id`, `product_id`, `variant_id`, `currency`, `value`, `items`, `consent snapshot` |
| `add_to_wishlist` | Create only after the wishlist store confirms that the item was persisted. | Each successful wishlist mutation is new. | `mutation_id`, `item`, `updated wishlist state` |
| `add_to_cart` | Create after Shopify accepts the cart mutation and returns the updated cart containing the line. | Each successful Shopify cart mutation is new. | `cart_mutation_id`, `updated cart id`, `accepted line`, `currency`, `value` |
| `remove_from_cart` | Create after Shopify accepts removal and returns an updated cart without the targeted quantity. | Each successful Shopify removal mutation is new. | `cart_mutation_id`, `updated cart id`, `removed item`, `currency`, `value` |
| `view_cart` | Create when the cart page or drawer and its resolved cart contents are actually visible. | May repeat for a new qualifying cart view sequence. | `page_view_id`, `cart_id`, `view_sequence`, `resolved items` |
| `begin_checkout` | Create after Shopify returns a valid checkout token or URL for the resolved cart. | Each newly created checkout is new. | `cart_id`, `checkout_id or token`, `creation revision`, `currency`, `value`, `items` |
| `add_shipping_info` | Create when Shopify emits checkout_shipping_info_submitted and the PII-free begin_checkout correlation resolves to a consented canonical source. The event proves that a shipping rate was chosen. | Each Shopify shipping-information submission is new. | `Shopify checkout_shipping_info_submitted source event`, `checkout_id`, `begin_checkout_event_id correlation`, `stable Shopify source event id used as shipping revision`, `analytics consent`, `items` |
| `add_payment_info` | Create when Shopify emits payment_info_submitted and the PII-free begin_checkout correlation resolves to a consented canonical source. payment_info_submitted proves submission only, not payment success. | Each Shopify payment-information submission is new. | `Shopify payment_info_submitted source event`, `checkout_id`, `begin_checkout_event_id correlation`, `stable Shopify source event id used as payment revision`, `analytics consent`, `items` |
| `purchase` | Create from the verified Shopify Admin Order payment notification webhook; reconciliation is duplicate-safe missed-delivery recovery. | Webhook retries and reconciliation observations for the same order reuse the same event_id and become duplicates. | `verified webhook`, `order_id`, `financial state`, `transaction_id`, `currency`, `value`, `items`, `checkout consent snapshot` |
| `refund` | Create from the verified Shopify Admin Refund create notification webhook; reconciliation is duplicate-safe missed-delivery recovery. | Webhook retries and reconciliation observations for the same refund reuse the same event_id and become duplicates. | `verified webhook`, `refund_id`, `transaction_id`, `currency`, `refunded value`, `refunded items`, `checkout consent snapshot` |
| `search` | Create after an explicit search request resolves to a result state. | Each explicit resolved search is new. | `search_id`, `normalized search term`, `result state` |
| `view_search_results` | Create when the resolved search-result revision is actually visible. | Each visible result revision is new. | `search_id`, `result_revision`, `normalized search term`, `result count` |
| `view_promotion` | Create when a promotion is at least 50 percent visible for at least one continuous second. | Each qualifying promotion impression on a page view is new. | `page_view_id`, `promotion_id`, `creative identity`, `impression sequence` |
| `select_promotion` | Create when an accepted promotion selection initiates its intended action or navigation. | Each accepted promotion interaction is new. | `interaction_id`, `promotion_id`, `creative identity`, `destination` |
| `generate_lead` | Create only after the lead or contact submission is accepted and persisted. | Each accepted lead submission is new. | `submission_id`, `form_id`, `lead classification without PII`, `approved versioned monetary-value policy` |
| `form_start` | Create on the first meaningful value change in a form, never on focus alone. | Once per form and page view. | `form_id`, `page_view_id`, `field category without value` |
| `form_submit` | Create only after the submission service accepts the form submission. | Each accepted submission is new. | `submission_id`, `form_id`, `result without PII` |
| `form_error` | Create when a definitive validation or server failure is presented for a submission attempt. | Each failed submission attempt is new. | `attempt_id`, `form_id`, `safe error category`, `visible failure state` |
| `filter_apply` | Create after the selected filters have produced and committed an updated product result revision. | Each committed filter result revision is new. | `interaction_id`, `result_revision`, `safe filter keys`, `result count` |
| `sort_apply` | Create after the selected sort has produced and committed an updated product result revision. | Each committed sort result revision is new. | `interaction_id`, `result_revision`, `sort key`, `result count` |
| `variant_select` | Create after the selected variant is resolved and committed to the product state. | Each committed variant selection is new. | `interaction_id`, `product_id`, `variant_id`, `availability` |
| `size_guide_view` | Create when the requested size-guide dialog or surface is actually visible. | Each qualifying open sequence is new. | `page_view_id`, `guide_id`, `open_sequence` |
| `checkout_error` | Create only when an approved authoritative checkout source reports a definitive checkout failure. | Each failed checkout attempt is new. | `approved authoritative source`, `checkout_attempt_id`, `safe error category` |
| `payment_error` | Create only when an approved authoritative payment source reports a definitive payment failure. | Each failed payment attempt is new. | `approved authoritative source`, `payment_attempt_id`, `safe error category` |
| `scroll_depth` | Create once as each explicit 25, 50, 75, or 90 percent depth threshold is crossed. | Once per page view and threshold. | `page_view_id`, `threshold`, `document height` |
| `view_category` | Create when a category or collection surface is actually visible. | Once per page view, category, and view sequence. | `page_view_id`, `category_id`, `category_name`, `view_sequence` |
| `hero_interact` | Create when the homepage hero CTA (Se mer / ReadMoreHeroClick) is clicked. | Once per page view, CTA, and click sequence. | `page_view_id`, `cta_id`, `destination_path`, `click_sequence` |
| `interact_with_accordion` | Create after a user opens a previously closed PDP product-details accordion. | Each user-triggered closed-to-open transition receives a new interaction sequence. | `page_view_id`, `resolved product and variant`, `accordion_id`, `accordion title`, `interaction_sequence` |
| `open_quick_view` | Create only after the quick-view dialog is open and its product and selected variant are resolved. | Each successfully opened, resolved dialog receives a new open sequence. | `page_view_id`, `source_surface`, `open_sequence`, `resolved product and selected variant` |
| `video_progress` | Create once as each explicit 10, 25, 50, 75, 90, or 100 percent video milestone is crossed. | Once per page view, video, and milestone. | `page_view_id`, `video_id`, `video duration`, `milestone` |
| `meta_app_event` | Accept an event only after the native app has observed it and supplied the complete Meta app-event contract. | Once per original app event_id; retries reuse the same source event_id. | `authenticated producer`, `app marketing consent`, `advertiser tracking state`, `exact 16-value app_data.extinfo`, `original event_id and event_time` |
| `meta_offline_event` | Accept an event only after an offline system has observed a physical-store occurrence with customer match evidence. | Once per original offline event_id; retries reuse the same source event_id. | `authenticated producer`, `offline marketing consent`, `observed customer match key`, `original event_id and event_time`, `Purchase order_id, currency, value and contents when applicable` |

## Leverandørfordeling fra katalog og faktisk adapterregister

`G` = backend Google Data Manager; `M` = Meta CAPI; `MS` = Microsoft UET CAPI;
`P` = Pinterest CAPI; `S` = Snapchat CAPI. Et navn uten kvalifikasjon betyr at
katalogen har aktiv outbox **og** adapteren finnes i registeret. `disabled`
betyr at katalogen slår av serverutsending selv om adapterkode eksisterer.
`blocked_no_worker` betyr at ingen aktiv serverleveranse er definert.
Dette er aldri en påstand om mottak eller annonseattribusjon.

| Kanonisk hendelse | G | M | MS | P | S |
|---|---|---|---|---|---|
| `page_view` | `page_view` (disabled; uten registeradapter) | `PageView` | `page_view` | — | `PAGE_VIEW` |
| `view_item_list` | `view_item_list` | `ViewItemList` | `view_item_list` (blocked_no_worker; uten registeradapter) | — | — |
| `select_item` | `select_item` | `SelectItem` | `select_item` (blocked_no_worker; uten registeradapter) | — | — |
| `view_item` | `view_item` | `ViewContent` | `view_item` (blocked_no_worker; uten registeradapter) | `page_visit` | `VIEW_CONTENT` |
| `add_to_wishlist` | `add_to_wishlist` | `AddToWishlist` | `add_to_wishlist` (blocked_no_worker; uten registeradapter) | `add_to_wishlist` | — |
| `add_to_cart` | `add_to_cart` | `AddToCart` | `add_to_cart` | `add_to_cart` | `ADD_CART` |
| `remove_from_cart` | `remove_from_cart` | `RemoveFromCart` | `remove_from_cart` (blocked_no_worker; uten registeradapter) | — | — |
| `view_cart` | `view_cart` | `ViewCart` | `view_cart` (blocked_no_worker; uten registeradapter) | — | — |
| `begin_checkout` | `begin_checkout` | `InitiateCheckout` | `begin_checkout` | `initiate_checkout` | `START_CHECKOUT` |
| `add_shipping_info` | `add_shipping_info` (disabled; uten registeradapter) | `AddShippingInfo` | — | — | — |
| `add_payment_info` | `add_payment_info` | `AddPaymentInfo` | — | — | `ADD_BILLING` |
| `purchase` | `purchase` | `Purchase` | `purchase` (disabled) | `checkout` (disabled) | `PURCHASE` (disabled) |
| `refund` | `refund` | — | — | — | — |
| `search` | `search` | `Search` | `search` (blocked_no_worker; uten registeradapter) | `search` | — |
| `view_search_results` | `view_search_results` | — | — | — | — |
| `view_promotion` | `view_promotion` | — | — | — | — |
| `select_promotion` | `select_promotion` | — | — | — | — |
| `generate_lead` | `generate_lead` | `Lead` | `generate_lead` (blocked_no_worker; uten registeradapter) | `lead` | — |
| `form_start` | `form_start` | — | — | — | — |
| `form_submit` | `form_submit` | — | — | — | — |
| `form_error` | `form_error` | — | — | — | — |
| `filter_apply` | `filter_apply` | — | — | — | — |
| `sort_apply` | `sort_apply` | — | — | — | — |
| `variant_select` | `variant_select` | — | — | — | — |
| `size_guide_view` | `size_guide_view` | — | — | — | — |
| `checkout_error` | `checkout_error` (disabled; uten registeradapter) | — | — | — | — |
| `payment_error` | `payment_error` (disabled; uten registeradapter) | — | — | — | — |
| `scroll_depth` | `scroll_depth` | `LandingScrollDepth` | — | — | — |
| `view_category` | `view_category` | `ViewCategory` | — | `view_category` | — |
| `hero_interact` | `hero_interact` | `HeroInteract` | — | — | — |
| `interact_with_accordion` | `interact_with_accordion` | `InteractWithAccordion` | `interact_with_accordion` (blocked_no_worker; uten registeradapter) | — | — |
| `open_quick_view` | `open_quick_view` | `OpenQuickView` | `open_quick_view` (blocked_no_worker; uten registeradapter) | — | — |
| `video_progress` | `video_progress` | — | — | — | — |
| `meta_app_event` | — | `source_meta_event_name` | — | — | — |
| `meta_offline_event` | — | `source_meta_event_name` | — | — | — |

### Browser-/GTM-fordeling

- Applikasjonens låste Meta Pixel-transport sender PageView, ViewItemList,
  SelectItem, ViewContent, AddToWishlist, AddToCart, RemoveFromCart, ViewCart,
  InitiateCheckout, Search, Lead, LandingScrollDepth, ViewCategory,
  HeroInteract, InteractWithAccordion og OpenQuickView når den tilsvarende
  kanoniske kilden faktisk finnes. Pixel har ingen Purchase-generator her.
  Kildekode for en mapping oppretter ikke i seg selv en v2-kilde.
- Web-GTM/Stape Data Tag beholdes med eksplisitt liste for `page_view`,
  `view_item_list`, `select_item`, `add_to_wishlist`, `add_to_cart`,
  `remove_from_cart`, `view_cart`, `begin_checkout`, `view_promotion`,
  `select_promotion`, `search` og `generate_lead`. `purchase` og `view_item`
  er utelatt i den vedtatte konfigurasjonen. Full aktuell trigger-/taggkjøring
  må leses tilbake før publisering.
- GA4 PageView har **ingen Google backend-outbox-adapter**; denne grenen eies
  av den eksisterende GTM/Stape-ruten. `add_shipping_info` har heller ingen
  Google backend-adapter. Disse skal ikke skapes ved å kopiere mappingen til
  andre hendelser.
- Serverkatalogen slår av Purchase-outbox for Microsoft, Pinterest og
  Snapchat, selv om alle tre Purchase-adaptere finnes i registeret. Dette
  avviket er eksplisitt og må ikke «repareres» ved automatisk aktivering.
- Pausede GTM-Meta-tagger forblir pausede. V2 oppretter ingen nye Google Ads-
  destinasjoner. Power Ups er berikelse i Stape-grenen og dokumenterer ikke
  automatisk berikelse i appens direkte Meta CAPI-gren.

## Checkout, autoritet og drift uten ny hendelseskilde

Shopify-observasjoner v1–v4, checkout-recovery, `orders/paid` og
`refunds/create` beholder sine rå kropper og eksisterende HMAC/OIDC-verifikasjon
hos headless. Bekreftelsesside, `checkout_completed` og Klarna callback er
ikke ekstra Purchase-eiere. Kjøpsavstemming og gjenforsøk beholder samme
backend, ledger og idempotenslager.

`web_vital` har separat schema/collector `/api/events/web-vital` og står ikke
som et event i `eventCatalog.ts`. V2 bruker faktiske Next Web Vitals og de
bevarte Vercel Analytics/Speed Insights-endepunktene med URL-redigering.
Feillogger og journey-observasjoner er driftsdata, ikke konverteringer.

## Konkrete akseptansegates

### Rettelser observert i den lokale koden

Disse punktene er kontrollert i kode etter første gjennomgang. De er ikke
erstattet med påstander om bestått nettleserreise:

- PDP-visning bruker en liten `h1`-sentinel og kontrollerer aktuell variant
  mot URLens selectionKey. Endrede commerce-/selection-attributter starter
  observasjonen på nytt, og frakoblede elementer avvises.
- Listevisning har nå 1000 ms synlighet, 50 ms batching, maksimalt 20 varer,
  sekvens per liste og summering av netto/brutto/skatt. Kampanjevisning har
  1000 ms synlighet. Skjult dokument avbryter synlighetstimere.
- Skjemastart bruker reell `input`-endring med verdi, ikke fokus. Wishlist
  bruker `saved.added`, lagret `mutationId` og opprinnelig `addedAt`.
- Variant-intent registreres i den faktiske variantkontrolleren og blir
  først `variant_select` når den tilsvarende RSC-varianten er committed.
  Generelle lenkeobservasjoner bruker capture, slik at Next Links normale
  `preventDefault()` ikke fjerner dem.
- Kategorisider merker resolved sidenummer med `data-tracking-page`.
  Observatøren avviser gammel kategori-/liste-DOM mens samme-path-paginering
  venter på ny RSC. Tidlige cart-/wishlist-/formhandlinger tar vare på
  handlingens opprinnelige side-ID, URL, tittel, referrer og tidspunkt før
  lazy runtime lastes.
- Checkout forbereder én identitet, skriver/avstemmer Shopify-attributter
  og bekrefter URL før utsending. En tidlig checkout før lazy runtime er
  registrert laster prepareren ved behov. Mislykket forberedelse emitterer
  ingen `begin_checkout`.
- Runtime har en samlet 1500 ms grense rundt Meta-berikelse, 500 ms rundt
  Google-ID-er og 1500 ms maksimal venting på begin-checkout collector.
  Pixel dispatches før GA-ventingen; event-ID/tid beholdes ved retries.
- Kontaktens `form_submit` følger en akseptert Resend-kvittering. Dun-
  ventelisten bruker samme kvitteringsavledede submission-ID ved lead-
  persistens og kanonisk readback; browseren speiler bare bekreftet Lead.
  Sporingsfeil skal ikke gjenta den aksepterte kommersielle innsendingen.

Kontraktkontrollen er kjørt på **117 låste kontraktfiler** uten drift.
Gatewaymanifestet har 21 gateway-/identitetsfiler med bare de to eksplisitt
markerte header-/timeout-tilpasningene. Stape-loaderen og Meta Pixel-scriptet
er uendrede kildekopier.

Lokal sluttkontroll er **121 beståtte v2-tester**: 110 CJS-tester, hvorav
10 Chromium-fixtures, og 11 gatewaytester. Backendens låste produksjonsarkiv
med 17 eksplisitte overlayfiler har 20 beståtte fokuserte tester. V2-bygg med
produksjonsflagg og TypeScript er bestått; lint har ingen feil og fem advarsler
i låst kildekode. Backendens endelige typekontroll føres i
[implementasjonsrapporten](README.md). Disse kontrollene beviser ikke
produksjonsmottak.

Chromium-fixtures kjører faktisk runtime/observatør/Pixel-kode mot lokale,
interceptede nettverksresponser. De dekker blant annet synlighetsdwell,
forsinket variant-RSC, replay, navigasjon, tilbakeknapp/reload, opprinnelig
sidekorrelasjon for handlinger som køes før lazy runtime, samme-path-
paginering og maksimal journey-scroll. Syntetisk `pageshow` med
`persisted=true` kontrollerer gjenopprettingshooken, men beviser ikke at
nettleseren faktisk tok siden inn i BFCache. Dette erstatter ikke en full
Next/Shopify/Klarna-reise. Faktisk Safari/BFCache, GTM/Stape/Power Up-effekt,
mottakerdeduplisering og ytelsesmåling er fortsatt `unverified`.

### Krav før produksjonsgodkjenning

1. Samme fixtures gir samme kanoniske commerce- og providerfelter som
   kildecommiten, inkludert rabatt, skatt, variant, ID og tid.
2. Init/hydration, tilbakeknapp, reload, variantbytte og klientnavigasjon
   gir én hendelse per faktisk hendelse. RSC som ennå viser gammel DOM
   kan ikke bli den nye sidens produkt-, liste-, kategori- eller kampanjedata.
3. Lister krever 50% synlighet i 1000 ms, flusher etter 50 ms og samler maks
   20 varelinjer per listeevent. Kampanjevisning krever 1000 ms sammenhengende
   synlighet. Timere avbrytes ved skjult element eller navigasjon.
4. Wishlist bruker bekreftet ny lagring og butikkens faktiske mutationId.
   Cart bruker bekreftede Shopify-delta. Variantvalg blir først en hendelse
   når den nye varianten er resolved/committed. Skjemastart krever faktisk
   verdiendring; submit/lead krever serveraksept.
5. Valgfri identitetsberikelse er tidsavgrenset og kan ikke låse Pixel,
   navigasjon eller betaling. Retries gjenbruker samme ID/tid.
6. Gyldig OIDC-prosjekt/team/miljø/origin slipper gjennom; manipulert context,
   feil prosjekt og preview/local kan ikke levere produksjonskonverteringer.
7. Verifisert testreise korreleres browser → bro → headless → Supabase →
   provider. HTTP 200/202 er bare aksept; `accepted_unverified` beholdes
   inntil selvstendig provider-mottak er observert.
8. Betalte testkjøp, publisering og butikkdomene-cutover følger brukerens
   separate produksjonsgodkjenning. Ingen kjøp/publisering er utført av
   arbeidet med denne matrisen.

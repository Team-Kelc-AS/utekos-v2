# SmartCart migration — 2026-10-15

Implemented locally, not deployed. No live cart/order/payment was created by verification.

## Source and preserved rules

Legacy source: src/components/cart/SmartCartSuggestions.tsx, UpsellItem.tsx, FreeShippingConfirmation.tsx, getAccessoryProducts.ts and getRecommendedProducts.ts in ../utekos-headless.

- First 10 accessory products tagged tilbehør and first 10 available recommendations.
- Exclude unavailable/empty-inventory products, unavailable variants and products already in the cart; deduplicate product IDs.
- Below NOK 999: cheapest product bridging the remaining amount; otherwise highest-priced product below the gap; one suggestion.
- At/above threshold: accessories, otherwise first two recommendations.
- Stapper first among accessory suggestions. Variant selector uses available variants and the selected variant's price/image.
- Shipping message still works when recommendations fail. Empty and non-NOK carts do not claim threshold shipping.
- Conservative shipping eligibility uses the lower of subtotal/total so an order discount cannot falsely promise threshold shipping. Applicable COMFYFRI also enables the confirmation.

## Provider readback

Read-only Shopify Admin check confirmed Utekos shop and active rules:
- TILBEHØR10: 10% on collection tilbehor, all buyers, no minimum, no expiration, cannot combine with product/order/shipping discounts.
- Fullfør din Utekos - 10% på tilbehør!: automatic Buy X Get Y, spend NOK 999/get one item at 10% off; Shopify owns actual applicability.
- COMFYFRI: active free shipping, all buyers, no minimum/expiration, cannot combine with other discounts. UI advertises it for carts containing Comfyrobe as requested.

Explicit code buttons preserve other applied codes. No fictional discounted price is shown before Shopify applies the discount. Shared cart lock covers coupon updates and Express checkout.

Existing Klarna bridge builds draft order lines from variant IDs/quantities and cannot preserve cart discounts/shipping codes. Such carts use standard checkout. Express preparation and order preflight both reject applicable codes, including shipping-only codes with unchanged merchandise totals.

## Verification

- 53 cart/Klarna tests passed.
- Scoped ESLint, TypeScript, git diff --check passed.
- pnpm run build passed; 26 MDX internal-link checks passed.
- Storefront 2026-10 GraphQL schema validation passed for candidate, cart and Klarna cart queries.
- Live read-only suggestions endpoint returned Stapper, Mikrofiber, Comfyrobe and TechDown with available variants.
- Eight mocked browser scenarios passed at 390px/1440px: COMFYFRI application, Stapper add + TILBEHØR10 application, exact variant selection, suggestions failure; no horizontal overflow. Local cart/provider mutation responses were simulated.
- Mobile screenshots opened for visual review; product images retain native ratio.

Documentation: https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/migrate-to-cart-api/migrate-your-app

## User clarification: automatic accessory promotion

The user confirmed that the intended promotion is the automatic "Fullfør din Utekos - 10% på tilbehør!" Buy X Get Y discount, not TILBEHØR10. The cart now advertises the automatic 10% discount on ONE accessory for qualifying purchases from NOK 999. No accessory code is offered or submitted. The promotion-code endpoint now accepts only COMFYFRI; existing customer-applied codes remain untouched. Shopify continues to calculate eligibility and combinations; no client-side price reduction is fabricated. The earlier TILBEHØR10 UI implementation described above is superseded.

After correction: 53 cart/Klarna tests and scoped lint passed. Browser harness now asserts that adding Stapper sends only the add operation, shows automatic-promotion information and has no TILBEHØR10 button.

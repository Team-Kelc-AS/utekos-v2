# Comfyrobe checkout redirects

The supported entry URLs are `/comfy-xs` and `/comfy-xl`. The compatibility
aliases `/comfyrobe-xs` and `/comfyrobe-xl` use the same tracked route handler.
Keep these route files committed on `main`; dashboard redirects alone are not
the complete checkout integration.

## Vercel Settings

| Source | Destination | Status | Preserve Query Params |
| --- | --- | --- | --- |
| `/comfy-xs` | `/kjop/comfyrobe/xs` | 307 | On |
| `/comfy-xl` | `/kjop/comfyrobe/xl` | 307 | On |

The intermediate URL is a server redirect, without a rendered page or client
JavaScript. It builds a Shopify cart permalink with `channel=buy_button` and
the campaign's `COMFYFRI` discount. XS uses variant `43959919051000`; XL uses
variant `43959919116536`. Both were read back from Shopify on 2026-10-26.

## Attribution contract

- Vercel preserves the incoming query string. The route preserves marketing
  values and repeated parameters and adds consented Shopify order attributes.
- Meta, Microsoft, Google, Snapchat, Pinterest, TikTok and X click identifiers
  use the existing checkout attribution schema. Browser cookies and supported
  campaign/ad IDs follow that same contract.
- UTM parameters and `ref` are also stored as cart/order attributes, so they
  remain available after Shopify changes the visible URL to an opaque checkout
  URL. The paid-order pipeline reads `note_attributes` through
  `parseOrderAttributionFromNoteAttributes`.
- Incoming parameters cannot replace the selected variant, checkout host,
  fixed channel/discount, or the server-generated attribution attributes.
  Oversized links return 414 rather than silently dropping attribution.
- A redirect is not a `purchase` or a confirmed `begin_checkout`. Link previews
  and crawlers must not generate purchase events. Checkout and paid-order
  events retain their existing Shopify/web-pixel and webhook ownership.

`tests/comfy-buy-now-redirect.test.cjs` checks variant routing, query preservation,
identity handling, order-attribute readback, legacy Meta IDs and unsafe input.
Before releasing, also check the live Vercel settings and the Shopify handoff.

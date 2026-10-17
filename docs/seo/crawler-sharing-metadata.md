# Crawler access and sharing metadata — 2026-10-17

## Previously published changes

| Commit | Actual change | Evidence boundary |
| --- | --- | --- |
| `9be2734` | Excluded observed Meta ExternalAgent/WebIndexer traffic from customer telemetry. | Does not establish the cause of historical browser errors. |
| `1f6dc37` | Covered all five Meta crawler/fetcher tokens in browser/Pixel/Stape/identity/telemetry gates; passive discount requests avoid cart creation; explicit robots allow group. | Deployed; 32 focused tests, lint, typecheck and build passed. Existing wildcard robots already allowed crawling. |
| `c5e59a3` | Extended shared telemetry gates to documented Google agents; preserved active Storebot/Google-Agent cart behavior; explicit Google robots groups. | Deployed; 42 focused tests, lint, typecheck and build passed. UA probes establish compatibility, not genuine Google identity or indexing. |

All five product families already returned sharing metadata in HTML. Earlier
three-product checks did not imply missing metadata for Stapper or Mikrofiber.
No firewall bypass, Search Console indexing confirmation or Meta cache refresh
was established by those releases. HTTP 204 applies to suppressed telemetry,
not public content. Existing HTTP statuses, robots permissions and tracking
contracts are unchanged by the metadata work below.

## Current metadata changes and reasons

| Product + explicit color | Original asset under `/images/kunnskap/` | Stable Meta sharing URL |
| --- | --- | --- |
| Mikrofiber Vargnatt | `og-utekos-vargnatt.webp` | `/produkter/utekos-mikrofiber?farge=vargnatt` |
| Mikrofiber Fjellblå | `og-utekos-fjellbla-blue-bg.webp` | `/produkter/utekos-mikrofiber?farge=fjellbla` |
| Dun Fjellblå | `og-utekos-fjellbla-night-bg.webp` | `/produkter/utekos-dun?farge=fjellbla` |

The operator supplied and assigned these three original WebP files, each 1200 ×
630. Bytes are preserved. Metadata now uses the validated selection, rather than
always taking the default variant. Farge and variant-ID selectors converge on one
OG identity per mapped product/color, regardless of size, stock or tracking
parameters. Each image has explicit dimensions, `image/webp` and descriptive alt
text; Twitter uses the same image and alt. Meta sharing metrics/cache are separate
for these color identities. Google `rel=canonical` remains the product family.

General, size-only and unmapped selectors preserve existing family metadata.
Invalid or contradictory selectors still fail route validation with HTTP 404.
No new URL route, API, gallery edit, redirect or tracking-contract change is added.
Other supplied images are pending; no replacement images are generated.

`/bli-forhandler`, `/personvern` and `/vilkar-betingelser` previously replaced the
root Open Graph object without images. They now use the complete shared social
metadata and existing 1200 × 630 site image, keeping their titles, descriptions
and canonicals. `/forhandlere` and its three retailer pages now include the actual
retailer-image dimensions/type and matching Twitter metadata. Next.js merges
nested metadata shallowly, so incomplete child objects cannot inherit the image.

## Provider settings observed during the review

- Meta domain `utekos.no` (843560905074445): Verified, connected to the Utekos
  Facebook Page. No verification change is needed.
- Meta “Allow Preferred URL Domains”: empty; same-domain references are allowed.
  This controls cross-domain OG canonical permission, not HTTP redirects or UTM
  preservation. The three sharing identities remain on `utekos.no`.
- Vercel active custom rule: denies UA containing `SentryUptimeBot`. No custom
  Google/Meta block was found. This does not prove every natural request passes
  every platform mitigation; no security bypass is introduced.

## Documentation decisions

- Google robots creation/specification/useful rules/update guidance: retain
  UTF-8 root robots and asset access; no unsupported crawl-delay. Explicit agent
  groups do not inherit wildcard restrictions. No robots change in this release,
  so no urgent robots-cache refresh is necessary.
- Google HTTP-status and faceted-navigation guidance: retain 308 normalization
  for unsupported listing filters, 404 for invalid selectors/pages, and attribution
  query preservation. Avoid blanket product-query blocking.
- Google crawl-budget guidance: the 37-URL sitemap does not justify a scheduler
  or large-site crawl-budget system. The changelog's Retry-After advice concerns
  emergency crawl reduction, not a present need.
- Google request verification: UA is spoofable and never authorizes private
  operations. Real identity requires published IP ranges or forward-confirmed
  reverse DNS. Web Bot Auth is experimental and not required for public access.
- Meta basic/versioned links, optimization, best practices and images: return
  complete OG metadata in HTML, stable identities and native image dimensions;
  verify actual scrape output. No crawler-only page is needed. Feed/Send dialogs
  are sharing UI integrations, not a prerequisite for crawler compatibility.

Sources consulted: installed Next.js 16.4.0 metadata guide and Utekos Docs MCP;
[Next metadata merging](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#merging),
[Google robots](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec),
[robots updates](https://developers.google.com/crawling/docs/robots-txt/submit-updated-robots-txt),
[HTTP status](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes),
[facets](https://developers.google.com/crawling/docs/faceted-navigation),
[crawl budget](https://developers.google.com/crawling/docs/crawl-budget),
[changelog](https://developers.google.com/crawling/docs/changelog),
[Google verification](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests),
[Web Bot Auth](https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth),
[Meta canonical sharing](https://developers.facebook.com/documentation/sharing/webmasters/getting-started/versioned-link),
[Meta images](https://developers.facebook.com/documentation/sharing/webmasters/images),
[Meta optimization](https://developers.facebook.com/documentation/sharing/webmasters/optimizing),
[Meta domain verification](https://developers.facebook.com/documentation/sharing/domain-verification).
No package upgrade is required for these documented metadata capabilities.

## Facebook app association — verified 2026-10-17

The original storefront exports `src/app/siteMetadata.ts` from its store layout
and uses `1154247890253046` for `fb:app_id`. Meta's authenticated app readback
identifies this as **Utekos App Master**, owned by Utekos Marketing Group
(`538548380599665`), with `is_live: true` and `app_status: live_mode`.
The App Dashboard independently shows the app as Published and its Website
Site URL as `https://utekos.no/`. Privacy and terms URLs also use `utekos.no`.
The separate App domains field is empty; no app settings were changed.

`buildRootMetadata()` now supplies `facebook.appId`, inherited by every route
through `src/app/layout.tsx`. This restores the verified public app association
and addresses the missing `fb:app_id` warning observed after the sharing-image
release. It does not configure Facebook Login, Pixel or Conversions API, and
does not establish analytics receipt or attribution.

Sources: authenticated Meta Developer Tools `app_list`/`basic_settings`,
[App Dashboard](https://developers.facebook.com/apps/1154247890253046/settings/basic/),
[Meta sharing metadata guide](https://developers.facebook.com/documentation/sharing/webmasters)
(updated June 30, 2026), and the installed Next.js 16.4.0 `facebook` metadata
documentation. Production HTML and Sharing Debugger verification are recorded
separately from this source change.

## Verification and release gates

Executed pre-release: 28 focused tests passed; typecheck and production build
passed. `pnpm exec eslint src tests scripts` passed with zero errors and five
existing warnings. Unrestricted `pnpm run lint` still reports 44 errors in old
`output/` measurement scripts outside this release; those files were not changed.
The built production server passed 74 raw-HTML checks (including all 37 sitemap
URLs), five invalid-URL 404 checks, byte equality for all three supplied assets,
unchanged robots output and attribution-preserving listing normalization.

Run focused product/site/support SEO and catalog-URL tests, lint, typecheck and
the production build. Verify raw HTML for all sitemap URLs, all mapped colors
and variant IDs/sizes, generic/unmapped controls, tracking parameters, invalid
selectors, image bytes/types/dimensions and unchanged robots output.

Publish only this scope with `pnpm run sync` on `main`, preserving unrelated
work separately. Record exact Git SHA, deployment ID/READY and live responses.
Use Meta Sharing Debugger to verify each color's actual preview and final OG URL.
Local tests, production responses, Meta scrape/preview and Google indexing are
separate evidence layers; missing provider readback must remain UNVERIFIED.

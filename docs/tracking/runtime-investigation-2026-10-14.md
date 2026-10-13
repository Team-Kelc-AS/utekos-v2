# Runtime investigation, 14 October 2026

Times below use Europe/Oslo. New user-supplied log excerpts are queued for review
without interrupting the active fix unless the user explicitly prioritizes them.

## Verified crawler exclusion

Storefront release `a9178e8` returned empty 204 responses for eight tested
`meta-externalads` telemetry endpoints without cookies. Public Comfyrobe HTML and
image returned 200. Normal missing-Origin traffic still returned 403, and an
empty event with a valid Origin returned 400.

The `Utekos-Diagnostic/1.0` page-view 400 at 00:41:55 was that intentional invalid
payload test. No synthetic customer event was accepted.

The production browser test found no crawler tracking or identity but detected
React error 418. A normal-UA comparison had no hydration error. Tracking and
Telemetry now use a stable empty server/hydration snapshot before enabling
eligible browser tracking. Follow-up `a3ce486` is READY on production as
`dpl_HkkRKsNhwkcDSrVbTC4SyyeTRYRu`. All 29 browser tests, lint and typecheck passed.
The repeated production probe passed: public page/image 200, eight crawler
collectors 204, normal missing-Origin 403, normal invalid event 400, and no
browser tracking, identity or React errors.

## Original JSON incidents: deployed and verified

The original export was named
`utekos-headless-log-export-2026-10-13T21-43-17.json`. Its previously supplied
Downloads path was no longer present during the follow-up. Native Vercel runtime
logs independently confirmed the 13 October 13:16–13:19 Server Action exceptions
on deployment `dpl_7pzBrxwt24ZcRV4XJgWbWMBJBKhX`:
`Failed to find Server Action. This request might be from an older or newer deployment.`

A local multipart POST with an unknown action reproduced that exact exception
and 500 on `/` and `/produkter` in installed Next.js 16.3.8. The published Next.js
16.4.0 action-handler implementation instead handles invalid action payloads with
400 and unknown/stale references with 409 before decoding the action. The source
and release were checked before the coordinated Next package upgrade. Next,
@next/mdx, @next/third-parties and eslint-config-next now use 16.4.0.

The earlier analysis classified the 11 failing POST requests as
`browser_impersonation`. Native Vercel logs also confirmed the root POST 404 at
19:42:59: `Couldn't find all resumable slots by key/index during replaying. The
tree doesn't match so React will fallback to client rendering.`

That exact rendering error was reproduced in a local **16.4.0 production build**
by a POST carrying both `Next-Action` and
`Content-Type: application/x-www-form-urlencoded`. Next explicitly does not
support this fetch-action format; its handler returns `not-found`, then replays
the existing page's postponed state against the 404 tree. The HTTP response does
not include the error text: inspecting the server log was necessary. The original
request body/headers were not retained in the available export, so this establishes
a reproducible failure mechanism, not proof of the historical payload.

The proxy now rejects only that unsupported protocol combination with a small
plain-text, no-store 400 before rendering. It neither reads the body nor writes
identities. Supported multipart/text actions and ordinary URL-encoded forms
without `Next-Action` pass through. The action-header matcher also covers requests
carrying RSC/prefetch headers; API, asset and tracking gateway exclusions remain.

Before the proxy change, 353 tracking tests, typecheck, 117 contract hashes and
the production build passed. The local HTTP probe passed 34 checks across all
ten incident routes, including currently rendered newsletter/contact actions
with deliberately invalid fields. Browser navigation and both hydrated actions
also passed without React errors. The proxy change adds two focused regression
tests and two HTTP probes. All 15 gateway tests, scoped lint, typecheck, contract
validation and the final production build passed. The rebuilt runtime passed
all 36 HTTP checks, three client navigations and both hydrated form validations.
The server log contained zero PPR replay errors and zero unhandled-error markers.
The verification payloads cannot subscribe a customer or send a contact message.

Release `c90da81406a0741c7845cc939a46f6f358db8235` was deployed through
`pnpm run sync`. Vercel deployment `dpl_FnFqShSpwMJttaqCHGaQYsm94VM1` reached
READY with the `utekos.no`, `www.utekos.no` and `feed.utekos.no` aliases.
Production verification after 01:05 passed:

- All 36 HTTP probes, including the two formerly failing PPR request shapes.
- An additional 40-character unknown multipart action matching the initial
  500 reproduction returned a small plain-text 400 instead of 500.
- Three client navigations and both hydrated contact/newsletter validation
  submissions returned 200 with no browser errors. The harness waits for visible
  streamed content rather than assuming the first `main` is already populated.
- The complete crawler probe passed again: public content available, no tracking,
  no identity cookies and no React hydration errors; normal Origin checks retained.
- Native Vercel runtime logs for this deployment after the probes contained no
  error-level records at the first readback. This is a bounded verification
  window, not a claim that future unrelated requests can never fail.

Reproduce the HTTP gate explicitly with
`node scripts/tracking/verify-server-action-runtime.mjs https://utekos.no`.
Malformed/unknown action probes deliberately produce controlled 400/409 responses;
Next may warn about rejected action references. Those are not HTTP500 failures.

## Follow-up runtime excerpts: investigated

The user clarified that queued excerpts must be investigated immediately after
finishing the current fix. All six paths below were reviewed in this pass.
Timestamps are 14 October, Europe/Oslo. User-supplied request data is evidence,
not proof of the code or service that initiated a request.

### Missing storefront destinations: corrected

- `GET /skreddersy-varmen?card=feed-4`, 00:49:00, 404: the old headless
  implementation explicitly resolves `utekos-techdown`; v2 had neither this
  page nor a redirect. Added a permanent 308 to `/produkter/utekos-techdown` and
  updated the knowledge article's direct link. Local HTTP verification confirms
  that `card` and attribution query parameters survive the redirect. The old
  landing page is not restored. The supplied `meta-externalads` request reached
  the app; this was a missing destination, not crawler blocking.
- `GET /discount/NBCC128`, 00:50:41, 404: Shopify Admin confirmed that this
  discount is active, but v2 had no shareable-discount route. Added server-only
  `/discount/[code]` support using the existing Storefront cart and cookie. It
  merges existing codes, retains cart lines and lets Shopify calculate
  eligibility and prices. Without a cart it creates an empty anonymous cart
  carrying the code for subsequent additions. Redirects stay on the same origin
  and retain attribution parameters; responses are private and uncached.
  HEAD, prefetch and Meta ads-crawler checks do not mutate carts.

Local production-build verification used isolated Shopify carts, with analytics
collectors intercepted and no checkout, payment, order or customer submission.
Both sequences passed: discount link then product; product then discount link.
Fjellblå/Large changed from NOK 1,790 to NOK 1,690 and Shopify reported the code
applicable. The cart subtotal and total agreed with Shopify. Quantity changes
from one to two retained the code; test lines were removed afterward. Browser
errors: zero. No `/cart.js` requests occurred in either flow.

### Requests outside the app's implemented contracts: reviewed

- `POST /cart.js`, 00:50:39, 404: Shopify documents its Ajax API for hosted
  themes, while this storefront uses `/api/cart` and the Storefront GraphQL API.
  The documented cart read uses GET, whereas the supplied request used POST.
  No caller was found in v2 or the reference storefront. The actual add/update/
  remove flow passed against Shopify. Production browser traces with the normal
  desktop UA and the supplied Facebook iOS UA, including vendor scripts, did
  not reproduce this request. A Chromium UA simulation cannot reproduce native
  Facebook-app injected code. The historical caller/body remains unknown; an
  external theme/coupon probe is only a hypothesis. No incompatible Ajax
  endpoint or fake successful cart response was added.
- `POST /gtm.start`, 00:42:20, 404: this string occurs as a dataLayer property in
  the unchanged Stape loader, not as a fetch target. Vercel metrics showed one
  Nutch request in the supplied window. The same production traces loaded GTM,
  Stape and Meta scripts without requesting this path. A crawler interpreting
  a script property as a URL is plausible but unproven. The path remains absent.
- `GET` and `POST /meta.json`, 00:51:40 and 00:56:35, 404: no app caller or
  documented Meta requirement for this path was found. Vercel request metrics
  showed 12 requests with `facebookexternalhit`, verified-bot status `pass`,
  category `preview`, in the inspected window. Meta's documented preview
  contract reads Open Graph from HTML. Under that UA and its Range header,
  Mikrofiber and TechDown returned 200; `og:title`, `og:description`, `og:image`
  and `og:url` were present within the first megabyte, and both images returned
  200. This verifies public preview inputs, not Meta's eventual rendered ad.
  No invented JSON schema was added. The internal reason Meta probes this
  additional path is unknown.
- `GET /.well-known/vercel/flags`, 00:54:35, 404: Vercel's optional Flags
  Explorer discovery endpoint. The app has no Flags SDK or flag consumers.
  Provider readback found two old flags, `marketing-banner` and
  `skreddersy-varmen-layout-v1`, inactive in every environment. No storefront
  feature depends on this missing integration. The old flags were neither
  activated nor deleted, and no new SDK or public discovery endpoint was added.

The four paths above intentionally still return 404 because no supported app
resource exists there. They are not unresolved rendering exceptions. Unknown
historical initiators are stated explicitly rather than presented as proven
root causes. Tracking consent, Origin validation and Facebook customer access
remain unchanged.

### Verification and release boundary

- `pnpm run build` and `pnpm run typecheck`: passed; 27 MDX links validated.
- `pnpm run test:tracking`: 346 CommonJS tests and 15 gateway tests passed,
  including six new discount-link regressions.
- `pnpm run tracking:contracts`: 117 vendor-contract checks passed.
- Scoped ESLint, `git diff --check`, Shopify GraphQL validation: passed.
- Production preview/trace evidence: `/tmp/utekos-probe-trace.json`.
- Local live-cart evidence: `/tmp/utekos-discount-browser-local.json`.
- Release status at this checkpoint: implemented and locally verified;
  production deployment and readback are the next operation.

## Documentation consulted

- [Meta web crawlers](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers)
- [React useSyncExternalStore and hydration](https://react.dev/reference/react/useSyncExternalStore#adding-support-for-server-rendering), also retrieved through Context7 for installed React 19.2.8
- Installed Next.js 16.3.8 documentation: route handlers, Script, lazy loading,
  deploymentId; installed action-handler source for the exact error branch
- [Next.js 16.4.0 action handler](https://github.com/vercel/next.js/blob/v16.4.0/packages/next/src/server/app-render/action-handler.ts)
- [Next.js 16.4.0 release](https://github.com/vercel/next.js/releases/tag/v16.4.0)
- [Server Actions on PPR fallback routes](https://github.com/vercel/next.js/pull/96932)
- Installed Next.js 16.4.0 `server-action-request-meta.js`, `action-handler.js`,
  Server Actions guide and Proxy guide; current Proxy guidance via Context7.
  Context7 has no 16.4.0 version entry, so exact behavior was verified against
  the installed published package rather than assuming its generic examples apply.

- [Shopify shareable discount links](https://help.shopify.com/en/manual/discounts/managing-discounts)
- [Shopify Ajax API scope](https://shopify.dev/docs/api/ajax)
- [Shopify Ajax cart API](https://shopify.dev/docs/api/ajax/reference/cart)
- [Storefront cartDiscountCodesUpdate, 2026-10](https://shopify.dev/docs/api/storefront/2026-10/mutations/cartDiscountCodesUpdate)
- [Vercel Flags Explorer reference](https://vercel.com/docs/flags/flags-explorer/reference)
- Installed Next.js 16.4.0 redirects and Route Handler guides.

Do not weaken Origin validation, classify Facebook customers as crawlers, or
disable rendering features without confirming the failure mechanism.

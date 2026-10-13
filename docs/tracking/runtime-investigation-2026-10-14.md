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

## Original JSON incidents: fixes verified locally, release pending

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
Production release and readback are the remaining gate. The verification
payloads cannot subscribe a customer or send a contact message.

## Additional excerpts queued for review

- 00:42:20, `POST /gtm.start`, 404: Nutch-1.23-SNAPSHOT crawler, firewall allowed,
  not-found prerender, no outgoing API requests. Determine why the caller treats
  this event name as a URL; do not invent a successful endpoint to hide the 404.
- 00:50:39, `POST /cart.js`, 404: Facebook iOS in-app browser, product-page
  referrer (Fjellblå, Large). This is not the `meta-externalads` user agent and must
  not be excluded as that crawler. Identify the script/caller and verify the
  headless cart contract before changing anything. Advertising query identifiers
  are intentionally omitted from this record.
- 00:50:41, `GET /discount/NBCC128`, 404: same supplied Facebook iOS user agent
  and product referrer as the cart.js excerpt. Review these together for a
  Shopify theme/Ajax API assumption in a caller versus an actual headless
  discount-link integration gap. The excerpt alone does not prove the caller.

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

Do not weaken Origin validation, classify Facebook customers as crawlers, or
disable rendering features without confirming the failure mechanism.

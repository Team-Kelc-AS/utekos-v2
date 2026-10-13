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
eligible browser tracking. The follow-up requires deployment and production
browser verification before it can be considered resolved.

## Original JSON incidents: still under investigation

The original export was named
`utekos-headless-log-export-2026-10-13T21-43-17.json`. Its previously supplied
Downloads path was no longer present during the follow-up. Native Vercel runtime
logs independently confirmed the 13 October 13:16–13:19 Server Action exceptions
on deployment `dpl_7pzBrxwt24ZcRV4XJgWbWMBJBKhX`:
`Failed to find Server Action. This request might be from an older or newer deployment.`

The earlier analysis classified the 11 failing POST requests as
`browser_impersonation`. The root POST 404/PPR resume failure at 19:42:59 also
requires exact revalidation and remediation. Successful GETs alone do not prove
these POST failures resolved.

## Additional excerpts queued for review

- 00:42:20, `POST /gtm.start`, 404: Nutch-1.23-SNAPSHOT crawler, firewall allowed,
  not-found prerender, no outgoing API requests. Determine why the caller treats
  this event name as a URL; do not invent a successful endpoint to hide the 404.
- 00:50:39, `POST /cart.js`, 404: Facebook iOS in-app browser, product-page
  referrer (Fjellblå, Large). This is not the `meta-externalads` user agent and must
  not be excluded as that crawler. Identify the script/caller and verify the
  headless cart contract before changing anything. Advertising query identifiers
  are intentionally omitted from this record.

## Documentation consulted

- [Meta web crawlers](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers)
- [React useSyncExternalStore and hydration](https://react.dev/reference/react/useSyncExternalStore#adding-support-for-server-rendering), also retrieved through Context7 for installed React 19.2.8
- Installed Next.js 16.3.8 documentation: route handlers, Script, lazy loading,
  deploymentId; installed action-handler source for the exact error branch

Do not weaken Origin validation, classify Facebook customers as crawlers, or
disable rendering features without confirming the failure mechanism.

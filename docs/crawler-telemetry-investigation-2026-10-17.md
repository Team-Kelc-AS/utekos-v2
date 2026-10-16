# Crawler telemetry investigation

Vercel request metrics for production, 2026-10-15 22:14:23 through
2026-10-16 22:19:00 UTC, report 48 HTTP 403 responses under `/api/events/`:
26 web-vital, 11 page-view and 11 page-view/capture. All were POSTs on
utekos.no with utekos.no as referrer hostname and WAF action `allow`.
The reported user-agent markers identify 44 as meta-externalagent or
meta-webindexer and four as HeadlessChrome. These are request counts,
not customer counts or proof that every historical client error is related.

Offline browser tests reproduced customer telemetry and Pixel initialization
for the two Meta crawler markers. The shared crawler gate and the standalone
Pixel gate now exclude those exact versioned tokens alongside meta-externalads.
Public content remains readable. The token only opts out of telemetry;
it never authorizes payment, callback or protected operations. Ordinary
Facebook/Instagram in-app browser markers remain eligible.

Tests cover no Pixel, cookies, customer events or collector calls for each
crawler, and ordinary-visitor event identity. Server tests cover all telemetry
operations, absent/foreign origins, no body/identity/OIDC access, and continued
authorization for other operations. The reviewed Pixel override hash changes
only for this inspected guard change; unrelated provenance drift is not reset.

The Next gateway harness now initializes Next's own server baseline before
runtime imports, matching its documented source requirement. This fixes the
post-test AsyncLocalStorage exception without altering production code.

Sources: Vercel `vercel.request.count` schema and read-only CLI queries;
[Cloudflare Meta-ExternalAgent directory](https://radar.cloudflare.com/bots/directory/meta-externalagent)
and [Meta-WebIndexer directory](https://radar.cloudflare.com/bots/directory/meta-web-indexer).
Meta's linked crawler documentation returned HTTP 429 during this investigation.

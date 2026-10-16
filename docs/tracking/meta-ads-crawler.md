# Meta web crawlers

Meta's documented `facebookexternalhit`, `meta-externalads`, `meta-webindexer`,
`meta-externalagent` and `meta-externalfetcher` crawlers must retain access to public product
pages, images and metadata without becoming a customer visit or conversion.
Source: https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers

Client tracking components use a stable empty server/hydration snapshot, then
check browser eligibility before mounting. This avoids a hydration mismatch when
the server cannot know the browser UA during static rendering.

The browser production gate, standalone Pixel script and Stape script wrappers
exclude this user-agent token. The document proxy skips identity cookies. For
older clients that still send requests, allowlisted browser telemetry POSTs
return empty, non-cacheable 204 responses before reading their bodies, looking
up identity, obtaining OIDC or forwarding to the backend.

This is a telemetry opt-out, not bot authentication. A self-reported user agent
never grants access. Normal Origin checks, the production switch, operation
allowlist, callback signature forwarding and commerce API handling remain in
place. Facebook and Instagram customer browsers do not match the crawler token.

Regression coverage: `tests/tracking-backend.test.cjs`,
`tests/tracking-browser.test.cjs` and `tests/tracking-gateway.test.ts` exercise
discarded requests, retained security boundaries, browser silence, public
content and unchanged tracking for ordinary visitors.

## Verification, 2026-10-17

Meta native documentation search confirmed the May 21, 2026 crawler documentation.
Explicit robots allow rules document the operator's opt-in for all five agents;
the existing wildcard already allowed them. The existing blocking metadata
configuration supplies Open Graph tags in initial HTML without JavaScript.

Production pre-release probes: all five versioned agents fetched Comfyrobe,
TechDown and Dun with HTTP 200, gzip, nonempty OG title/description/image/URL
within the first 1 MB, canonical URLs, index/follow, and readable H1 content.
Requests included Meta's documented Range header; the server safely returned
complete HTTP 200 responses. Observed fetch times were 386–2846 ms, not an SLA.
Robots and sitemap returned 200; the TechDown alias returned a server-side 308.

Regression tests cover all five agents without Pixel, identity or customer
telemetry, and protect ordinary Facebook/Instagram browsers. User-agent tokens
remain self-reported; these probes do not prove a genuine Meta fetch, indexing,
AI citation or a refreshed preview in Meta's cache.

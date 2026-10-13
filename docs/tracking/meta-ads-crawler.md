# Meta advertising crawler

Meta's documented `meta-externalads` crawler must retain access to public product
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

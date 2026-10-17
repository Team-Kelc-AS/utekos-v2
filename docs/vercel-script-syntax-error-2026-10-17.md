# Vercel script SyntaxError investigation

## Evidence

- VERIFIED: The backend logged one `SyntaxError`, filename `/:script/site-proxy`, position `1:1`, at 2026-10-17 11:09:51 UTC. A two-hour Vercel query ending at 11:13 UTC returned one matching record. HTTP 200 belongs to the error-report ingestion request.
- VERIFIED: On the live storefront, `d83cd4b17c2e47da/script.js` has SDK attribute `@vercel/analytics/next` version 2.0.1; `561871d5b41fdaa9/script.js` has `@vercel/speed-insights/next` version 2.0.0. The old sanitizer merged both into `site-proxy`.
- VERIFIED: Both public scripts returned HTTP 200 with JavaScript MIME type and parsed successfully when fetched during this investigation. Chrome also loaded both successfully, including a reload. The reported SyntaxError was not reproduced.
- VERIFIED: These are the current npm releases. Vercel documents the randomized paths as dynamic build-time configuration in version 2. No dependency upgrade is indicated by this evidence.
- UNVERIFIED: Which script failed at 11:09, the response bytes received by that visitor, browser version, and the underlying cause. HTML returned as JavaScript, truncated content, browser compatibility and client-side interference remain hypotheses, not established causes.

## Diagnostic correction

The storefront resolves a hashed script URL against its script element and emits only `vercel-analytics` or `vercel-speed-insights` when the SDK attribute matches. The scan is bounded to 200 elements and runs only for a reported error from a hashed script. Unknown scripts retain `site-proxy`; hashes and queries are not logged. The backend accepts both fixed labels.

SyntaxError messages retain one of four fixed categories: unexpected-less-than, unexpected-end, invalid-token or unexpected-token. Offending tokens, source code, response content and private data are discarded. Both sanitization layers preserve these categories. Error severity remains ERROR. No script URL, consent rule or collection behavior changes.

## Verification

All 14 client-error tests pass against the storefront and actual backend contracts. The suite includes real parse failures from synthetic script responses in Chromium and WebKit, both Vercel SDK labels, an unknown-SDK fallback, privacy assertions and existing hydration-error coverage. Scoped ESLint and production builds with TypeScript checks pass in both repositories. The backend build still prints its existing `/api/meta-quality` prerender cancellation and disabled Vipps callback diagnostics; its exit status is zero.

This corrects lost diagnostic information. It does not establish a fix for the production SyntaxError. Deployment and a subsequent natural report are separate verification steps.

Sources: [Vercel Analytics configuration](https://vercel.com/docs/analytics/package), [Speed Insights configuration](https://vercel.com/docs/speed-insights/package), [MDN ErrorEvent.filename](https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent/filename), native Vercel/MDN MCP responses, Utekos Docs and installed Next.js/SDK source.

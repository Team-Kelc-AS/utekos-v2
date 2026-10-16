# Hydration investigation — 2026-10-17

## Evidence

- VERIFIED: Vercel request `vzmpn-1792188471402-6f81fdb7661e` recorded a browser error and a successful `/api/log` bridge response at 2026-10-16 22:07:51 UTC.
- VERIFIED: Position 1:56923 in the publicly served `1axektdccpuq-.js` invokes React error 418. This identifies a hydration mismatch, not its triggering component.
- VERIFIED: Backend deployment `dpl_6nknRULB13kNguJpGaa2kPfMuHHA` uses `Team-Kelc-AS/utekos-tracking-backend`, commit `7e713c7`. The separate Node service in `utekos-backend` is not this endpoint's source.
- VERIFIED: The previous storefront commits changed suppressed-response handling and script-source labels. They did not fix this hydration mismatch.
- VERIFIED: Local Chromium checks of static pages, three product pages and a 404, plus 35 public page loads in mobile WebKit, did not reproduce it. The public browser probe blocked tracking and non-GET requests; it does not rule out third-party-script interference or other browsers/navigation sequences.

## Local changes

- Register the existing gated error listeners synchronously in `src/instrumentation-client.ts`, before hydration, instead of inside the lazy tracking runtime's effect. Keep a single registration point and the production/origin/crawler gates.
- Preserve only React's numeric error code through repeated sanitization, discarding decoder arguments and arbitrary message text. Retain string-only ErrorEvent messages through that sanitizer.
- Preserve a literal allowlist of public storefront paths, stripping queries and keeping the existing redaction for unknown paths.
- Apply matching message/path sanitization in `utekos-tracking-backend` so ingestion does not discard the restored information.

## Validation and remaining boundary

- VERIFIED: Seven focused tests pass against the actual backend contract. They include real React production hydration failure before tracking mounts, one report, preview-origin exclusion, repeated sanitization and private-data removal.
- VERIFIED: Storefront lint, typecheck, production build and backend TypeScript check pass.
- VERIFIED: The broader test command passes 396 CommonJS tests and 14 of 15 gateway tests. The provenance test fails on `zodMini.ts`: recorded hash starts `77405139`, while both HEAD and the working file hash start `f513c757`. An AsyncLocalStorage invariant also occurs after the gateway test. The isolated provenance test reproduces both errors; the full command is not green. No manifest hashes were rewritten to bypass this check.
- UNVERIFIED: The component/DOM change responsible for the natural production event. These changes fix diagnostic loss, not the underlying mismatch.
- UNVERIFIED: Publication, deployment and receipt of a natural event with the improved fields. No commit, push, deployment or provider configuration change was performed.

Next evidence needed: a natural report retaining the React code and public route after both applications are released, followed by reproduction on that route. Do not classify this as a hydration root-cause fix.

References: [Next instrumentation timing](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client), [React error 418](https://react.dev/errors/418). The installed Next 16.4.0 documentation and callback implementation were also inspected.

# Tracking bridge import

Measured locally on 2026-10-09 with Next 16.3.8, Zod 4.6.5, @vercel/oidc 3.8.0 and esbuild 0.27.7. All sizes below use decimal kB.

`forwardTrackingRequest` imported classic Zod through Facebook session validation. That validator now uses the existing Zod Mini helper with the same number, optional numeric string and unknown-field stripping rules. Encryption, expiry checks, configuration, request forwarding and OIDC calls are unchanged.

## Measurements

| Measurement | Before | After | Saved |
|---|---:|---:|---:|
| Isolated import, minified JavaScript | 967.523 kB | 531.588 kB | 435.935 kB |
| Same import, gzip | 202.746 kB | 115.437 kB | 87.309 kB |
| Next `/api/events/[...path]` server module graph | 2,586.230 kB | 2,295.212 kB | 291.018 kB |

The isolated bundle includes the OIDC SDK and its dependencies; only `server-only` is external and Node built-ins are not bundled. Its configuration differs from editor Import Cost, so these are comparable before/after results rather than a reproduction of the reported 523 kB.

Next's production analyzer shows the same 291,018 B server reduction on all eight bridge routes: events, internal/shopify, log, meta, observability, checkout-observations, checkout-recovery-evidence and shopify/webhooks. Facebook prepare, status and disconnect also shrink by 291,018 B. Client module sizes are unchanged across all 57 analyzed routes: this change saves server code, not browser downloads.

Shared-module allocation means this is not a uniform improvement across every route. Other API graphs that still use classic Zod grow by 20,949–25,190 B. Two knowledge components changed concurrently outside this task; small page graph differences are not attributed to this optimization. See [all route measurements](tracking-import-measurements.json). Shared route sizes must not be summed as unique application bytes.

## Remaining dependency

The isolated bundle still contains about 342 kB of Zod 4.1.11 pulled in by `@vercel/oidc` → `@vercel/cli-config`. The SDK exposes no public function-level subpath. Its asynchronous `getVercelOidcToken({ audience: BRIDGE_URL })` remains intact, retaining token refresh, audience exchange and the SDK's expiry-aware exchange cache. The synchronous API is deprecated in 3.7.1 and cannot replace this call's audience exchange.

References: [Zod Mini](https://zod.dev/packages/mini), [Vercel OIDC custom audiences](https://vercel.com/docs/oidc/api), installed `@vercel/oidc/CHANGELOG.md` and package exports.

## Verification

- Four session tests pass before and after: valid encrypted state/session round trips, expiry and type rejection, unknown-field stripping, purpose binding, ciphertext/IV/tag tampering, wrong key and disabled/missing configuration.
- All 20 targeted session, tracking bridge and Klarna authenticated bridge tests pass, using offline provider fixtures.
- `pnpm build` passes TypeScript, compilation and generation of all 59 static pages.
- ESLint passes for the changed source, tests and budget script.
- `node scripts/performance/check-tracking-import-budget.mjs` enforces 550,000 B / 120,000 B gzip ceilings.

No live provider events or payment requests were sent. Local implementation and checks only; not deployed.

# Tracking contract review — 2026-10-17

The manifest check reported seven differences from the pinned headless
commit `e74e6cd8310c88f2777cbfdf5ad6b431647d7f77`. Each diff was inspected
against that immutable Git source and the current tracking backend.
This review changes only provenance metadata and documentation, not runtime code.

| File | Reviewed difference |
| --- | --- |
| `reportClientCaughtError.ts` | Original sanitized stack, operation and bounded error coordinates. |
| `sanitizeClientErrorBeacon.ts` | Fixed React/HTTP/timeout/syntax categories and Vercel SDK labels. |
| `clientErrorDataSchema.ts` | Optional sanitized stack and operation; byte-identical to backend. |
| `sanitizeOperationalPathname.ts` | Explicit public-route allowlist; backend differs only by a trailing comma. |
| `cleanShopifyId.ts` | Quotes, semicolons and a trailing parameter comma only. |
| `zodMini.ts` | Quotes and semicolons only; same exports and locale initialization. |
| `LogPayload.ts` | Optional stack and operation types; byte-identical to backend. |

The existing `contract-overrides.json` mechanism records both the original
source hash and the reviewed current hash, with a reason for each file.
The pinned commit and base manifest remain unchanged. Future source changes
still fail the exact-hash check until reviewed.

Verification:

- Both `vendor-contracts.py --manifest` and the pinned-source comparison pass
  for all 117 files in the existing contract subset.
- 25 diagnostic and Zod contract tests pass. The diagnostic suite was run
  with `CLIENT_ERROR_BACKEND_ROOT` pointing to the actual tracking backend,
  so backend validation was exercised rather than the frontend copy twice.
- Chromium and WebKit fixtures exercise script parse errors; a real React
  hydration mismatch exercises early error capture. Synthetic traffic is
  intercepted locally and does not send production events.
- Tests preserve fixed diagnostic categories and positions while removing
  raw messages, query parameters and arbitrary private stack text.

Next.js 16.4.0's installed instrumentation-client documentation confirms
that synchronous initialization runs before hydration. Utekos Docs' error
reference was also consulted. No framework/API upgrade was needed.

This verifies the reviewed contract subset and diagnostics. It does not
prove a cause for historical `1:11853`, provider receipt, purchase
deduplication, or completeness of all cross-repository contracts.

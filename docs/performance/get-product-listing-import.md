# Product listing and wishlist import follow-up

Measured locally on Next.js 16.3.8, 2026-10-09. No deployment.

## Product listing

An isolated, minified esbuild server bundle of `getProductListing` reproduced the editor estimate: 192,460 bytes (52,635 gzip). Most of that graph belongs to Next caching, tracing, and fetch infrastructure. It is not 190 KB of browser JavaScript or Shopify response data.

`next.config.ts` now resolves the typed `cache-life` and `cache-tag` entry points to Next's shipped ESM implementations. This lets Turbopack remove more unused code without changing listing queries, pagination, cache lifetimes, or cache tags. These internal paths are version-specific: recheck both cache behavior and bundle output on Next upgrades. The editor's isolated import estimate may remain unchanged because it does not necessarily apply Turbopack aliases.

The configuration mechanism is documented in [Turbopack resolveAlias](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#resolving-aliases); implementation and local documentation were checked against installed 16.3.8.

## Wishlist

`WishlistButton` retains the lightweight tooltip introduced in the preceding audit. It is imported eagerly so the first hover does not wait for another module. The dialog uses `React.lazy` and renders inside Suspense only after a click. The budget script no longer excludes `next/dynamic`, so reintroducing that dependency will count toward the budget.

Final isolated budget, excluding shared React and CSS: **4,223 bytes initial gzip; 8,656 bytes gzip across all chunks**. These are summed per-file gzip sizes, not measured browser transfer sizes.

## Additional generated-code reductions

Fresh `pnpm exec next experimental-analyze --output` snapshots before and after this follow-up produced the following net reductions. Values sum JavaScript chunk-part sizes per route, including asynchronous code. They are uncompressed graph sizes, not first-load transfer or unique application totals. Shared code must not be summed across routes.

| Route | Server bytes removed | Client bytes removed |
| --- | ---: | ---: |
| `/` | 39,675 | 3,158 |
| `/produkter` | 40,978 | 3,315 |
| `/produkter/hytte` | 40,099 | 2,786 |
| `/produkter/[handle]` | 44,931 | 3,373 |
| `/api/search-index` | 31,050 | 0 |

These comparisons cover the cache aliases and wishlist refinement together, against the already optimized state from the preceding audit.

## Verification

- Final production build passed.
- 58 focused catalog, product, search, and review tests passed.
- ESLint on changed implementation files and `git diff --check` passed.
- Wishlist budget passed its 5,000-byte initial and 10,000-byte total gzip limits.
- Browser check passed first hover, dialog opening, Escape dismissal, trigger focus restoration, and wishlist storage; no page errors observed.
- Development requests to `/produkter` and `/produkter/hytte` returned HTTP 200 with the aliases enabled.

Local evidence: `/tmp/utekos-listing-build-final.log`, `/tmp/utekos-listing-tests.log`, `/tmp/utekos-wishlist-final-budget.json`. The analyzer snapshot directory is recorded in `/tmp/utekos-current-listing-audit`.

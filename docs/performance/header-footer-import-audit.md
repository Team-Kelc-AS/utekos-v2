# Header and Footer import audit

Measured locally on 2026-10-09 with Next 16.3.8, Zod 4.6.5 and esbuild 0.27.7. Decimal kB throughout. [Machine-readable measurements](header-footer-import-measurements.json).

## Footer change

Newsletter validation and its form-tracking dependencies used classic Zod. Migrated `newsletter/subscribe.ts`, `analytics/leadFormTrackingContext.ts`, `analytics/generateLeadEvent.ts` and `tracking/server-forms.ts` to the existing Zod Mini helper. Validation limits, strict objects, passthrough receipt fields, consent handling, Shopify requests, success/error copy and OIDC authentication remain intact.

| Measurement | Before | After | Saved |
|---|---:|---:|---:|
| Isolated Footer import | 983.666 kB | 562.389 kB | 421.277 kB |
| Same import, gzip | 208.012 kB | 124.659 kB | 83.353 kB |
| Next homepage server module graph | 4,030.466 kB | 3,735.760 kB | 294.706 kB |

The isolated Node bundle excludes shared React, Next and CSS, while including the newsletter server action and the full OIDC dependency chain. These comparable before/after figures use a different configuration from editor Import Cost; they do not reproduce the reported 669/103 kB. The remaining server dependencies include classic Zod 4.1.11 inside Vercel's OIDC SDK.

Some routes that retain classic Zod through other imports grow because shared module allocation changes: for example product detail and contact-form server graphs grow by 18,419 B. See all routes in the JSON; route sizes must not be summed as unique application bytes.

## Header finding

Header is already a Server Component with small client controls and deferred menu, search, category and cart dialogs. The isolated Node import is 1,192,765 B / 344,454 B gzip. That measurement alone includes 748,995 B from Lucide's CommonJS bundle. Next's actual homepage client graph uses the ESM icons and contains 7,746 B of Lucide code across the entire page, including deferred chunks.

The four Header client entry points (`CartHost`, `HeaderMenu`, `HeaderSearch`, `ProductCategories`) total 10,328 B / 5,395 B gzip in their initial static dependency graph, excluding shared React, Next and CSS. Including every deferred dependency gives 392,824 B / 138,868 B gzip in that same isolated browser measurement. These are existing sizes, not new savings, and do not represent total page downloads.

A `getImageProps` logo trial preserved image attributes and geometry but increased server code by 122 B with no client module reduction. It was fully reverted. Final Header and Footer presentation components are byte-for-byte unchanged from the task baseline.

## Client and verification evidence

All 57 Next route client module graph sizes are unchanged. Generated initial script files referenced by the homepage and size-guide HTML also have identical byte and gzip totals before/after. The implemented saving is server code.

- 49 existing newsletter, tracking backend/browser and header search tests pass with offline provider fixtures.
- 41 direct comparisons against the saved pre-change schemas produce identical parsed values or validation issues, including strict fields, currency, value, UUID, URL and string-length boundaries.
- Production build, TypeScript and all 59 static pages pass. Scoped ESLint and the Footer import budget pass.
- Local browser checks at 1440px and 390px pass: unchanged Header image attributes/geometry, menu expansion, Escape/focus restoration, category filtering, search opening, empty cart, newsletter email validity and no mobile overflow or page errors.
- Fixed invalid default `Link` imports from `next/navigation` in `KnowledgeArticleMeta.tsx` and `KnowledgeSources.tsx` to `next/link`; these caused HTTP 500 during verification. Preserved other edits in those files.

Recheck the isolated Footer budget with `node scripts/performance/check-footer-import-budget.mjs`.

References: installed Next 16.3.8 guides for server/client components, lazy loading, package bundling and `getImageProps`; [Next lazy loading](https://nextjs.org/docs/app/guides/lazy-loading); [Zod Mini](https://zod.dev/packages/mini). Zod 4.6.5 documentation was also checked through Context7.

No live newsletter signup, tracking event, payment or deployment was performed.

# Cart read import audit

Measured locally on Next.js 16.3.8, 2026-10-09. No deployment.

The `CartSlot` import remains:

```ts
import { CART_COOKIE, cartView, readCart } from '@/lib/cart/server';
```

Previously, cart ID validation came from `klarna/server`, pulling payment contracts, Zod, and backend dependencies into the read graph. The same file also imported product loading for cart mutations and reused pagination from that cached product loader.

The refactor moves the existing ID parser and cookie name to `cart/identity`, mutations to `cart/mutations`, and the shared GraphQL request/types to `cart/graphql`. `CartError` has one implementation in `cart/error`, re-exported by `cart/server`. Product pagination now lives in `shopify/completeConnection`, shared by product loading, product cards and cart reads. Mutation routes import mutations explicitly.

Read, view, mutation, ID-validation and pagination function bodies were compared against the pre-edit snapshot: unchanged except for renaming the shared request helper. Checkout correlation, commerce mapping, privacy boundaries, mutation retry policy and cache behavior are preserved.

## Measurements

For the exact three-symbol import, isolated esbuild output changed from **1,159,836 bytes / 254,590 gzip** to **10,401 bytes / 3,914 gzip**. These measurements use the same bundler settings before and after. They differ from the editor's reported 703 KB / 161.78 KB because the measurement setup is different; they are not browser transfer sizes. No runtime dependency is merely externalized to obtain the reduction.

Fresh [Next analyzer](https://nextjs.org/docs/app/guides/package-bundling) snapshots also show the following changes in generated JavaScript. Values are uncompressed chunk-part totals per route, including shared and asynchronous modules. Do not add routes together as a unique application total.

| Route | Server bytes removed | Client bytes removed |
| --- | ---: | ---: |
| `/` | 2,927 | 0 |
| `/produkter` | 1,348 | 0 |
| `/produkter/[handle]` | 886 | 0 |
| `/api/cart` | 475,085 | 0 |
| `/api/cart/checkout` | 687,315 | 0 |
| `/api/klarna/orders` | 220,664 | 0 |
| `/api/klarna/prepare` | -1,550 | 0 |

The negative value means Klarna preparation gained 1,550 bytes of module overhead; it still needs both mutations and payment code. Storefront pages retain dependencies needed elsewhere, so their total reduction is much smaller than the isolated import reduction.

Full numbers and measurement settings: [cart-import-measurements.json](./cart-import-measurements.json).

### Direct cart ID import

The remaining `cartIdentity` re-export through `klarna/server` was removed. All callers now use `cart/identity` directly. With the same isolated esbuild settings, importing only `cartIdentity` measures **500 bytes / 352 gzip** from `cart/identity`, versus 962,783 bytes / 200,887 gzip through the former Klarna re-export. These are isolated dependency measurements; the Klarna order route still needs its payment implementation for other operations. Fresh TypeScript, scoped ESLint and 30 cart/Klarna tests passed after this follow-up.

## Verification

- Production build passed, including TypeScript.
- 68 focused cart, checkout, Klarna, product and pagination tests passed. New read tests cover line/collection pagination, buyer IP, `no-store`, authoritative totals, secret-key exclusion, expiry and cursor-loop rejection.
- Scoped ESLint and `git diff --check` passed.
- `node scripts/performance/check-cart-read-budget.mjs` passed: 15,000 bytes raw / 5,000 gzip limits. Only `server-only` is external; Node built-ins remain native.
- Browser verification on the existing local dev server passed: `/api/cart` returned 200 with private/no-store headers and an empty cart; the product page, cart drawer, Escape dismissal and focus restoration worked without page errors. Populated-cart behavior and mutations were verified with fixtures; no payment was submitted.

Raw local evidence is in the directory recorded by `/tmp/utekos-current-cart-audit`; build and test logs are `/tmp/utekos-cart-build.log` and `/tmp/utekos-cart-tests.log`.

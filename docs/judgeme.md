# Judge.me product reviews

`ProductReviews` shows the rating and logo below the product's shipping/size-exchange benefits. `ProductDescription` follows it, with an adjustable 300-character preview and native “Les mer” / “Les mindre” disclosure. `ProductReviewList` shows “Les kundeomtalene” in the lower details area, where the description used to be. These are Server Components; both review components share the same cached fetch. Reviews use the product's Shopify GID, never the variant ID or a store-wide fallback. The former hardcoded product rating has been replaced; homepage testimonial content is outside this integration.

Configuration: `JUDGE_ME_PUBLIC_API_TOKEN` and `SHOPIFY_STORE_DOMAIN`. The private token is not needed. Requests use the `X-Api-Token` header and `external_id` with `GET https://api.judge.me/api/v1/widgets/product_review`.

Judge.me recommends widget endpoints for storefront display because the raw `/reviews` endpoint can include unpublished reviews and private reviewer fields. See [official API documentation](https://judge.me/api/docs) and [OpenAPI specification](https://judge.me/api/docs.yaml), checked 2026-10-07.

The published widget is parsed on the server with `cheerio/slim`. Only rating, count, public display name, text, date and verified-buyer status reach the page. React escapes the extracted text; no provider HTML, scripts, email addresses, client SDK or new JSON-LD is injected. Native `details` exposes the review list without JavaScript. The supplied `public/logo-judgme.svg` keeps its original ratio.

Successful results revalidate after five minutes (maximum cache age one hour). Reviews stream separately so the API does not block product selection/purchasing. Pagination is bounded at ten pages of up to 100 reviews, deduplicates IDs, and stops if the provider repeats a page. If only part of the collection is available, the UI labels the visible count separately from the provider's aggregate total. A mismatched product, malformed response or provider error suppresses the block and uses the short cache profile; historical ratings are never substituted.

Verified locally: 12 tests via `node --test tests/judgeme.test.cjs`, scoped ESLint, TypeScript, production build and browser checks at 320/390/1440 px. Read-only live results: TechDown 15 reviews (4.93), Mikrofiber 5 (5), Dun 1 (5), Stapper 2 (5). Placement, keyboard disclosure, product mapping and absence of tokens/browser API calls were checked. The production client manifest contains no review/parser client modules. No reviews, invitations or customer records were created.

JavaScript-disabled full-page check remains limited by the product route's existing streamed Suspense boundary: product title and review markup arrive in the HTML, but remain hidden behind “Laster produkt …”. The review disclosure adds no JavaScript of its own; this integration does not change the page-level streaming behavior.

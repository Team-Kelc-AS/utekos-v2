# Meta native bridge rejection

The published `meta-capi-param-builder-clientjs` 1.3.2 SDK attaches a
fulfillment callback with `promise.then(...)` but passes the original promise
to `Promise.allSettled`. A rejected native bridge response therefore leaves
the derived promise unhandled even though collection itself resolves.

An offline reproduction using the installed SDK produced a successful
collection and a `synthetic_native_rejection` browser error. The integration
regression failed in both Chromium and WebKit before the patch.

The pnpm patch passes the derived promise to `allSettled` in both the iOS and
Android branches. It changes the published source and the distributed bundle
used by the package entry point. Fulfilled values and rejection handling stay
within the existing collection boundary. No global error suppression, new
identifiers, bridge replacement, or retry is added.

The five-second application fallback remains necessary for native bridges
that never settle. This patch does not establish that the historical
product-page error at `1:11853` came from this SDK, or fix React hydration #418.

Regression: `node --test --test-name-pattern='Meta rejected native bridge|Meta unavailable native bridge|Meta pagehide' tests/tracking-browser.test.cjs`.

Review and remove the patch when a later upstream release correctly awaits
the derived promises. Version 1.3.2 was the latest npm release when checked.

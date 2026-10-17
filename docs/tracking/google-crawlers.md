# Google crawlers and fetchers

Verified against the official Google documents on 2026-10-17:
- https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers (updated 2026-10-15)
- https://developers.google.com/crawling/docs/crawlers-fetchers/google-special-case-crawlers
- https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers
- https://developers.google.com/crawling/docs/crawlers-fetchers/feedfetcher
- https://developers.google.com/search/docs/crawling-indexing/googlebot
- https://developers.google.com/crawling/docs/crawlers-fetchers/apis-user-agent

Google native documentation MCP required reauthentication; official web documents
were read directly. No package upgrade was required. Installed Next 16.4 metadata
configuration already blocks metadata streaming for every user agent.

## Policy

Public pages, images and rendering assets remain available with the same content
as ordinary visitors. Explicit robots allow groups cover common crawlers and
special-case robots tokens; no crawl-delay or resource blocking is added.
Google-Extended and Googlebot-News are robots controls, not separate HTTP agents.
Google-Extended permission is not a Search ranking improvement.

The documented active HTTP crawler/fetcher tokens opt out of customer telemetry,
Pixel, Stape loading and tracking identity cookies. Matching is bounded to complete
tokens, not Google/Chrome substrings. Ordinary Chrome and Google app visitors
remain eligible. Retired tokens are not treated as active documented crawlers.

Passive crawlers do not create a cart merely by fetching a discount link.
Storebot-Google shopping checks and Google-Agent user-delegated actions retain
normal operational cart handling. Browser telemetry suppression does not suppress
server-confirmed order handling. User agents never authorize private operations.

APIs-Google is a notification sender and deliberately remains outside the browser
telemetry matcher. Existing authentication, origin and callback handling remain
in force; no notification subscription or new endpoint is provisioned.
FeedFetcher retrieves user-supplied RSS/Atom URLs, not a product sitemap. No RSS
or Atom endpoint was found in the storefront routes; no feed or subscription is
invented as part of this crawler compatibility change. User-triggered fetchers
can ignore robots.txt; their public access is not dependent on a fake robots rule.
No WAF bypass or claim of Google identity is based on a self-reported user agent.

## Verification

Pre-release production GET checks covered all five products (Comfyrobe, TechDown,
Dun, Stapper, Mikrofiber) using Googlebot mobile/desktop, AdsBot, Storebot and
InspectionTool: 25 HTTP 200 responses, canonical and indexable metadata, parseable
Product JSON-LD, HTML below 2 MB. Representative CSS, JS and OG images for every
product returned 200 with Googlebot UA. All five are in sitemap; unknown product
returns HTTP 404. This is compatibility evidence, not a genuine Google crawl,
Search Console indexing status, rich-result eligibility or ranking evidence.

Regression tests cover all documented current HTTP tokens, misleading token
boundaries, actual standalone Pixel execution, normal Google app browsers,
APIs-Google, passive discount fetching, active cart flows, collector early
suppression, document proxy and Stape wrappers. Production browser checks after
release must separately verify the deployed script and crawler behavior.

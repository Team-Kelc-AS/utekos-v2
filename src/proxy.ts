import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { type NextRequest } from "next/server";
import { applyCookieKeeperUserIdCookie } from "@/lib/analytics/server/stapeCookieKeeperUserId";
import { captureProxyMetaCookies } from "@/lib/analytics/server/captureProxyMetaCookies";
import { applyProxyMetaCookies } from "@/lib/analytics/server/applyProxyMetaCookies";
import { isDocumentNavigation } from "@/lib/tracking/documentRequest";
import {
  isTrackingOrigin,
  productionTrackingEnabled,
} from "@/lib/tracking/environment";
import { telemetryRewriteUrl } from "@/lib/tracking/telemetryRoutes";
import { isMetaAdsCrawler } from "@/lib/tracking/metaAdsCrawler";

function noStore<T extends NextResponse>(response: T): T {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Vercel-CDN-Cache-Control", "no-store");
  return response;
}

export function proxy(request: NextRequest) {
  const enabled = productionTrackingEnabled() && isTrackingOrigin(request.url);

  if (request.nextUrl.pathname.startsWith("/telemetry/v1/")) {
    const target = enabled ? telemetryRewriteUrl(new URL(request.url)) : null;
    return noStore(
      target
        ? NextResponse.rewrite(target)
        : new NextResponse(null, { status: 404 }),
    );
  }

  // Next 16.4 does not support URL-encoded fetch actions. Its not-found
  // fallback replays the page's PPR tree against a different 404 tree.
  // Reject only this invalid protocol combination before rendering; ordinary
  // forms (no Next-Action header) and supported action bodies pass through.
  if (
    request.method === "POST" &&
    request.headers.has("next-action") &&
    request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ===
      "application/x-www-form-urlencoded"
  ) {
    return noStore(new NextResponse("Invalid Server Actions request.", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-nextjs-action-not-found": "1",
      },
    }));
  }

  if (!enabled || !isDocumentNavigation(request) || isMetaAdsCrawler(request.headers.get('user-agent'))) return NextResponse.next();

  const metaCookies = captureProxyMetaCookies(request);
  const response = NextResponse.next({
    request: { headers: new Headers(request.headers) },
  });

  // The master ID is available before the loader executes. Preserve valid IDs
  // and refresh the pinned 400-day lifetime on document responses only.
  return noStore(
    applyCookieKeeperUserIdCookie(
      applyProxyMetaCookies(response, request, metaCookies),
      request,
    ),
  );
}

export const config = {
  matcher: [
    "/telemetry/v1/:path*",
    {
      source:
        "/((?!api(?:/|$)|__sgtm(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|analytics(?:/|$)|telemetry(?:/|$)|.*\\.(?:avif|bmp|css|csv|gif|ico|jpe?g|js|json|map|mp3|mp4|pdf|png|svg|txt|webmanifest|webp|woff2?|xml)$).*)",
      has: [{ type: "header", key: "next-action" }],
    },
    {
      source:
        "/((?!api(?:/|$)|__sgtm(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|analytics(?:/|$)|telemetry(?:/|$)|.*\\.(?:avif|bmp|css|csv|gif|ico|jpe?g|js|json|map|mp3|mp4|pdf|png|svg|txt|webmanifest|webp|woff2?|xml)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
        { type: "header", key: "rsc", value: "1" },
      ],
    },
  ],
};

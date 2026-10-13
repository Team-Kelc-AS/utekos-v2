import type { NextRequest } from "next/server";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { applyDiscountCode, discountCode, discountDestination } from "@/lib/cart/discount";
import { CART_COOKIE } from "@/lib/cart/identity";
import { CartError } from "@/lib/cart/error";
import { buyerIp, privateHeaders } from "@/lib/cart/request";
import { isMetaAdsCrawler } from "@/lib/tracking/metaAdsCrawler";

function destination(request: NextRequest) {
  const response = NextResponse.redirect(discountDestination(request.url), 303);
  for (const [name, value] of Object.entries(privateHeaders)) response.headers.set(name, value);
  return response;
}

export async function GET(request: NextRequest, context: RouteContext<"/discount/[code]">) {
  try {
    const code = discountCode((await context.params).code);
    const response = destination(request);
    // Navigation previews and the ads crawler must not create carts.
    if (isMetaAdsCrawler(request.headers.get("user-agent")) ||
      request.headers.has("next-router-prefetch") ||
      /prefetch/i.test(request.headers.get("purpose") ?? request.headers.get("sec-purpose") ?? "")) return response;
    const cart = await applyDiscountCode(code, request.cookies.get(CART_COOKIE)?.value, buyerIp(request));
    response.cookies.set(CART_COOKIE, cart.id, {
      httpOnly: true, secure: request.nextUrl.protocol === "https:",
      sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 10,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof CartError ? error.message : "Rabattkoden kunne ikke legges til. Prøv igjen." }, {
      status: error instanceof CartError ? error.status : 502, headers: privateHeaders,
    });
  }
}

// Next normally delegates HEAD to GET; a link check must not mutate a cart.
export function HEAD(request: NextRequest) {
  return destination(request);
}

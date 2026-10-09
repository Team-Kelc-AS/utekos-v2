import { CART_COOKIE, CartError, cartView, readCart } from "@/lib/cart/server";
import {
  FACEBOOK_SESSION_COOKIE,
  readSession,
} from "@/lib/facebook-login/session";
import { NextRequest, NextResponse } from "next/server";
import { buyerIp, privateHeaders, sameOrigin } from "@/lib/cart/request";
import {
  parseCheckoutEvent,
  persistCheckoutAttributes,
} from "@/lib/cart/checkout";

import { campaignAttributionSchema } from "@/lib/analytics/campaignAttribution";
import { z } from "zod";
const preparationSchema = z.strictObject({
  method: z.enum(["shopify", "klarna"]),
  event: z.unknown().nullable(),
  campaign: z.unknown().optional(),
});
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 403, headers: privateHeaders },
    );
  if (Number(request.headers.get("content-length")) > 131072)
    return NextResponse.json(
      { error: "Forespørselen er for stor." },
      { status: 413, headers: privateHeaders },
    );
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > 131072)
    return NextResponse.json(
      { error: "Forespørselen er for stor." },
      { status: 413, headers: privateHeaders },
    );
  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    input = null;
  }
  const parsed = preparationSchema.safeParse(input);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 400, headers: privateHeaders },
    );
  const campaign =
    parsed.data.campaign === undefined
      ? undefined
      : campaignAttributionSchema.safeParse(parsed.data.campaign);
  if (campaign && !campaign.success)
    return NextResponse.json(
      { error: "Ugyldig attribusjon." },
      { status: 400, headers: privateHeaders },
    );
  try {
    const id = request.cookies.get(CART_COOKIE)?.value;
    const cart = id ? await readCart(id, buyerIp(request)) : null;
    if (!cart?.totalQuantity)
      return NextResponse.json(
        { error: "Handlekurven er tom." },
        { status: 409, headers: privateHeaders },
      );
    const view = await cartView(cart, buyerIp(request));
    const event = parseCheckoutEvent(
      parsed.data.event,
      view,
      request.nextUrl.origin,
      parsed.data.method,
    );
    const facebookId = readSession(
      request.cookies.get(FACEBOOK_SESSION_COOKIE)?.value,
      "session",
    )?.userId;
    await persistCheckoutAttributes(
      cart.id,
      view,
      event,
      facebookId,
      buyerIp(request),
      campaign?.data,
    );
    const url = new URL(cart.checkoutUrl);
    if (url.protocol !== "https:") throw new Error("Invalid checkout URL");
    return NextResponse.json(
      { checkoutUrl: url.toString() },
      { headers: privateHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof CartError
            ? error.message
            : "Kassen kunne ikke åpnes. Prøv igjen.",
      },
      {
        status: error instanceof CartError ? error.status : 502,
        headers: privateHeaders,
      },
    );
  }
}

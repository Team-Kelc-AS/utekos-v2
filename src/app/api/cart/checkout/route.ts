import { isPublicProduct } from '@/lib/products/publicProduct';
import { CART_COOKIE, CartError, cartView, readCart } from "@/lib/cart/server";
import {
  FACEBOOK_SESSION_COOKIE,
  readSession,
} from "@/lib/facebook-login/session";
import { buyerIp, privateHeaders, sameOrigin } from "@/lib/cart/request";
import {
  parseCheckoutEvent,
  persistCheckoutAttributes,
  prefillKlarnaCheckoutEmail,
} from "@/lib/cart/checkout";
import { KLARNA_IDENTITY_SESSION_COOKIE, readKlarnaSession } from '@/lib/klarna/identity';

import { NextRequest } from "next/dist/server/web/spec-extension/request";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { campaignAttributionSchema } from "@/lib/analytics/campaignAttribution";
import { z } from "zod";
import { compareCheckoutUrls } from "@/lib/cart/checkout-identity";
import {
  COMFY_BUY_NOW_CART_COOKIE,
  comfyBuyNowVariants,
} from "@/lib/cart/comfyBuyNow";
import { COMFY_SHIPPING_CODE } from "@/lib/cart/suggestions";

const preparationSchema = z.strictObject({
  method: z.enum(["shopify", "klarna"]),
  event: z.unknown().nullable(),
  campaign: z.unknown().optional(),
  buyNowSize: z.enum(["xs", "xl"]).optional(),
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
  if (parsed.data.buyNowSize && parsed.data.method !== "shopify")
    return NextResponse.json(
      { error: "Ugyldig betalingsmetode." },
      { status: 400, headers: privateHeaders },
    );
  try {
    const id = request.cookies.get(
      parsed.data.buyNowSize ? COMFY_BUY_NOW_CART_COOKIE : CART_COOKIE,
    )?.value;
    const cart = id ? await readCart(id, buyerIp(request)) : null;
    if (!cart?.totalQuantity)
      return NextResponse.json(
        { error: "Handlekurven er tom." },
        { status: 409, headers: privateHeaders },
      );
    const view = await cartView(cart, buyerIp(request));
    if (view.lines.some(line => !isPublicProduct(line.handle))) {
      throw new CartError("Handlekurven inneholder en utgått modell. Fjern den før du går til kassen.", 409);
    }
    if (parsed.data.buyNowSize) {
      const variantId = comfyBuyNowVariants[parsed.data.buyNowSize];
      if (
        view.totalQuantity !== 1 ||
        view.lines.length !== 1 ||
        view.lines[0].variantId !== variantId ||
        !view.lines[0].available ||
        !view.discountCodes?.some((code) => code.code.toUpperCase() === COMFY_SHIPPING_CODE)
      ) {
        throw new CartError("Kassen ble endret. Prøv igjen.", 409);
      }
    }
    let event;
    try {
      event = parseCheckoutEvent(
        parsed.data.event,
        view,
        request.nextUrl.origin,
        parsed.data.method,
      );
    } catch (error) {
      if (error instanceof CartError && error.status === 409) {
        // Re-read only a rejected preparation; no attributes/payment are written.
        try {
          const reread = await readCart(cart.id, buyerIp(request));
          console.warn('checkout_url_variability', reread
            ? compareCheckoutUrls(cart.id, cart.checkoutUrl, reread.checkoutUrl)
            : { cart_available: false });
        } catch {
          console.warn('checkout_url_variability', { readback_available: false });
        }
      }
      throw error;
    }
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
      parsed.data.buyNowSize ? "comfyrobe_buy_now" : undefined,
      request.headers.get("cookie") ?? "",
    );
    let klarnaSession = null;
    if (parsed.data.method === 'shopify') {
      try {
        klarnaSession = readKlarnaSession(request.cookies.get(KLARNA_IDENTITY_SESSION_COOKIE)?.value);
      } catch {
        console.warn('klarna_identity_config_invalid');
      }
    }
    if (klarnaSession && !cart.buyerIdentity?.email) {
      try {
        await prefillKlarnaCheckoutEmail(cart.id, cart.checkoutUrl, klarnaSession.email, buyerIp(request));
      } catch {
        console.warn('klarna_identity_checkout_prefill_failed');
        const reread = await readCart(cart.id, buyerIp(request));
        if (!reread || reread.checkoutUrl !== cart.checkoutUrl) {
          throw new CartError('Kassen ble oppdatert. Prøv igjen.', 409);
        }
      }
    }
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

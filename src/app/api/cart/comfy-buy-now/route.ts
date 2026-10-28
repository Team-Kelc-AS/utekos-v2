import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { applyDiscountCode } from "@/lib/cart/discount";
import {
  COMFY_BUY_NOW_CART_COOKIE,
  comfyBuyNowVariants,
} from "@/lib/cart/comfyBuyNow";
import { mutateCart } from "@/lib/cart/mutations";
import { CartError, cartView, readCart } from "@/lib/cart/server";
import { buyerIp, privateHeaders, sameOrigin } from "@/lib/cart/request";
import { COMFY_SHIPPING_CODE } from "@/lib/cart/suggestions";

const inputSchema = z.strictObject({ size: z.enum(["xs", "xl"]) });

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 403, headers: privateHeaders },
    );
  }
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > 2048) {
    return NextResponse.json(
      { error: "Forespørselen er for stor." },
      { status: 413, headers: privateHeaders },
    );
  }
  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    input = null;
  }
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ugyldig produktvariant." },
      { status: 400, headers: privateHeaders },
    );
  }

  try {
    const variantId = comfyBuyNowVariants[parsed.data.size];
    const result = await mutateCart(
      { action: "add", handle: "comfyrobe", variantId, quantity: 1 },
      undefined,
      buyerIp(request),
    );
    const discounted = await applyDiscountCode(
      COMFY_SHIPPING_CODE,
      result.id,
      buyerIp(request),
    );
    if (!discounted.discountCodes.some((code) => code.code.toUpperCase() === COMFY_SHIPPING_CODE)) {
      throw new CartError("Rabattkoden kunne ikke bekreftes. Prøv igjen.", 409);
    }
    const cart = await cartView(await readCart(result.id, buyerIp(request)), buyerIp(request));
    if (
      cart.totalQuantity !== 1 ||
      cart.lines.length !== 1 ||
      cart.lines[0].variantId !== variantId ||
      !cart.lines[0].available ||
      !cart.checkout
    ) {
      throw new CartError("Kassen kunne ikke forberedes. Prøv igjen.", 409);
    }
    const response = NextResponse.json(
      { cart, warnings: result.warnings, mutation: result.mutation },
      { headers: privateHeaders },
    );
    response.cookies.set(COMFY_BUY_NOW_CART_COOKIE, result.id, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof CartError
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

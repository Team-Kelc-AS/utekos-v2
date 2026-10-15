import { CART_COOKIE, CartError, readCart, cartView } from "@/lib/cart/server";
import {
  KlarnaBridgeError,
  cartOrderPayload,
  headlessOrigin,
} from "@/lib/klarna/server";
import { buyerIp, privateHeaders, sameOrigin } from "@/lib/cart/request";

import type { CartResult } from "@/lib/cart/types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { mutateCart } from "@/lib/cart/mutations";
import { prepareSchema } from "@/lib/klarna/contracts";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 403, headers: privateHeaders },
    );
  const parsed = prepareSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Kontroller handlekurven eller produktvarianten." },
      { status: 400, headers: privateHeaders },
    );
  let cartId: string | undefined;
  let preparedCart: CartResult | undefined;
  let response: NextResponse;
  try {
    const origin = headlessOrigin(request.nextUrl.origin);
    const existingId = request.cookies.get(CART_COOKIE)?.value;
    let paymentCartId: string;
    if ('scope' in parsed.data) {
      const raw = existingId ? await readCart(existingId, buyerIp(request)) : null;
      preparedCart = { cart: await cartView(raw, buyerIp(request)), warnings: [] };
      if (!existingId || !raw || !preparedCart.cart.lines.length)
        throw new KlarnaBridgeError("Handlekurven er tom. Legg til en vare først.", 409);
      // Cart Express checks out the existing cart without adding another item.
      paymentCartId = existingId;
    } else {
      const result = await mutateCart(
        { action: "add", ...parsed.data, quantity: 1 }, existingId, buyerIp(request),
      );
      cartId = result.id;
      paymentCartId = result.id;
      preparedCart = { cart: result.cart, warnings: result.warnings, mutation: result.mutation };
    }
    if (preparedCart.cart.requiresStandardCheckout)
      throw new KlarnaBridgeError("Bruk Til kassen for å beholde rabatten og fraktfordelene dine.", 409);
    if (preparedCart.warnings.length)
      throw new KlarnaBridgeError(
        "Handlekurven ble justert. Kontroller den før du betaler.",
        409,
      );
    const orderPayload = await cartOrderPayload(
      paymentCartId,
      origin,
      buyerIp(request),
    );
    response = NextResponse.json(
      {
        orderPayload,
        shopifyCartId: orderPayload.merchant_reference1,
        ...preparedCart,
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    const known =
      error instanceof CartError || error instanceof KlarnaBridgeError;
    response = NextResponse.json(
      {
        ...preparedCart,
        error: known ? error.message : "Klarna er midlertidig utilgjengelig.",
      },
      { status: known ? error.status : 502, headers: privateHeaders },
    );
  }
  // Keep a successfully created cart even if payment preparation subsequently fails.
  if (cartId)
    response.cookies.set(CART_COOKIE, cartId, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 10,
    });
  return response;
}

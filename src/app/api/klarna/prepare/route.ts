import { mutateCart } from '@/lib/cart/mutations';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { CART_COOKIE, CartError } from '@/lib/cart/server';
import type { CartResult } from '@/lib/cart/types';
import { sameOrigin, buyerIp, privateHeaders } from '@/lib/cart/request';
import { prepareSchema } from '@/lib/klarna/contracts';
import { headlessOrigin, cartOrderPayload, KlarnaBridgeError } from '@/lib/klarna/server';

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 403, headers: privateHeaders });
  const parsed = prepareSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Kontroller produktvarianten.' }, { status: 400, headers: privateHeaders });
  let cartId: string | undefined;
  let preparedCart: CartResult | undefined;
  let response: NextResponse;
  try {
    const origin = headlessOrigin(request.nextUrl.origin);
    const result = await mutateCart({ action: 'add', ...parsed.data, quantity: 1 }, request.cookies.get(CART_COOKIE)?.value, buyerIp(request));
    cartId = result.id;
    preparedCart = { cart: result.cart, warnings: result.warnings, mutation: result.mutation };
    if (result.warnings.length) throw new KlarnaBridgeError('Handlekurven ble justert. Kontroller den før du betaler.', 409);
    const orderPayload = await cartOrderPayload(result.id, origin, buyerIp(request));
    response = NextResponse.json({ orderPayload, shopifyCartId: orderPayload.merchant_reference1, ...preparedCart }, { headers: privateHeaders });
  } catch (error) {
    const known = error instanceof CartError || error instanceof KlarnaBridgeError;
    response = NextResponse.json({ ...preparedCart, error: known ? error.message : 'Klarna er midlertidig utilgjengelig.' }, { status: known ? error.status : 502, headers: privateHeaders });
  }
  // Keep a successfully created cart even if payment preparation subsequently fails.
  if (cartId) response.cookies.set(CART_COOKIE, cartId, { httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 10 });
  return response;
}

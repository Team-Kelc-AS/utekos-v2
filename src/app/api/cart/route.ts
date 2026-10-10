import { mutateCart } from '@/lib/cart/mutations';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { z } from 'zod';
import { CART_COOKIE, CartError, readCart, cartView } from '@/lib/cart/server';
import { sameOrigin, buyerIp, privateHeaders } from '@/lib/cart/request';
const quantity = z.number().int().min(1).max(99);
const operationSchema = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('add'), handle: z.string().regex(/^[a-z0-9-]{1,100}$/), variantId: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/), quantity }),
  z.strictObject({ action: z.literal('update'), lineId: z.string().min(1).max(1024), quantity }),
  z.strictObject({ action: z.literal('remove'), lineId: z.string().min(1).max(1024) }),
]);
function errorResponse(error: unknown) {
  return NextResponse.json({ error: error instanceof CartError ? error.message : 'Handlekurven er midlertidig utilgjengelig. Prøv igjen.' }, { status: error instanceof CartError ? error.status : 502, headers: privateHeaders });
}
export async function GET(request: NextRequest) {
  try {
    const id = request.cookies.get(CART_COOKIE)?.value;
    const raw = id ? await readCart(id, buyerIp(request)) : null;
    const response = NextResponse.json({ cart: await cartView(raw, buyerIp(request)), warnings: [] }, { headers: privateHeaders });
    if (id && !raw) response.cookies.delete(CART_COOKIE);
    return response;
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 403, headers: privateHeaders });
  const parsed = operationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Kontroller variant og antall.' }, { status: 400, headers: privateHeaders });
  try {
    const result = await mutateCart(parsed.data, request.cookies.get(CART_COOKIE)?.value, buyerIp(request));
    const response = NextResponse.json({ cart: result.cart, warnings: result.warnings, mutation: result.mutation }, { headers: privateHeaders });
    response.cookies.set(CART_COOKIE, result.id, { httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 10 });
    return response;
  } catch (error) { return errorResponse(error); }
}

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { applyDiscountCode } from '@/lib/cart/discount';
import { CART_COOKIE, CartError, readCart, cartView } from '@/lib/cart/server';
import { buyerIp, privateHeaders, sameOrigin } from '@/lib/cart/request';
import { COMFY_SHIPPING_CODE } from '@/lib/cart/suggestions';
const schema = z.strictObject({ code: z.enum([COMFY_SHIPPING_CODE]) });
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return Response.json({ error: 'Ugyldig forespørsel.' }, { status: 403, headers: privateHeaders });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Ugyldig rabattkode.' }, { status: 400, headers: privateHeaders });
  try {
    const id = request.cookies.get(CART_COOKIE)?.value;
    const raw = id ? await readCart(id, buyerIp(request)) : null;
    if (!id || !raw || !raw.totalQuantity) throw new CartError('Handlekurven er tom.', 409);
    // COMFYFRI does not combine with other discounts. Leave the current
    // selection intact instead of silently replacing it or changing its value.
    if (raw.discountCodes?.some(code => code.applicable && code.code.toUpperCase() !== parsed.data.code))
      throw new CartError('Denne koden kan ikke kombineres med rabattkoden som allerede er i bruk.', 409);
    await applyDiscountCode(parsed.data.code, id, buyerIp(request));
    const cart = await cartView(await readCart(id, buyerIp(request)), buyerIp(request));
    const applied = cart.discountCodes?.some(code => code.applicable && code.code.toUpperCase() === parsed.data.code);
    return Response.json({ cart, warnings: applied ? [] : ['Rabattkoden kunne ikke brukes på denne handlekurven. Shopify velger rabatten som gjelder.'] }, { headers: privateHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof CartError ? error.message : 'Rabattkoden kunne ikke legges til. Prøv igjen.' }, { status: error instanceof CartError ? error.status : 502, headers: privateHeaders });
  }
}

import 'server-only';
import { cookies } from 'next/dist/server/request/cookies';
import { headers } from 'next/dist/server/request/headers';
import { CART_COOKIE, cartView, readCart } from '@/lib/cart/server';
import type { Cart } from '@/lib/cart/types';
import { CartHost } from './CartHost';
export async function CartSlot() {
  const id = (await cookies()).get(CART_COOKIE)?.value;
  let cart: Cart | undefined;
  try {
    const ip = id && process.env.VERCEL ? (await headers()).get('x-vercel-forwarded-for')?.split(',')[0]?.trim() : undefined;
    cart = await cartView(id ? await readCart(id, ip) : null, ip);
  } catch { /* The drawer can retry without blocking the rest of the header. */ }
  return <CartHost initialCart={cart} />;
}

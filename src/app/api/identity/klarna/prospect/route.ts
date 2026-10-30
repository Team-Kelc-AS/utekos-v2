import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CART_COOKIE, cartView, readCart } from '@/lib/cart/server';
import { buyerIp, privateHeaders, sameOrigin } from '@/lib/cart/request';
import { KLARNA_IDENTITY_SESSION_COOKIE, readKlarnaSession } from '@/lib/klarna/identity';
import { forwardKlarnaProspect, prospectCartSnapshot } from '@/lib/klarna/prospect';

const inputSchema = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('state') }),
  z.strictObject({ action: z.literal('cart') }),
  z.strictObject({
    action: z.literal('save'),
    emailMarketing: z.boolean(), cartReminders: z.boolean(), adMatching: z.boolean(),
    comfyrobeSize: z.enum(['XS', 'XL']).nullable(),
    favoriteColor: z.enum(['Vargnatt', 'Fjellblå', 'Havdyp', 'Fjellnatt']).nullable(),
    interests: z.array(z.enum(['camping-og-bobil', 'hytte', 'terrasse', 'glamping', 'annet'])).max(5),
  }),
]);

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 403, headers: privateHeaders });
  if (Number(request.headers.get('content-length')) > 4096) return NextResponse.json({ error: 'Forespørselen er for stor.' }, { status: 413, headers: privateHeaders });
  const body = await request.text();
  if (Buffer.byteLength(body) > 4096) return NextResponse.json({ error: 'Forespørselen er for stor.' }, { status: 413, headers: privateHeaders });
  let value: unknown;
  try { value = JSON.parse(body); } catch { value = null; }
  const parsed = inputSchema.safeParse(value);
  if (!parsed.success) return NextResponse.json({ error: 'Ugyldige valg.' }, { status: 400, headers: privateHeaders });
  const session = readKlarnaSession(request.cookies.get(KLARNA_IDENTITY_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: 'Logg inn med Klarna først.' }, { status: 401, headers: privateHeaders });
  try {
    const input = parsed.data;
    if (input.action === 'state') return forwardKlarnaProspect(request, session, input);
    const cartId = request.cookies.get(CART_COOKIE)?.value;
    const raw = cartId ? await readCart(cartId, buyerIp(request)) : null;
    const cart = prospectCartSnapshot(await cartView(raw, buyerIp(request)));
    return forwardKlarnaProspect(request, session, { ...input, cart });
  } catch {
    return NextResponse.json({ error: 'Valgene kunne ikke lagres. Prøv igjen.' }, { status: 503, headers: privateHeaders });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { CART_COOKIE } from '@/lib/cart/server';
import { sameOrigin, buyerIp, privateHeaders } from '@/lib/cart/request';
import { readKlarnaOrderAttribution } from '@/lib/klarna/attribution';
import { createOrderSchema } from '@/lib/klarna/contracts';
import { cartIdentity, forwardOrder, headlessOrigin, KlarnaBridgeError } from '@/lib/klarna/server';

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Ugyldig forespørsel.', paymentStatus: 'not_submitted' }, { status: 403, headers: privateHeaders });
  const identity = cartIdentity(request.cookies.get(CART_COOKIE)?.value);
  if (!identity) return NextResponse.json({ error: 'Handlekurven kunne ikke bekreftes.', paymentStatus: 'not_submitted' }, { status: 403, headers: privateHeaders });
  const parsed = createOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Ugyldig betalingsinformasjon.', paymentStatus: 'not_submitted' }, { status: 400, headers: privateHeaders });
  try {
    const attribution = await readKlarnaOrderAttribution(identity.fullId, buyerIp(request)).catch(error => {
      if (error instanceof KlarnaBridgeError) throw error;
      throw new KlarnaBridgeError('Kassen kunne ikke bekreftes. Ingen betaling er sendt.', 502);
    });
    const result = await forwardOrder(parsed.data, identity.fullId, headlessOrigin(request.nextUrl.origin), buyerIp(request), attribution, request);
    const response = NextResponse.json(result, { headers: privateHeaders });
    response.cookies.delete(CART_COOKIE);
    return response;
  } catch (error) {
    return NextResponse.json({
      error: error instanceof KlarnaBridgeError ? error.message : 'Betalingsstatus kunne ikke bekreftes. Kontroller hos Klarna før du prøver igjen.',
      paymentStatus: error instanceof KlarnaBridgeError ? error.paymentStatus : 'unknown',
    }, { status: error instanceof KlarnaBridgeError ? error.status : 502, headers: privateHeaders });
  }
}

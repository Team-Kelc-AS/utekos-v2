import 'server-only';

import { NextRequest } from 'next/server';
import type { Cart } from '@/lib/cart/types';
import { forwardTrackingRequest } from '@/lib/tracking/backend';
import { klarnaIdentityConfig, type KlarnaIdentitySession } from './identity';

type CartSnapshot = { publicId: string; lines: {
  variantId: string; handle: string; variantTitle: string; quantity: number;
  selectedOptions: { name: string; value: string }[];
}[] } | null;

export function prospectCartSnapshot(cart: Cart): CartSnapshot {
  if (!cart.id || !cart.lines.length) return null;
  return {
    publicId: cart.id,
    lines: cart.lines.map(line => ({
      variantId: line.variantId, handle: line.handle,
      variantTitle: line.variantTitle, quantity: line.quantity,
      selectedOptions: line.selectedOptions,
    })),
  };
}

export async function forwardKlarnaProspect(
  request: NextRequest,
  session: Omit<KlarnaIdentitySession, 'expiresAt'>,
  input: { action: 'login' } | { action: 'state' } | { action: 'cart'; cart: CartSnapshot } | {
    action: 'save'; emailMarketing: boolean; cartReminders: boolean; adMatching: boolean;
    comfyrobeSize: 'XS' | 'XL' | null;
    favoriteColor: 'Vargnatt' | 'Fjellblå' | 'Havdyp' | 'Fjellnatt' | null;
    interests: ('camping-og-bobil' | 'hytte' | 'terrasse' | 'glamping')[];
    cart: CartSnapshot;
  },
) {
  const config = klarnaIdentityConfig();
  if (!config) throw new Error('Klarna identity unavailable');
  const url = `${request.nextUrl.origin}/api/identity/klarna/prospect`;
  const trustedRequest = new NextRequest(url, {
    method: 'POST',
    headers: {
      origin: request.nextUrl.origin,
      'content-type': 'application/json',
      ...(request.headers.get('user-agent') ? { 'user-agent': request.headers.get('user-agent')! } : {}),
    },
    body: JSON.stringify({
      ...input,
      identity: { issuer: config.issuer, subject: session.subject, email: session.email, name: session.name,
        ...(session.givenName ? { givenName: session.givenName } : {}),
        ...(session.familyName ? { familyName: session.familyName } : {}),
        ...(session.phone ? { phone: session.phone } : {}),
        ...(session.dateOfBirth ? { dateOfBirth: session.dateOfBirth } : {}),
        ...(session.billingAddress ? { billingAddress: session.billingAddress } : {}),
        ...(session.shippingAddress ? { shippingAddress: session.shippingAddress } : {}),
        ...(session.country ? { country: session.country } : {}),
        ...(session.locale ? { locale: session.locale } : {}) },
    }),
  });
  return forwardTrackingRequest(trustedRequest);
}

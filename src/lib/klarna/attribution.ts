import 'server-only';
import { z } from 'zod';
import { shopifyFetch } from '@/lib/shopify/client';
import { BEGIN_CHECKOUT_EVENT_ATTRIBUTE, parseOrderAttributionFromNoteAttributes, type CheckoutAttributionSnapshot } from '@/lib/analytics/checkoutAttributionSnapshot';
import { KlarnaBridgeError } from './server';

export type KlarnaOrderAttribution = { attribution: CheckoutAttributionSnapshot; beginCheckoutEventId?: string };

// Read the attributes that checkout preparation actually persisted. Neither the
// secret cart key nor a browser-supplied identity becomes order attribution.
export async function readKlarnaOrderAttribution(fullId: string, buyerIp?: string): Promise<KlarnaOrderAttribution> {
  const result = await shopifyFetch<{ cart: { id: string; attributes: { key: string; value: string }[] } | null }, { id: string }>({
    query: 'query KlarnaAttribution($id: ID!) { cart(id: $id) { id attributes { key value } } }',
    variables: { id: fullId }, buyerIp, cache: 'no-store',
  });
  if (!result.cart || result.cart.id !== fullId) throw new KlarnaBridgeError('Handlekurven kunne ikke bekreftes.', 409);
  const notes = result.cart.attributes.map(attribute => ({ name: attribute.key, value: attribute.value }));
  const attribution = parseOrderAttributionFromNoteAttributes(notes);
  if (attribution.consent.source !== 'operator_policy') throw new KlarnaBridgeError('Kassen må forberedes på nytt.', 409);
  const beginId = result.cart.attributes.find(attribute => attribute.key === BEGIN_CHECKOUT_EVENT_ATTRIBUTE)?.value;
  if (beginId && !z.uuid().safeParse(beginId).success) throw new KlarnaBridgeError('Kassen må forberedes på nytt.', 409);
  return { attribution, ...(beginId ? { beginCheckoutEventId: beginId } : {}) };
}

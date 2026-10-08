import { UNCERTAIN_PAYMENT_MESSAGE } from '@/lib/cart/client';
import type { KlarnaCollectedShippingAddress, KlarnaExpressOrderPayload } from '@/lib/klarna/contracts';
import type { KlarnaAuthorizationResult } from './types';

export class KlarnaCompletionError extends Error {
  constructor(message: string, public notSubmitted = false) { super(message); }
}

export async function completeKlarnaExpressCheckout(
  result: KlarnaAuthorizationResult,
  prepared: { orderPayload: KlarnaExpressOrderPayload; shopifyCartId: string },
) {
  const collectedShippingAddress: KlarnaCollectedShippingAddress = result.collected_shipping_address ?? result;
  try {
    const response = await fetch('/api/klarna/orders', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorizationToken: result.authorization_token,
        orderPayload: prepared.orderPayload,
        collectedShippingAddress,
        shopifyCartId: prepared.shopifyCartId,
      }),
    });
    const completion = await response.json();
    if (!response.ok) {
      const notSubmitted = completion.paymentStatus === 'not_submitted';
      throw new KlarnaCompletionError(notSubmitted && typeof completion.error === 'string' ? completion.error : UNCERTAIN_PAYMENT_MESSAGE, notSubmitted);
    }
    window.location.assign(completion.redirect_url);
  } catch (error) {
    // A dropped/malformed response may follow an automatic capture. Only the
    // bridge's explicit pre-forward rejection proves it is safe to retry.
    if (error instanceof KlarnaCompletionError) throw error;
    throw new KlarnaCompletionError(UNCERTAIN_PAYMENT_MESSAGE);
  }
}

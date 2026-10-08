import 'server-only';
import { createHash } from 'node:crypto';

// Exact identity algorithm from e74e6cd mapShopifyCartValueCommerce and
// shopifyBeginCheckoutCommerce. Hash on the server so the checkout URL (which
// can carry a private cart key) never enters the browser analytics DTO.
export function cartCheckoutIdentity(publicCartId: string, checkoutUrl: string) {
  const url = new URL(checkoutUrl);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid checkout URL');
  const checkoutId = url.pathname.split('/').filter(Boolean).at(-1) ?? publicCartId;
  const revision = createHash('sha256').update([checkoutId, checkoutUrl].join('|')).digest('hex');
  return { checkout_id: checkoutId, creation_revision: `checkout_rev_${revision.slice(0, 32)}` };
}

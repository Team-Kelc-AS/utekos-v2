import 'server-only';
import { createHash } from 'node:crypto';

// Shopify reissues _s/_y analytics identifiers when checkoutUrl is read again.
// They must not invalidate an unchanged checkout. Keep every other URL field,
// including the private key, in the server-side hash; never expose the URL in
// the browser analytics DTO. Commerce is validated separately at preparation.
export function cartCheckoutIdentity(publicCartId: string, checkoutUrl: string) {
  const url = new URL(checkoutUrl);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid checkout URL');
  const checkoutId = url.pathname.split('/').filter(Boolean).at(-1) ?? publicCartId;
  url.searchParams.delete('_s');
  url.searchParams.delete('_y');
  url.searchParams.sort();
  const revision = createHash('sha256').update([checkoutId, url.href].join('|')).digest('hex');
  return { checkout_id: checkoutId, creation_revision: `checkout_rev_${revision.slice(0, 32)}` };
}

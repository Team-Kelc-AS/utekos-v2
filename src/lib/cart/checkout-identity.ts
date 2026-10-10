import 'server-only';
import { createHash } from 'node:crypto';
import { cartIdentity } from './identity';

// Private production reads rotate checkoutUrl's key as well as _s/_y. Bind the
// revision to the owned cart's stable private identity instead of that URL key.
// Keep the checkout path/origin and all remaining query fields in the hash.
// Never expose either private key or the URL in the browser analytics DTO.
export function cartCheckoutIdentity(ownedCartId: string, checkoutUrl: string) {
  const identity = cartIdentity(ownedCartId);
  if (!identity) throw new Error('Invalid owned cart identity');
  const url = new URL(checkoutUrl);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid checkout URL');
  const checkoutId = url.pathname.split('/').filter(Boolean).at(-1) ?? identity.publicId;
  url.searchParams.delete('key');
  url.searchParams.delete('_s');
  url.searchParams.delete('_y');
  url.searchParams.sort();
  const revision = createHash('sha256').update([checkoutId, identity.fullId, url.href].join('|')).digest('hex');
  return { checkout_id: checkoutId, creation_revision: `checkout_rev_${revision.slice(0, 32)}` };
}

// Diagnostics contain only equality and field names, never URLs or key values.
export function compareCheckoutUrls(ownedCartId: string, before: string, after: string) {
  const first = new URL(before);
  const second = new URL(after);
  const keys = new Set([...first.searchParams.keys(), ...second.searchParams.keys()]);
  return {
    origin_unchanged: first.origin === second.origin,
    path_unchanged: first.pathname === second.pathname,
    fragment_unchanged: first.hash === second.hash,
    changed_query_keys: [...keys].filter(key =>
      JSON.stringify(first.searchParams.getAll(key)) !== JSON.stringify(second.searchParams.getAll(key)),
    ).map(key => /^[a-zA-Z0-9_]{1,40}$/.test(key) ? key : '[other]'),
    identity_unchanged: cartCheckoutIdentity(ownedCartId, before).creation_revision ===
      cartCheckoutIdentity(ownedCartId, after).creation_revision,
  };
}

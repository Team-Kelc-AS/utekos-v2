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

// Diagnostics contain only equality and field names, never URLs or key values.
export function compareCheckoutUrls(publicCartId: string, before: string, after: string) {
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
    identity_unchanged: cartCheckoutIdentity(publicCartId, before).creation_revision ===
      cartCheckoutIdentity(publicCartId, after).creation_revision,
  };
}

import "server-only";

export const CART_COOKIE = "utekos_cart";

// Same canonical full/public identity contract as headless parseShopifyCartId.
// The key remains HttpOnly and is sent only server-to-server to the owned backend.
export function cartIdentity(value: string | undefined) {
  if (!value || value.length > 4096 || /\s/u.test(value)) return null;
  try {
    const url = new URL(value);
    const token = url.pathname.slice('/Cart/'.length);
    const entries = [...url.searchParams.entries()];
    if (url.href !== value || url.protocol !== 'gid:' || url.host !== 'shopify' || url.username || url.password || url.hash || !url.pathname.startsWith('/Cart/') || !token || token.includes('/') || /\s/u.test(decodeURIComponent(token)) || entries.length !== 1 || entries[0][0] !== 'key' || !entries[0][1] || /\s/u.test(entries[0][1])) return null;
    return { fullId: value, publicId: `gid://shopify${url.pathname}` };
  } catch { return null; }
}


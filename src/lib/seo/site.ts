// The public canonical origin, independent of localhost and Vercel preview hosts.
export const SITE_ORIGIN = "https://utekos.no";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).href;
}

export function productPath(handle: string): string {
  return `/produkter/${encodeURIComponent(handle)}`;
}

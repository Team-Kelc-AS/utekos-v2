// Svale is retired from the storefront, including direct product/cart requests.
export function isPublicProduct(handle: string): boolean {
  return handle !== 'utekos-svale';
}

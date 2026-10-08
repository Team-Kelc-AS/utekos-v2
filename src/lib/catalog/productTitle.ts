const brandNames: Readonly<Record<string, string>> = {
  "utekos-techdown": "Utekos TechDown™",
  "utekos-dun": "Utekos Dun™",
  "utekos-mikrofiber": "Utekos Mikrofiber™",
  "utekos-stapper": "Utekos Stapper™",
};

export function productTitle(product: { handle: string; title: string }): string {
  return Object.hasOwn(brandNames, product.handle) ? brandNames[product.handle] : product.title;
}

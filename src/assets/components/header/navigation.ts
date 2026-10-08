import "server-only";

import { categories, listingPath, type CategorySlug } from "@/lib/catalog/categories";

type NavigationLink = Readonly<{ label: string; href: string }>;

const categoryOrder = [
  "varmeplagg",
  "tilbehor",
  "camping-og-bobil",
  "hytte",
  "terrasse",
  "glamping",
] as const satisfies readonly CategorySlug[];

export const headerNavigation = {
  products: { label: "Produkter", href: listingPath("all") },
  categories: categoryOrder.map((slug) => ({
    label: categories[slug].label,
    href: listingPath(slug),
  })),
  links: [
    { label: "Uteguiden", href: "/uteguiden" },
    { label: "Om Utekos", href: "/om-oss" },
    { label: "Kontakt oss", href: "/kontaktskjema" },
  ],
} as const satisfies {
  products: NavigationLink;
  categories: readonly NavigationLink[];
  links: readonly NavigationLink[];
};

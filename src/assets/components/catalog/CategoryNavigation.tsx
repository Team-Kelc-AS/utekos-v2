import "server-only";

import { ImageCardSection } from "@/components/ImageCardSection";
import {
  categories,
  categorySlugs,
  listingPath,
  type ListingKey,
} from "@/lib/catalog/categories";

export function CategoryNavigation({ current }: { current?: ListingKey }) {
  const slugs = categorySlugs.filter(
    (slug) => categories[slug].source.kind === "selection" && slug !== current,
  );

  return (
    <ImageCardSection
      as="nav"
      id="product-categories"
      title={current ? "Andre bruksområder" : "Se produkter etter bruk"}
      cards={slugs.map((slug) => ({
        href: listingPath(slug),
        title: categories[slug].label,
        description: categories[slug].description,
        image: {
          src: `/images/kategorier/${slug}/${slug}_1600x900.webp`,
          alt: categories[slug].label,
          width: 1600,
          height: 900,
        },
        badge: "Produkter",
        action: categories[slug].label,
      }))}
    />
  );
}

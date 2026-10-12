import "server-only";

import type { StaticImageData } from "next/image";
import campingImage from "../../../../public/images/kategorier/camping-og-bobil/camping-og-bobil_1600x900.webp";
import glampingImage from "../../../../public/images/kategorier/glamping/glamping_1600x900.webp";
import cabinImage from "../../../../public/images/kategorier/hytte/hytte_1600x900.webp";
import terraceImage from "../../../../public/images/kategorier/terrasse/terrasse_1600x900.webp";
import { ImageCardSection } from "@/components/ImageCardSection";
import {
  categories,
  categorySlugs,
  listingPath,
  type CategorySlug,
  type ListingKey,
} from "@/lib/catalog/categories";

const categoryImages: Partial<Record<CategorySlug, StaticImageData>> = {
  "camping-og-bobil": campingImage,
  glamping: glampingImage,
  hytte: cabinImage,
  terrasse: terraceImage,
};

export function CategoryNavigation({ current }: { current?: ListingKey }) {
  const slugs = categorySlugs.filter(
    (slug) => categories[slug].source.kind === "selection" && slug !== current,
  );

  return (
    <ImageCardSection
      as="nav"
      id="product-categories"
      title={current ? "Andre bruksområder" : "Se produkter etter bruk"}
      cards={slugs.map((slug) => {
        const image = categoryImages[slug];
        if (!image) throw new Error(`Missing category image: ${slug}`);

        return {
          href: listingPath(slug),
          title: categories[slug].label,
          description: categories[slug].description,
          image: {
            src: image.src,
            alt: categories[slug].label,
            width: image.width,
            height: image.height,
          },
          badge: "Produkter",
          action: categories[slug].label,
        };
      })}
    />
  );
}

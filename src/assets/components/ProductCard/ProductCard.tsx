import "server-only";
import { productCommerce } from "@/lib/shopify/commerce";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { productTitle } from "@/lib/catalog/productTitle";
import { optionParam, variantHref } from "@/lib/products/variants";
import { dunSelection } from "@/lib/reservations/dun";
import { productVariantColorSheet } from "@/lib/products/variantColorSheets";
import type { ProductCardData } from "@/lib/shopify/getProductCards";
import { ProductCardHeader } from "./ProductCardHeader";
import { ProductCardFooter } from "./ProductCardFooter";
import { ProductCardFlip } from "./ProductCardFlip";
import { ProductCardColorSheet } from "./ProductCardColorSheet";
import {
  ProductCardVideo,
  type ProductCardVideoSource,
} from "./ProductCardVideo";
import styles from "./ProductCard.module.css";

// Headless ProductCard composition, with one immutable variant per card.
export function ProductCard({
  product,
  variant,
  video,
}: ProductCardData & { video?: ProductCardVideoSource }) {
  const title = productTitle(product);
  const href = variantHref(product.handle, variant, product.variants.nodes);
  const options = variant.selectedOptions.filter(
    (option) => option.value !== "Default Title",
  );
  const label = [title, ...options.map((option) => option.value)].join(" – ");
  const gender = options.find((option) => optionParam(option.name) === "kjonn");
  const colorSheet = variant.image && productVariantColorSheet(product.handle, variant);

  const imageContent = (
    <>
      <Link
        href={href}
        className="block w-full rounded-t-xl"
        aria-label={`Se ${label}`}
      >
        {gender && (
          <span className="absolute top-3 left-3 z-10 rounded-full border border-foreground/12 bg-background px-2.5 py-1 text-xs font-medium text-foreground xl:top-4 xl:left-4">
            {gender.value}
          </span>
        )}
        {variant.image && (
          <Image
            src={variant.image.url}
            alt={variant.image.altText || label}
            width={variant.image.width}
            height={variant.image.height}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 40vw, 67vw"
            className="block h-auto w-full rounded-t-xl"
          />
        )}
      </Link>
      <div className="absolute right-2.5 bottom-3 z-20 xl:right-4 xl:bottom-10">
        <WishlistButton
          productId={product.id}
          handle={product.handle}
          variantId={variant.id}
          title={label}
          returnTo={href}
          className="rounded-lg p-0"
          showHoverCard
        />
      </div>
    </>
  );

  return (
    <Card
      className={`${styles.card} group flex flex-col gap-0 overflow-hidden border border-border bg-night p-0 font-sans text-card-foreground shadow-[0_18px_56px_-42px_rgba(8,10,24,0.85)]`}
      data-product-card={variant.id}
      data-tracking-commerce={JSON.stringify(productCommerce(product, variant))}
      aria-label={label}
    >
      <CardContent
        className={`relative overflow-hidden rounded-t-xl bg-night p-0 ${product.handle === "utekos-svale" ? styles.svaleImage : ""}`}
      >
        {colorSheet ? (
          <ProductCardFlip label={label} video={video} back={<ProductCardColorSheet sheet={colorSheet} />}>
            {imageContent}
          </ProductCardFlip>
        ) : video ? (
          <ProductCardVideo {...video} label={label}>
            {imageContent}
          </ProductCardVideo>
        ) : (
          imageContent
        )}
      </CardContent>
      <ProductCardHeader title={title} href={href} variant={variant} />
      <ProductCardFooter handle={product.handle} variantId={variant.id} available={variant.availableForSale}
        reservationSelection={product.handle === "utekos-dun" ? dunSelection(variant) : undefined} />
    </Card>
  );
}

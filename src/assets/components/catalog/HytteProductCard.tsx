import "server-only";

import type {
  ProductVariant,
  ShopifyProduct,
} from "@/lib/shopify/product-types";
import { optionParam, variantHref } from "@/lib/products/variants";

import { AddToCart } from "@/components/commerce/AddToCart";
import Image from "next/image";
import Link from "next/link";
import { ModelProductReviews } from "./ModelProductReviews";
import { ShoppingBag } from "lucide-react";
import { Suspense } from "react";
import { descriptionPreview } from "@/lib/products/descriptionPreview";
import { formatMoney } from "@/lib/products/money";
import { hytteImageSizes } from "@/lib/catalog/hytteContent";
import { productCommerce } from "@/lib/shopify/commerce";
import { productTitle } from "@/lib/catalog/productTitle";
import styles from "./hytte-card.module.css";

export function HytteProductCard({
  product,
  variant,
  first,
}: {
  product: ShopifyProduct;
  variant: ProductVariant;
  first: boolean;
}) {
  const title = productTitle(product);
  const href = variantHref(product.handle, variant, product.variants.nodes);
  const options = variant.selectedOptions.filter(
    (option) =>
      optionParam(option.name) !== "kjonn" && option.value !== "Default Title",
  );
  const description = options
    .map(
      (option) =>
        `${optionParam(option.name) === "storrelse" ? "Størrelse " : ""}${option.value}`,
    )
    .join(" · ");
  const color = options.find(
    (option) => optionParam(option.name) === "farge",
  )?.value;
  const preview = descriptionPreview(product.description, 150).text;

  return (
    <article
      className={styles.card}
      aria-label={`${title} – ${description}`}
      data-product-model={product.handle}
      data-product-card={variant.id}
      data-tracking-commerce={JSON.stringify(productCommerce(product, variant))}
    >
      <Link
        href={href}
        prefetch={false}
        className={styles.imageLink}
        aria-label={`Se ${title} – ${description}`}
      >
        {variant.image && (
          <Image
            src={variant.image.url}
            width={variant.image.width}
            height={variant.image.height}
            alt={variant.image.altText || `${title} – ${description}`}
            sizes={hytteImageSizes}
            className={styles.image}
            loading={first ? "eager" : "lazy"}
            fetchPriority={first ? "high" : "low"}
          />
        )}
        {color && <span className={styles.badge}>{color}</span>}
      </Link>
      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link href={href} prefetch={false}>
            {title}
          </Link>
        </h3>
        <Suspense fallback={null}>
          <ModelProductReviews
            productId={product.id}
            showProviderLogo={false}
            hideEmpty
            appearance="card"
          />
        </Suspense>
        <div className={styles.footer}>
          <div>
            <span className={styles.priceLabel}>Pris</span>
            <p className={styles.price}>{formatMoney(variant.price)}</p>
          </div>
          <div className={styles.purchase}>
            <ShoppingBag size={16} aria-hidden="true" />
            <AddToCart
              handle={product.handle}
              variantId={variant.id}
              available={
                variant.availableForSale &&
                variant.currentlyNotInStock === false
              }
              compact
              label="Legg i kurv"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

import "server-only";

import Link from "next/link";
import { unstable_rethrow } from "next/dist/client/components/unstable-rethrow";
import { productTitle } from "@/lib/catalog/productTitle";
import { publicVariants, variantHref } from "@/lib/products/variants";
import { getProduct } from "@/lib/shopify/getProduct";
import { getProductHandles } from "@/lib/shopify/getProductHandles";
import styles from "./HeroSection.module.css";

type HeroProductLinksProps = {
  classNames?: Partial<Record<"productLinks" | "productScroller" | "productList" | "productLink" | "productOptions", string>>;
};

export async function HeroProductLinks({ classNames }: HeroProductLinksProps = {}) {
  const classes = { ...styles, ...classNames };
  let products;
  try {
    const handles = await getProductHandles();
    products = await Promise.all(handles.map(getProduct));
  } catch (error) {
    unstable_rethrow(error);
    console.error("Hero product links unavailable", error);
    return null;
  }

  const items = products.flatMap((product) => {
    if (!product) return [];
    const variants = publicVariants(product);
    return variants.map((variant) => ({
      id: variant.id,
      title: productTitle(product),
      options: variant.selectedOptions.filter((option) => option.value !== "Default Title").map((option) => option.value).join(" · "),
      href: variantHref(product.handle, variant, variants),
    }));
  });

  if (!items.length) return null;

  return (
    <nav className={classes.productLinks} aria-label="Produktvarianter">
      <div className={`${classes.productScroller} scroll-fade scroll-fade-4 overflow-y-auto`} tabIndex={0}>
        <ul className={classes.productList}>
          {items.map((item) => (
            <li key={item.id}>
              <Link href={item.href} prefetch={false} className={classes.productLink}>
                <span>{item.title}</span>
                {item.options && <span className={classes.productOptions}>{item.options}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

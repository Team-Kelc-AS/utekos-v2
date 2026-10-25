import { Suspense } from "react";
import { ProductFallback, ProductSkeleton } from "@/components/product/ProductSkeleton";
import { getProduct } from "@/lib/shopify/getProduct";
import { getProductHandles } from "@/lib/shopify/getProductHandles";
import { notFound } from "next/dist/client/components/not-found";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { assertProductHandles } from "@/lib/catalog/categories";
import { buildProductMetadata } from "@/lib/seo/productMetadata";
import { productBreadcrumbs } from "@/lib/seo/productBreadcrumbs";
import { SelectedProduct } from "@/components/product/SelectedProduct";
import { ProductDetails } from "@/components/product/ProductDetails";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import {
  optionParam,
  resolveVariant,
  type ProductSearchParams,
} from "@/lib/products/variants";
import { googleSansFlex } from "@/lib/fonts";
import styles from "@/components/product/product.module.css";

// This route intentionally waits for URL validation to preserve HTTP 404.
export const instant = false;

type Props = {
  searchParams: Promise<ProductSearchParams>;
  params: Promise<{
    handle: string;
  }>;
};

export async function generateStaticParams() {
  const handles = await getProductHandles();
  assertProductHandles(handles);

  // Cache Components validates at least one real path during the build.
  if (handles.length === 0) {
    throw new Error("No Storefront products available to prerender");
  }

  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();
  const query = await searchParams;
  if (!resolveVariant(product, query)) notFound();

  return buildProductMetadata(product, query);
}

export default function ProductPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<ProductFallback />}>
      <ProductContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductContent({ params, searchParams }: Props) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    notFound();
  }

  const variant = resolveVariant(product, await searchParams);
  if (!variant) notFound();
  const color = variant.selectedOptions.find(
    (option) => optionParam(option.name) === "farge",
  )?.value;
  const productTheme = product.handle === "comfyrobe"
    ? "comfyrobe"
    : ["utekos-dun", "utekos-mikrofiber"].includes(product.handle)
      ? color === "Fjellblå"
        ? "patriot-blue"
        : color === "Vargnatt"
          ? "vargnatt"
          : undefined
      : undefined;

  return (
    <main
      className={`${googleSansFlex.variable} ${styles.page}`}
      data-product-theme={productTheme}
    >
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <Breadcrumbs items={productBreadcrumbs(product)} />
        </div>
        <Suspense
          fallback={
            <ProductSkeleton />
          }
        >
          <SelectedProduct product={product} searchParams={searchParams} />
        </Suspense>
        <ProductDetails handle={product.handle} productId={product.id} />
      </div>
      <Suspense fallback={null}>
        <RelatedProducts handle={product.handle} />
      </Suspense>
    </main>
  );
}

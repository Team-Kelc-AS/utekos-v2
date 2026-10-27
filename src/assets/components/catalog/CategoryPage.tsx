import "server-only";

import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ImageCard } from "@/components/ImageCard";
import { CategoryRelatedGuides } from "@/components/knowledge/RelatedContent";
import { CategoryNavigation } from "./CategoryNavigation";
import {
  categories,
  catalogIndex,
  listingPath,
  type ListingKey,
} from "@/lib/catalog/categories";
import {
  listingRedirectPath,
  parsePage,
  type SearchParams,
} from "@/lib/catalog/pagination";
import { productTitle } from "@/lib/catalog/productTitle";
import { productCardImages } from "@/lib/catalog/productCardImages";
import { absoluteUrl, productPath } from "@/lib/seo/site";
import {
  buildRobotsMetadata,
  buildWebsiteSocialMetadata,
} from "@/lib/seo/siteMetadata";
import { getProductListing } from "@/lib/shopify/getProductListing";
import { NBCC_PATH } from "@/lib/nbcc/content";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type CategoryPageProps = { searchParams: Promise<SearchParams> };

export async function readCategoryListing(
  key: ListingKey,
  searchParams: Promise<SearchParams>,
) {
  const params = await searchParams;
  const page = parsePage(params.page);
  if (page === null) notFound();
  const listing = await getProductListing(key, page);
  if (page > 1 && listing.products.length === 0) notFound();
  const redirectPath = listingRedirectPath(listingPath(key), params);
  if (redirectPath) permanentRedirect(redirectPath);
  return { ...listing, page };
}

export async function getCategoryMetadata(
  key: ListingKey,
  searchParams: Promise<SearchParams>,
): Promise<Metadata> {
  const listing = await readCategoryListing(key, searchParams);
  const category = key === "all" ? catalogIndex : categories[key];
  const title = `${category.title}${listing.page > 1 ? ` – side ${listing.page}` : ""}`;
  const canonical = absoluteUrl(listingPath(key, listing.page));
  return {
    title,
    description: category.description,
    alternates: { canonical },
    ...buildWebsiteSocialMetadata(title, category.description, canonical),
    robots: buildRobotsMetadata(listing.products.length > 0),
  };
}

export function CategoryPage({
  categoryKey,
  searchParams,
  title,
  subtitle,
  bottomContent,
}: CategoryPageProps & {
  categoryKey: ListingKey;
  title?: string;
  subtitle?: ReactNode;
  bottomContent?: ReactNode;
}) {
  const category =
    categoryKey === "all" ? catalogIndex : categories[categoryKey];
  return (
    <main
      data-tracking-route={listingPath(categoryKey)}
      className={`flex-1 px-6 py-10 text-primary-foreground${categoryKey === "all" ? "" : " bg-night"}${categoryKey === "varmeplagg" ? " lg:px-4" : ""}`}
      style={
        categoryKey === "all"
          ? {
              backgroundColor: "#001211",
              backgroundImage: "var(--background-gradient)",
            }
          : undefined
      }
    >
      <div className={`mx-auto space-y-10 ${categoryKey === "varmeplagg" ? "max-w-[100rem]" : "max-w-6xl"}`}>
        <Breadcrumbs
          items={[
            { label: "Forsiden", href: "/" },
            ...(categoryKey === "all"
              ? []
              : [{ label: "Produkter", href: "/produkter" as const }]),
            { label: category.label },
          ]}
        />
        <header className="max-w-3xl space-y-4">
          <h1 className="text-3xl font-extrabold">{title ?? category.title}</h1>
          {subtitle ?? (
            <p className="font-medium leading-relaxed">{category.intro}</p>
          )}
        </header>

        {categoryKey === "all" && <CategoryNavigation />}

        {categoryKey === "camping-og-bobil" && (
          <aside
            className="max-w-3xl"
            aria-labelledby="nbcc-benefit-heading"
            data-tracking-promotion="nbcc-membership"
            data-tracking-creative="NBCC-medlemsfordel"
          >
            <Card className="overflow-hidden border-none bg-[#001a18] text-[#f0eee9]">
              <div className="relative h-40 w-full bg-white/5 sm:h-48">
                <Image
                  src="/images/partnere/nbcc_logo_1.svg"
                  alt="NBCC - Norsk Bobil og Caravan Club"
                  fill
                  className="object-contain p-6"
                />
              </div>
              <CardHeader>
                <CardTitle
                  id="nbcc-benefit-heading"
                  className="text-xl font-extrabold"
                >
                  Medlem i NBCC?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Få 100 kr i rabatt hos Utekos. Se hvordan du aktiverer
                  medlemsfordelen din.
                </p>
              </CardContent>
              <CardFooter>
                <Link
                  href={NBCC_PATH}
                  prefetch={false}
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  NBCC-medlemsfordel hos Utekos
                </Link>
              </CardFooter>
            </Card>
          </aside>
        )}

        <Suspense fallback={<p role="status">Laster produktoversikten …</p>}>
          <ProductList categoryKey={categoryKey} searchParams={searchParams} />
        </Suspense>

        <CategoryRelatedGuides categoryKey={categoryKey} />
        {bottomContent}
        {categoryKey !== "all" && <CategoryNavigation current={categoryKey} />}
      </div>
    </main>
  );
}

async function ProductList({
  categoryKey,
  searchParams,
}: CategoryPageProps & { categoryKey: ListingKey }) {
  const { products, page, hasNextPage } = await readCategoryListing(
    categoryKey,
    searchParams,
  );
  return (
    <section
      data-tracking-route={listingPath(categoryKey)}
      data-tracking-page={page}
      data-tracking-category={categoryKey}
      data-tracking-category-name={
        categoryKey === "all"
          ? catalogIndex.title
          : categories[categoryKey].title
      }
      aria-labelledby="product-list-heading"
      className="space-y-6"
    >
      <h2 id="product-list-heading" className="text-xl font-extrabold">
        {page > 1 ? `Produkter – side ${page}` : "Se produktene"}
      </h2>
      {products.length === 0 ? (
        <p>
          Ingen produkter er tilgjengelige i denne kategorien akkurat nå.{" "}
          <Link href="/produkter" prefetch={false} className="underline">
            Se alle produkter
          </Link>
          .
        </p>
      ) : (
        <ul className={`grid gap-6 sm:grid-cols-2 ${categoryKey === "varmeplagg" ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {products.map((product) => {
            const image =
              categoryKey === "varmeplagg"
                ? productCardImages[product.handle]
                : undefined;
            return image ? (
              <li key={product.handle}>
                <ImageCard
                  href={productPath(product.handle)}
                  title={productTitle(product)}
                  description={product.description}
                  image={{
                    ...image,
                    sizes: "(max-width: 639px) calc(100vw - 3rem), (max-width: 1023px) calc(50vw - 2.25rem), (max-width: 1631px) calc(25vw - 1.625rem), 382px",
                  }}
                  badge="Varmeplagg"
                  action="Se produktet"
                />
              </li>
            ) : (
              <li
                key={product.handle}
                className="space-y-3 rounded-lg bg-[#001a18] p-6 text-[#f0eee9]"
              >
                <h3 className="text-lg font-extrabold">
                  <Link
                    href={productPath(product.handle)}
                    prefetch={false}
                    className="inline-flex min-h-11 items-center underline underline-offset-4"
                  >
                    {productTitle(product)}
                  </Link>
                </h3>
                <p className="font-medium leading-relaxed">
                  {product.description}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      {(page > 1 || hasNextPage) && (
        <nav aria-label="Sider i produktoversikten">
          <ul className="flex flex-wrap items-center gap-6">
            {page > 1 && (
              <li>
                <Link
                  href={listingPath(categoryKey)}
                  prefetch={false}
                  className="underline"
                >
                  Første side
                </Link>
              </li>
            )}
            {page > 1 && (
              <li>
                <Link
                  href={listingPath(categoryKey, page - 1)}
                  prefetch={false}
                  className="underline"
                >
                  Forrige side
                </Link>
              </li>
            )}
            <li>
              <span aria-current="page">Side {page}</span>
            </li>
            {hasNextPage && (
              <li>
                <Link
                  href={listingPath(categoryKey, page + 1)}
                  prefetch={false}
                  className="underline"
                >
                  Neste side
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </section>
  );
}

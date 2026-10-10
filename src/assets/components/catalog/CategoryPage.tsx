import "server-only";

import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/dist/client/components/not-found";
import { permanentRedirect } from "next/dist/client/components/redirect";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CategoryRelatedGuides } from "@/components/knowledge/RelatedContent";
import {
  categories,
  catalogIndex,
  categorySlugs,
  listingPath,
  type ListingKey,
} from "@/lib/catalog/categories";
import {
  listingRedirectPath,
  parsePage,
  type SearchParams,
} from "@/lib/catalog/pagination";
import { productTitle } from "@/lib/catalog/productTitle";
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

async function readListing(
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
  const listing = await readListing(key, searchParams);
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
      className="flex-1 bg-night px-6 py-10 text-primary-foreground"
    >
      <div className="mx-auto max-w-6xl space-y-10">
        <Breadcrumbs
          items={[
            { label: "Forsiden", href: "/" },
            ...(categoryKey === "all"
              ? []
              : [{ label: "Produkter", href: "/produkter" }]),
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

        {categoryKey !== "all" && (
          <section
            className="max-w-3xl space-y-4"
            aria-labelledby="category-guidance"
          >
            <h2 id="category-guidance" className="text-xl font-extrabold">
              {categories[categoryKey].guidanceTitle}
            </h2>
            <ul className="list-disc space-y-3 pl-5 font-medium">
              {categories[categoryKey].guidance.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </section>
        )}
        {categoryKey !== "all" && <CategoryNavigation current={categoryKey} />}
        <CategoryRelatedGuides categoryKey={categoryKey} />
        {bottomContent}
      </div>
    </main>
  );
}

function CategoryNavigation({ current }: { current?: ListingKey }) {
  return (
    <nav aria-label="Produktkategorier" className="space-y-5">
      {[
        {
          title: "Se produkter etter bruk",
          slugs: categorySlugs.filter(
            (slug) => categories[slug].source.kind === "selection",
          ),
        },
      ].map(({ title, slugs }) => (
        <div key={title} className="space-y-4">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {slugs.map((slug) => (
              <li key={slug}>
                <Link
                  href={listingPath(slug)}
                  prefetch={false}
                  aria-current={slug === current ? "page" : undefined}
                  className="group block"
                >
                  <Card className="overflow-hidden border-none bg-[#001a18] text-[#f0eee9] transition-transform group-hover:scale-[1.02]">
                    <div className="relative h-32 w-full bg-[#1a3331]">
                      <Image
                        src={`/images/kategorier/${slug}/${slug}_1600x900.webp`}
                        alt={categories[slug].label}
                        fill
                        className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
                      />
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base font-extrabold flex items-center justify-between">
                        {categories[slug].label}
                        <span className="text-[#f0eee9]/70 transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
async function ProductList({
  categoryKey,
  searchParams,
}: CategoryPageProps & { categoryKey: ListingKey }) {
  const { products, page, hasNextPage } = await readListing(
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
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
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
          ))}
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

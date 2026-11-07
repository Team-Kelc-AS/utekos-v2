import "server-only";

import { Fragment } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { CategoryPage, type CategoryPageProps } from "./CategoryPage";
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CategoryNavigation } from "./CategoryNavigation";
import { KnowledgeGuideCards } from "@/components/knowledge/KnowledgeGuideCards";
import { knowledgeArticles } from "@/lib/knowledge/knowledgeArticles";
import { parsePage } from "@/lib/catalog/pagination";
import { productOverviewRows } from "@/lib/catalog/overview";
import { getProductListing } from "@/lib/shopify/getProductListing";
import { getProduct } from "@/lib/shopify/getProduct";
import { VariantCard } from "./VariantCard";
import { ProductRowsMotion } from "./ProductRowsMotion";
import { MobileFirstCarouselItems } from "@/components/ProductCard/MobileFirstCarouselItems";
import { SkreddersyBanner } from "./SkreddersyBanner";
import { NbccMembershipSection } from "./NbccMembershipSection";
import styles from "./ProductOverview.module.css";

export async function ProductOverview({ searchParams }: CategoryPageProps) {
  const params = await searchParams;
  if (parsePage(params.page) !== 1)
    return <CategoryPage categoryKey="all" searchParams={searchParams} />;
  const listing = await getProductListing("all", 1);
  const products = (
    await Promise.all(
      listing.products.map((product) => getProduct(product.handle)),
    )
  ).filter((product) => product !== null);
  const rows = productOverviewRows(products);
  return (
    <main
      className={styles.page}
      data-tracking-route="/produkter"
      data-tracking-page="1"
      data-tracking-category="all"
      data-tracking-category-name="Alle produkter"
    >
      <div className={styles.breadcrumbBar}>
        <div className={styles.breadcrumbs}>
          <Breadcrumbs
            items={[
              { label: "Forsiden", href: "/" },
              { label: "Produkter" },
            ]}
          />
        </div>
      </div>
      <header className={styles.hero}>
        <SkreddersyBanner />
      </header>
      <ProductRowsMotion>
        {rows.map((row, rowIndex) => (
          <Fragment key={row.id}>
            {rowIndex > 0 && (
              <Separator className={styles.rowSeparator} />
            )}
            <section
              data-product-row={row.id}
              data-tracking-list={`overview-${row.id}`}
              data-tracking-list-name={row.label}
              className={styles.row}
              aria-label={row.label}
            >
              <Carousel
                aria-label={`${row.label} – sveip for flere størrelser`}
                opts={{
                  align: "start",
                  containScroll: "trimSnaps",
                  slidesToScroll: 1,
                }}
              >
                <CarouselContent className={styles.track}>
                  <MobileFirstCarouselItems className={styles.slide} mobileFirstIndex={row.cards.findIndex(card =>
                    card.product.handle === "comfyrobe" && card.variant.selectedOptions.some(
                      option => option.name === "Størrelse" && option.value === "XL",
                    ),
                  )}>
                  {row.cards.map((card, index) => (
                      <VariantCard
                        key={card.variant.id}
                        card={card}
                        eager={rowIndex === 0 && index < 2}
                      />
                  ))}
                  </MobileFirstCarouselItems>
                </CarouselContent>
                <CarouselPrevious
                  aria-label="Forrige variant"
                  className={styles.previous}
                />
                <CarouselNext
                  aria-label="Neste variant"
                  className={styles.next}
                />
              </Carousel>
            </section>
          </Fragment>
        ))}
        {rows.length === 0 && (
          <p>Ingen produkter er tilgjengelige akkurat nå.</p>
        )}
        {listing.hasNextPage && (
          <Link href="/produkter?page=2" className={styles.more}>
            Flere produkter
          </Link>
        )}
      </ProductRowsMotion>
      <div className={styles.membership}>
        <NbccMembershipSection />
      </div>
      <div className={styles.guidance}>
        <CategoryNavigation />
        <KnowledgeGuideCards
          id="selected-guides"
          articles={[
            knowledgeArticles.keepWarm,
            knowledgeArticles.baseLayer,
            knowledgeArticles.cloudweave,
            knowledgeArticles.cold,
          ]}
        />
      </div>
    </main>
  );
}

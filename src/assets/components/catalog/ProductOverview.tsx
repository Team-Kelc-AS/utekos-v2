import "server-only";

import Link from "next/link";
import { CategoryPage, type CategoryPageProps } from "./CategoryPage";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ImageCard } from "@/components/ImageCard";
import { knowledgeArticles } from "@/lib/knowledge/knowledgeArticles";
import {
  categories,
  categorySlugs,
  listingPath,
} from "@/lib/catalog/categories";
import { parsePage } from "@/lib/catalog/pagination";
import { productOverviewRows } from "@/lib/catalog/overview";
import { getProductListing } from "@/lib/shopify/getProductListing";
import { getProduct } from "@/lib/shopify/getProduct";
import { VariantCard, SvaleGuideCard } from "./VariantCard";
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
      <header className={styles.hero}>
        <h1>
          Juster. Form. <span>Nyt.</span>
        </h1>
      </header>
      <section
        className={styles.rows}
        aria-label="Alle produkter og størrelser"
      >
        {rows.map((row, rowIndex) => (
          <section
            key={row.id}
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
                {row.cards.map((card, index) => (
                  <CarouselItem key={card.variant.id} className={styles.slide}>
                    <VariantCard
                      card={card}
                      eager={rowIndex === 0 && index < 2}
                    />
                  </CarouselItem>
                ))}
                {row.id === "svale" && (
                  <CarouselItem className={styles.slide}>
                    <SvaleGuideCard />
                  </CarouselItem>
                )}
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
        ))}
        {rows.length === 0 && (
          <p>Ingen produkter er tilgjengelige akkurat nå.</p>
        )}
        {listing.hasNextPage && (
          <Link href="/produkter?page=2" className={styles.more}>
            Flere produkter
          </Link>
        )}
      </section>
      <div className={styles.guidance}>
        <nav aria-labelledby="product-categories">
          <h2 id="product-categories">Se produkter etter bruk</h2>
          <ul className={styles.guidanceGrid}>
            {categorySlugs
              .filter((slug) => categories[slug].source.kind === "selection")
              .map((slug) => (
                <li key={slug}>
                  <ImageCard
                    href={listingPath(slug)}
                    title={categories[slug].label}
                    description={categories[slug].description}
                    image={{
                      src: `/images/kategorier/${slug}/${slug}_1600x900.webp`,
                      alt: categories[slug].label,
                      width: 1600,
                      height: 900,
                    }}
                    badge="Produkter"
                    action={categories[slug].label}
                  />
                </li>
              ))}
          </ul>
        </nav>
        <section aria-labelledby="selected-guides">
          <h2 id="selected-guides">Råd fra Uteguiden</h2>
          <ul className={styles.guidanceGrid}>
            {[
              knowledgeArticles.keepWarm,
              knowledgeArticles.baseLayer,
              knowledgeArticles.cloudweave,
              knowledgeArticles.cold,
            ].map((article) => (
              <li key={article.slug}>
                <ImageCard
                  href={article.path}
                  title={article.title}
                  description={article.description}
                  image={article.cardImage}
                  badge="Uteguiden"
                  action="Les artikkelen"
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

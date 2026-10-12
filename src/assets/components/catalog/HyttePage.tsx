import "server-only";
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CategoryRelatedGuides } from "@/components/knowledge/RelatedContent";
import { categories, listingPath } from "@/lib/catalog/categories";
import { hytteContent } from "@/lib/catalog/hytteContent";
import {
  prepareHytteProduct,
  hytteVariantCards,
} from "@/lib/catalog/hytteProducts";
import { absoluteUrl } from "@/lib/seo/site";
import {
  buildRobotsMetadata,
  buildWebsiteSocialMetadata,
} from "@/lib/seo/siteMetadata";
import { buildHytteJsonLd } from "@/lib/seo/JSON-LD/buildHytteJsonLd";
import { serializeJsonLd } from "@/lib/seo/JSON-LD/serializeJsonLd";
import { getProduct } from "@/lib/shopify/getProduct";
import dunFjellbla from "../../../../public/images/kunnskap/dun_1440_1800.webp";
import { readCategoryListing, type CategoryPageProps } from "./CategoryPage";
import { CategoryNavigation } from "./CategoryNavigation";
import { HytteProductCard } from "./HytteProductCard";
import { HytteProductCarousel } from "./HytteProductCarousel";
import styles from "./hytte.module.css";

// Existing originals, visually checked against Dun's Fjellblå and Vargnatt variants.
const dunImages = {
  Fjellblå: {
    url: dunFjellbla.src,
    width: dunFjellbla.width,
    height: dunFjellbla.height,
    altText: "Utekos Dun™ i Fjellblå i bruk ved en snødekt fjellutsikt",
  },
  Vargnatt: {
    url: "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Dun-Vargnatt-Full-Front-1200x1200.webp?v=1786208128",
    width: 1600,
    height: 1600,
    altText: "Utekos Dun™ i Vargnatt med oransje detaljer, sett forfra",
  },
};

const readHytte = cache(
  async (searchParams: CategoryPageProps["searchParams"]) => {
    const listing = await readCategoryListing("hytte", searchParams);
    const products = (
      await Promise.all(
        listing.products.map((product) => getProduct(product.handle)),
      )
    )
      .map((product) => prepareHytteProduct(product, dunImages))
      .filter((product) => product !== null);
    return { ...listing, products, cards: hytteVariantCards(products) };
  },
);

export async function getHytteMetadata(
  searchParams: CategoryPageProps["searchParams"],
): Promise<Metadata> {
  const { cards, page } = await readHytte(searchParams);
  const title = `${hytteContent.title}${page > 1 ? ` – side ${page}` : ""}`;
  const canonical = absoluteUrl(listingPath("hytte", page));
  return {
    title,
    description: hytteContent.description,
    alternates: { canonical },
    ...buildWebsiteSocialMetadata(
      `${title} | Utekos`,
      hytteContent.description,
      canonical,
    ),
    robots: buildRobotsMetadata(cards.length > 0),
  };
}

export async function HyttePage({ searchParams }: CategoryPageProps) {
  const { cards, page, hasNextPage } = await readHytte(searchParams);
  return (
    <main className={styles.page} data-tracking-route={listingPath("hytte")}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildHytteJsonLd(
              cards.map(({ product, variant }) => ({
                ...product,
                displayName: `${product.title} – ${variant.selectedOptions
                  .filter(
                    (option) =>
                      option.name !== "Kjønn" && option.name !== "Gender",
                  )
                  .map((option) => option.value)
                  .join(" / ")}`,
              })),
              page,
            ),
          ),
        }}
      />
      <div className={styles.container}>
        <Breadcrumbs
          items={[
            { label: "Forsiden", href: "/" },
            { label: "Produkter", href: "/produkter" },
            { label: categories.hytte.label },
          ]}
        />
        <header className={styles.intro}>
          <h1>{hytteContent.heading}</h1>
          <p>{hytteContent.intro}</p>
        </header>
        <section
          aria-labelledby="hytte-products"
          data-tracking-category="hytte"
          data-tracking-category-name="Varmeplagg til hytta"
          data-tracking-page={page}
          data-tracking-list="hytte-variants"
          data-tracking-list-name="Varmeplagg til hytta"
        >
          {cards.length ? (
            <HytteProductCarousel
              heading={
                page > 1 ? `Produkter – side ${page}` : "Finn din Utekos"
              }
            >
              {cards.map(({ product, variant }, index) => (
                <li key={variant.id}>
                  <HytteProductCard
                    product={product}
                    variant={variant}
                    first={index === 0}
                  />
                </li>
              ))}
            </HytteProductCarousel>
          ) : (
            <>
              <h2 id="hytte-products">Finn din Utekos</h2>
              <p>
                Ingen produkter er tilgjengelige i denne kategorien akkurat nå.{" "}
                <Link href="/produkter" prefetch={false}>
                  Se alle produkter
                </Link>
                .
              </p>
            </>
          )}
          {(page > 1 || hasNextPage) && (
            <nav
              aria-label="Sider i produktoversikten"
              className={styles.pagination}
            >
              {page > 1 && (
                <>
                  <Link href={listingPath("hytte")} prefetch={false}>
                    Første side
                  </Link>
                  <Link href={listingPath("hytte", page - 1)} prefetch={false}>
                    Forrige side
                  </Link>
                </>
              )}
              <span aria-current="page">Side {page}</span>
              {hasNextPage && (
                <Link href={listingPath("hytte", page + 1)} prefetch={false}>
                  Neste side
                </Link>
              )}
            </nav>
          )}
        </section>
        <article
          className={styles.editorial}
          aria-labelledby="hytte-varmedress"
        >
          <h2 id="hytte-varmedress">
            Et smartere alternativ til en tradisjonell varmedress for voksne
          </h2>
          <p>
            Når kulden setter seg i treverket på hytta, tyr mange til en
            tradisjonell varmedress. Ønsker du å regulere temperaturen når du
            går fra dyp avslapning til aktivitet, er fleksibilitet viktig.{" "}
            <Link href="/produkter/utekos-techdown" prefetch={false}>
              Utekos TechDown™
            </Link>{" "}
            er designet som et fleksibelt alternativ. Med vår unike
            3-i-1-funksjonalitet kan du pakke deg inn i en fulldekkende kokong
            foran bålpannen, eller bruke de smarte YKK®-glidelåsene for å
            transformere plagget til en elegant parkas når du skal hente mer
            ved.
          </p>
          <h3>Den ultimate pakkelisten for hyttetur</h3>
          <p>
            Å pakke for fjellet eller kysthytta handler om å spare plass uten å
            ofre komfort. Neste gang du skriver din pakkeliste for hyttetur, kan
            du spare plass med et plagg som dekker flere bruksområder. Tilpass
            øvrige klær og lag etter vær og aktivitet. Med Utekos TechDown™ for
            kveldene rundt bålet – takket være det gnist- og slitesterke
            Luméa™-ytterstoffet – og vår myke{" "}
            <Link href="/produkter/comfyrobe" prefetch={false}>
              Comfyrobe™
            </Link>{" "}
            for raske turer ut på trappen, har du alt du trenger for å fjerne
            kulden som en bekymring.
          </p>
          <section
            id="faq"
            className={styles.faq}
            aria-labelledby="hytte-faq-heading"
          >
            <h2 id="hytte-faq-heading">Ofte stilte spørsmål</h2>
            {hytteContent.faq.map((faq, index) => (
              <div key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
                {index === 0 && (
                  <Link
                    href="/handlehjelp/vask-og-vedlikehold#techdown"
                    prefetch={false}
                  >
                    Se vaske- og vedlikeholdsguiden
                  </Link>
                )}
              </div>
            ))}
          </section>
        </article>
        <div className={styles.guides}>
          <CategoryRelatedGuides categoryKey="hytte" />
          <CategoryNavigation current="hytte" />
        </div>
      </div>
    </main>
  );
}

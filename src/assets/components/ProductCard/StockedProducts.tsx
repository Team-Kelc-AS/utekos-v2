import "server-only";

import type { ReactNode } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/dist/client/components/unstable-rethrow";
import { io } from "next/dist/server/request/io";
import { ProductCard } from "@/components/ProductCard/ProductCard";
import { DeferredProductCarousel as ProductCarousel } from "@/components/ProductCard/DeferredProductCarousel";
import {
  getProductCards,
  type ProductCardData,
} from "@/lib/shopify/getProductCards";
import { googleSansFlex } from "@/lib/fonts";
import { homeProducts } from "@/lib/catalog/homeProducts";
import { productVariantVideo } from "@/lib/products/variantVideos";
import stapperImage from "@public/images/kunnskap/stapper_45.webp";
import techdownLitenImage from "@public/images/products/techdown_liten_in_hammock_915x1188.webp";
import comfyrobeXlImage from "@public/images/products/comfyrobe/cards/comfy-img-3.webp";
import comfyrobeMImage from "@public/images/products/comfyrobe/cards/comfy-m-4x5.webp";
import styles from "@/components/ProductCard/ProductCarousel.module.css";

const sectionClassName = `${googleSansFlex.variable} ${styles.section} font-sans`;

type StockedProductsProps = {
  title: string;
  headingId: string;
  listId: string;
  route: string;
  excludeProductHandle?: string;
  includeStapper?: boolean;
  introduction?: ReactNode;
};

export async function StockedProducts({
  title,
  headingId,
  listId,
  route,
  excludeProductHandle,
  includeStapper = false,
  introduction,
}: StockedProductsProps) {
  // The seconds cache is request-time content. Make that boundary explicit to
  // avoid Next 16.3.8's cache-warming miss during the final prerender pass.
  // io() preserves prefetching and does not change inventory cache lifetimes.
  await io();
  let cards: ProductCardData[];
  try {
    cards = homeProducts(
      await getProductCards(),
      excludeProductHandle,
      includeStapper,
    ).map((card) => {
      const comfyrobeImage = card.variant.selectedOptions.some(
        (option) => ["Størrelse", "Size", "Str"].includes(option.name) && option.value === "M",
      ) ? comfyrobeMImage : comfyrobeXlImage;
      return card.product.handle === "utekos-stapper"
        ? {
            ...card,
            variant: {
              ...card.variant,
              image: {
                url: stapperImage.src,
                width: stapperImage.width,
                height: stapperImage.height,
                altText:
                  "Svart Utekos Stapper™ kompresjonsbag ved en hytte om vinteren",
              },
            },
          }
        : route === "/" &&
            card.product.handle === "comfyrobe" &&
            card.variant.selectedOptions.some(
              (option) => ["Størrelse", "Size", "Str"].includes(option.name) && ["M", "XL"].includes(option.value),
            )
          ? {
              ...card,
              variant: {
                ...card.variant,
                image: {
                  url: comfyrobeImage.src,
                  width: comfyrobeImage.width,
                  height: comfyrobeImage.height,
                  altText: comfyrobeImage === comfyrobeMImage
                    ? "Mann i marineblå Comfyrobe vist fra siden med hetten nede."
                    : "Mann i marineblå Comfyrobe som lener seg mot en dørkarm.",
                },
              },
            }
        : route === "/" &&
            card.product.handle === "utekos-techdown" &&
            card.variant.selectedOptions.some(
              (option) => ["Størrelse", "Size", "Str"].includes(option.name) && option.value === "Liten",
            )
          ? {
              ...card,
              variant: {
                ...card.variant,
                image: {
                  url: techdownLitenImage.src,
                  width: techdownLitenImage.width,
                  height: techdownLitenImage.height,
                  altText: "To personer i mørkeblå Utekos TechDown™ i en hengekøye i skogen.",
                },
              },
            }
          : card;
    });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Product cards unavailable", error);
    return (
      <section
        className={sectionClassName}
        aria-labelledby={headingId}
        data-tracking-route={route}
        data-tracking-list={listId}
        data-tracking-list-name={title}
      >
        <h2 id={headingId}>{title}</h2>
        {introduction}
        <p className={styles.message}>
          Produktene kunne ikke lastes akkurat nå.{" "}
          <Link href="/produkter">Se alle produkter</Link>
        </p>
      </section>
    );
  }

  return (
    <section
      className={sectionClassName}
      aria-labelledby={headingId}
      data-tracking-route={route}
      data-tracking-list={listId}
      data-tracking-list-name={title}
    >
      <h2 id={headingId}>{title}</h2>
      {introduction}
      {cards.length ? (
        <ProductCarousel mobileFirstIndex={route === "/" ? cards.findIndex(card =>
          card.product.handle === "comfyrobe" && card.variant.selectedOptions.some(
            option => ["Størrelse", "Size", "Str"].includes(option.name) && option.value === "XL",
          ),
        ) : undefined}>
          {cards.map((card) => (
            <ProductCard
              key={card.variant.id}
              {...card}
              video={productVariantVideo(card.product.handle, card.variant)}
              showKlarnaExpress={route === "/"}
            />
          ))}
        </ProductCarousel>
      ) : (
        <p className={styles.message}>
          Ingen produktvarianter er på lager akkurat nå.{" "}
          <Link href="/produkter">Se alle produkter</Link>
        </p>
      )}
    </section>
  );
}

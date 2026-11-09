import "server-only";

import { Fragment, Suspense } from "react";

import { ArrowRightIcon } from "@/components/utekos-icons/ArrowRightIcon";
import { HeroProductLinks } from "@/components/frontpage/HeroProductLinks";
import { HomeProductsLoading } from "@/components/frontpage/HomeProducts";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { StockedProducts } from "@/components/ProductCard/StockedProducts";
import heroModel from "@public/images/gaveguide/techdown-christmas-portrait-v3.webp";
import styles from "./gift-guide.module.css";

export const metadata: Metadata = {
  title: "Gaveguide – varme julegaver",
  description:
    "Gi bort litt mer utekos. Finn varme julegaver til dem du er glad i, og få inspirasjon i Utekos sin gaveguide.",
  alternates: { canonical: "/gaveguide" },
};

export default function GiftGuidePage() {
  return (
    <Fragment>
      <section
        className={styles.hero}
        aria-labelledby="gift-hero-heading"
        data-gift-hero
      >
        <div className={styles.frame}>
          <div className={styles.content}>
            <h1 id="gift-hero-heading" className={styles.heading}>
              <span>JUSTER.</span>
              <span>FORM.</span>
              <span className={styles.accent}>NYT.</span>
            </h1>
            <p className={styles.lead}>Gi bort litt mer utekos.</p>
            <div className={styles.actions}>
              <Link
                href="#julegaver"
                prefetch={false}
                className={styles.primary}
              >
                Finn julegaven
              </Link>
              <Link
                href="/uteguiden/julegaven-til-den-som-har-alt"
                prefetch={false}
                className={styles.secondary}
              >
                Se gaveguiden <ArrowRightIcon size={22} />
              </Link>
            </div>
          </div>
          <div className={styles.visual}>
            <Image
              src={heroModel}
              alt="Modell i marineblå Utekos TechDown™ med rød nisselue."
              sizes="(min-width: 1024px) 50vw, (min-width: 640px) 88vw, 140vw"
              fetchPriority="high"
              loading="eager"
              className={styles.model}
            />
          </div>
          <Suspense fallback={null}>
            <HeroProductLinks
              classNames={{
                productLinks: styles.productLinks,
                productScroller: styles.productScroller,
                productList: styles.productList,
                productLink: styles.productLink,
                productOptions: styles.productOptions,
              }}
            />
          </Suspense>
        </div>
      </section>
      <div id="julegaver" className={styles.products}>
        <Suspense fallback={<HomeProductsLoading />}>
          <StockedProducts
            title="Finn julegaven"
            headingId="gift-products-heading"
            listId="gift-products"
            route="/gaveguide"
            includeStapper
          />
        </Suspense>
      </div>
    </Fragment>
  );
}

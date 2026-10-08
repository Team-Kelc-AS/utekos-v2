import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { categories, categorySlugs, listingPath } from "@/lib/catalog/categories";
import { productTitle } from "@/lib/catalog/productTitle";
import { knowledgeArticleList, knowledgeOverview } from "@/lib/knowledge/knowledgeArticles";
import { NBCC_PATH, nbccPage } from "@/lib/nbcc/content";
import { productPath } from "@/lib/seo/site";
import { getSearchProducts } from "@/lib/shopify/getSearchProducts";
import type { SearchIndex, SearchItem } from "./types";

const searchIndexSchema = z.object({
  groups: z.array(z.object({
    label: z.enum(["Produkter", "Sider"]),
    items: z.array(z.object({
      title: z.string().min(1),
      href: z.string().regex(/^\/(?!\/|api(?:\/|$)|customer(?:\/|$)|checkout(?:\/|$))/),
      keywords: z.array(z.string()),
    })),
  })),
});

const informationPages: SearchItem[] = [
  { title: "Forsiden", href: "/", keywords: ["Utekos"] },
  { title: "Om Utekos", href: "/om-oss", keywords: ["Om oss", "historie"] },
  { title: "Kontakt oss", href: "/kontaktskjema", keywords: ["kundeservice", "handlehjelp"] },
  { title: "Frakt og retur", href: "/frakt-og-retur", keywords: ["levering", "bytte", "angrerett"] },
  { title: "Vask og vedlikehold", href: "/handlehjelp/vask-og-vedlikehold", keywords: ["vaske", "handlehjelp"] },
  { title: "Størrelsesguide", href: "/handlehjelp/storrelsesguide", keywords: ["størrelse", "passform", "mål"] },
  { title: "Personvern", href: "/personvern", keywords: [] },
  { title: "Vilkår og betingelser", href: "/vilkar-betingelser", keywords: ["kjøpsvilkår"] },
  { title: nbccPage.title, href: NBCC_PATH, keywords: [nbccPage.description, "NBCC"] },
];

export async function getSearchIndex(): Promise<SearchIndex> {
  "use cache";
  cacheLife("minutes");
  cacheTag("shopify:products", "shopify:collections");
  const products = await getSearchProducts();
  const pages: SearchItem[] = [
    { title: "Alle produkter", href: listingPath("all"), keywords: ["sortiment"] },
    ...categorySlugs.map((slug) => ({ title: categories[slug].label, href: listingPath(slug), keywords: [categories[slug].description] })),
    ...informationPages,
    { title: knowledgeOverview.title, href: knowledgeOverview.path, keywords: [knowledgeOverview.description] },
    ...knowledgeArticleList.map((article) => ({ title: article.title, href: article.path, keywords: [article.description, ...article.topics] })),
  ];
  return searchIndexSchema.parse({ groups: [
    { label: "Produkter", items: products.map((product) => ({ title: productTitle(product), href: productPath(product.handle), keywords: [product.title, product.description] })) },
    { label: "Sider", items: [...new Map(pages.map((item) => [item.href, item])).values()] },
  ] });
}

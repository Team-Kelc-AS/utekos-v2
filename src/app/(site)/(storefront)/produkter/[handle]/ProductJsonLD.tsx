import "server-only";

import {
  buildProductPageJsonLd,
  serializeProductJsonLd,
} from "@/lib/seo/JSON-LD/buildProductJsonLd";

import { getJudgeMeReviews } from "@/lib/products/judgeme";
import { getProduct } from "@/lib/shopify/getProduct";
import { io } from "next/dist/server/request/io";

export default async function ProductJsonLD({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  await io();
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return null;
  const reviews = await getJudgeMeReviews(product.id);
  const data = buildProductPageJsonLd(product, reviews);
  if (!data) return null;

  return (
    <script
      id="product-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeProductJsonLd(data) }}
    />
  );
}

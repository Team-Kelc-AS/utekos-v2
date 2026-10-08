import 'server-only';

import { io } from 'next/cache';
import { getProduct } from '@/lib/shopify/getProduct';
import { getJudgeMeReviews } from '@/lib/products/judgeme';
import { buildProductJsonLd, serializeProductJsonLd } from '@/lib/seo/JSON-LD/buildProductJsonLd';

export default async function ProductJsonLD({ params }: { params: Promise<{ handle: string }> }) {
  // Match the review components' request boundary and cached provider snapshot.
  await io();
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return null;
  const reviews = await getJudgeMeReviews(product.id);
  const data = buildProductJsonLd(product, reviews);
  if (!data) return null;

  return <script id="product-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeProductJsonLd(data) }} />;
}

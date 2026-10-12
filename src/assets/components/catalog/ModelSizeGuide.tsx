import 'server-only';
import Link from 'next/link';
import { resolveProductSizeGuideFamily } from '@/lib/products/resolveProductSizeGuideFamily';

export function ModelSizeGuide({ product }: { product: { handle: string; title: string } }) {
  const family = resolveProductSizeGuideFamily(product.handle);
  const anchor = family === 'utekos' ? 'mikrofiber' : family;
  return <Link href={`/handlehjelp/storrelsesguide#${anchor}`} prefetch={false} data-tracking-size-guide
    aria-label={`Størrelsesguide for ${product.title}`}>Størrelsesguide</Link>;
}

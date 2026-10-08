import type { StaticImageData } from 'next/image';
import type { ProductImage } from '@/lib/shopify/product-types';
export function productImage(id: string, source: string | StaticImageData, altText: string, width: number, height: number): ProductImage {
  return typeof source === 'string' ? { id, url: source, altText, width, height } :
    { id, url: source.src, altText, width: source.width, height: source.height };
}

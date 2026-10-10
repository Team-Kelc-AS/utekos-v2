import 'server-only';
import Image from 'next/image';
import type { ProductColorSheet } from '@/lib/products/variantColorSheets';

export function ProductCardColorSheet({ sheet }: { sheet: ProductColorSheet }) {
  // Preserve the supplied PNG's exact colors and native 2:3 proportions.
  return <Image src={sheet.src} alt={sheet.alt} width={1000} height={1500} unoptimized />;
}

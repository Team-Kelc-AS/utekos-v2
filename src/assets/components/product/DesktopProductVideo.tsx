import 'server-only';
import type { ReactNode } from 'react';
import { ProductCardVideo } from '@/components/ProductCard/ProductCardVideo';
import type { ProductVideoSource } from '@/lib/products/variantVideos';

export function DesktopProductVideo({ video, label, children }: { video: ProductVideoSource; label: string; children: ReactNode }) {
  // Keep the source in server HTML and use CSS for the existing desktop-only
  // control. The shared picture still selects the original mobile image.
  return <ProductCardVideo key={video.src} {...video} label={label} desktopOnly>{children}</ProductCardVideo>;
}

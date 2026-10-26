import 'server-only';
import { getImageProps } from 'next/image';
import type { ProductImage } from '@/lib/shopify/product-types';
import type { ProductVideoSource } from '@/lib/products/variantVideos';
import { usesDesktopPortraitFrame } from '@/lib/products/gallery/desktopPortraitFrame';
import { GalleryControls } from './GalleryControls';
import { DesktopProductVideo } from './DesktopProductVideo';
import { ComfyrobeSticker } from './ComfyrobeSticker';
import styles from './product.module.css';
export function ProductGallery({ desktop, mobile, title, video, videoLabel, showMobileControls = true, showComfyrobeSticker = false, mobileFullWidth = false }: { desktop: ProductImage[]; mobile: ProductImage[]; title: string; video?: ProductVideoSource; videoLabel?: string; showMobileControls?: boolean; showComfyrobeSticker?: boolean; mobileFullWidth?: boolean }) {
  if (!desktop.length && !mobile.length) return <div className={styles.missingImage}>Produktbilde er ikke tilgjengelig for denne varianten.</div>;
  const desktopImages = desktop;
  const mobileImages = mobile;
  // One picture per slide: the browser requests only the source for its viewport.
  // Extra slides belong only to the viewport with that many original images.
  const count = Math.max(desktopImages.length, mobileImages.length);
  return <GalleryControls desktopCount={desktopImages.length} mobileCount={mobileImages.length} showMobileControls={showMobileControls}>{Array.from({ length: count }, (_, index) => {
    const large = desktopImages[index] ?? mobileImages[index];
    const small = mobileImages[index] ?? desktopImages[index];
    const viewport = !desktopImages[index] ? 'mobile' : !mobileImages[index] ? 'desktop' : undefined;
    // The 76rem container and desktop grid make this column roughly 600px.
    // 600px lets 2x screens choose 1200w instead of jumping to 1920w.
    const common = { sizes: `(min-width: 1280px) 600px, (min-width: 768px) 50vw, ${mobileFullWidth ? '100vw' : 'calc(100vw - 48px)'}`, loading: index === 0 ? 'eager' as const : 'lazy' as const, fetchPriority: index === 0 ? 'high' as const : 'auto' as const };
    const { props: desktopProps } = getImageProps({ ...common, src: large.url, width: large.width, height: large.height, alt: large.altText || title });
    const { props: mobileProps } = getImageProps({ ...common, src: small.url, width: small.width, height: small.height, alt: small.altText || title });
    // A picture has one alt attribute; use a shared description when its sources show different scenes.
    const alt = large.url === small.url || large.altText === small.altText ? large.altText || title : `Produktbilde ${index + 1} av ${title}`;
    const picture = <div className={styles.imageFrame}><picture className={usesDesktopPortraitFrame(large.url) ? styles.desktopPortraitFrame : undefined}>
        <source media="(max-width: 767px)" srcSet={mobileProps.srcSet} sizes={mobileProps.sizes} width={small.width} height={small.height} />
        {/* getImageProps provides Next's optimized sources without hydrating image markup. */}
        <img {...desktopProps} alt={alt} data-gallery-desktop-alt={large.altText || title} data-gallery-mobile-alt={small.altText || title} className={styles.productImage} />
      </picture>{showComfyrobeSticker && <ComfyrobeSticker className={styles.comfyrobeSticker} />}</div>;
    return <figure key={`${large.id ?? large.url}-${small.id ?? small.url}`} className={styles.slide} data-gallery-viewport={viewport} aria-label={`Bilde ${index + 1}`}>
      {index === 0 && video ? <DesktopProductVideo video={video} label={videoLabel ?? title}>{picture}</DesktopProductVideo> : picture}
    </figure>;
  })}</GalleryControls>;
}

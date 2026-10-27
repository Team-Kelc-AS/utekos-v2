import 'server-only';
import type { ShopifyProduct, ProductVariant, ProductImage } from '@/lib/shopify/product-types';
import { PRODUCT_GALLERY_IMAGE_OVERRIDES } from './gallery/productGalleryImageOverrides';
import { COMFYROBE_MOBILE_GALLERY_IMAGES } from './gallery/comfyrobeProductGalleryImages';
import { FJELLBLA_MOBILE_GALLERY_IMAGES } from './gallery/fjellblaMobileGalleryImages';
import { TECHDOWN_MOBILE_GALLERY_IMAGES } from './gallery/techdown/productGalleryImages';
import { MICROFIBER_MOBILE_GALLERY_IMAGES, MICROFIBER_VARGNATT_DESKTOP_GALLERY_IMAGES, MICROFIBER_BLACK_STUDIO_IMAGES } from './gallery/mikrofiber/mikrofiberProductGalleryImages';
import { SVALE_MOBILE_GALLERY_IMAGES } from './gallery/svale/svaleProductGalleryImages';
import { STAPPER_MOBILE_GALLERY_IMAGES } from './gallery/stapper/stapperDesktopImages';
import { VARGNATT_FULL_IMAGE } from './gallery/vargnattFullImage';
import { usesDesktopPortraitFrame } from './gallery/desktopPortraitFrame';
const ASPECT_RATIO_TOLERANCE = 0.015;
const MIKROFIBER_NATIVE_ORIGINALS = new Set([
  '/images/products/Utekos_Fjellbla_1080x1440_Bak.webp',
  '/images/products/Utekos_Fjellbla_1080x1440_Parkas.webp',
]);
const reportedImages = new Set<string>();
function originalImages(images: ProductImage[], viewport: 'desktop' | 'mobile', handle: string, ratio?: readonly [number, number]) {
  const [width, height] = ratio ?? (viewport === 'mobile' ? (handle === 'comfyrobe' ? [3, 4] : [2, 3]) : [4, 5]);
  // Allow 1.5% relative ratio deviation; preserve the original dimensions.
  return images.filter(image => {
    // Explicitly selected originals retain their native proportions.
    const selectedOriginal = (handle === 'utekos-mikrofiber' && MIKROFIBER_NATIVE_ORIGINALS.has(image.url)) || (viewport === 'desktop' && (
      usesDesktopPortraitFrame(image.url) ||
      (handle === 'utekos-dun' && image.url === '/images/kunnskap/Fjell-Blue-3000x2000.png') ||
      (handle === 'comfyrobe' && image.url === '/images/kunnskap/Comfy_Woman_2_2x3.webp')
    ));
    const valid = image.width > 0 && image.height > 0 && Number.isFinite(image.width) && Number.isFinite(image.height) && (selectedOriginal || Math.abs(image.width * height - image.height * width) <= image.height * width * ASPECT_RATIO_TOLERANCE);
    if (!valid && process.env.NODE_ENV !== 'production') {
      const message = `[ProductGallery] ${handle}: ${image.url.split('?')[0]} (${image.width} × ${image.height}) er utelatt på ${viewport}. Originalbildet må være ${width}:${height} (±1,5 %).`;
      if (!reportedImages.has(message)) {
        reportedImages.add(message);
        console.warn(message);
      }
    }
    return valid;
  });
}
export function productGallery(product: ShopifyProduct, variant: ProductVariant) {
  const color = variant.selectedOptions.find(o => ['Farge', 'Color'].includes(o.name))?.value;
  if (product.handle === 'utekos-mikrofiber' && color === 'Vargnatt') {
    return {
      desktop: originalImages(MICROFIBER_VARGNATT_DESKTOP_GALLERY_IMAGES, 'desktop', product.handle),
      mobile: originalImages(MICROFIBER_BLACK_STUDIO_IMAGES, 'mobile', product.handle),
    };
  }
  if (['utekos-dun', 'utekos-mikrofiber'].includes(product.handle) && color !== 'Fjellblå') {
    const images = variant.image ? [variant.image] : [];
    const desktop = images;
    if (color === 'Vargnatt') {
      const remaining = (items: ProductImage[]) => items.filter(image => image.url !== VARGNATT_FULL_IMAGE.url);
      // The requested desktop frame is the sole exception here to native 4:5 imagery.
      return {
        desktop: [VARGNATT_FULL_IMAGE, ...originalImages(remaining(desktop), 'desktop', product.handle)],
        mobile: [VARGNATT_FULL_IMAGE, ...originalImages(remaining(images), 'mobile', product.handle)],
      };
    }
    return { desktop: originalImages(desktop, 'desktop', product.handle), mobile: originalImages(images, 'mobile', product.handle) };
  }
  const desktop = PRODUCT_GALLERY_IMAGE_OVERRIDES[product.handle] ?? product.images.nodes;
  const isFjellbla = color === 'Fjellblå' && ['utekos-dun', 'utekos-mikrofiber'].includes(product.handle);
  const mobile = isFjellbla
    ? FJELLBLA_MOBILE_GALLERY_IMAGES
    : ({ 'utekos-stapper': STAPPER_MOBILE_GALLERY_IMAGES, comfyrobe: COMFYROBE_MOBILE_GALLERY_IMAGES, 'utekos-techdown': TECHDOWN_MOBILE_GALLERY_IMAGES, 'utekos-mikrofiber': MICROFIBER_MOBILE_GALLERY_IMAGES, 'utekos-svale': SVALE_MOBILE_GALLERY_IMAGES })[product.handle] ?? desktop;
  return { desktop: originalImages(desktop, 'desktop', product.handle), mobile: originalImages(mobile, 'mobile', product.handle, isFjellbla ? [3, 4] : undefined) };
}

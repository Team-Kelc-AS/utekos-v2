import 'server-only';
import type { ShopifyProduct, ProductVariant, ProductImage } from '@/lib/shopify/product-types';
import { PRODUCT_GALLERY_IMAGE_OVERRIDES } from './gallery/productGalleryImageOverrides';
import { COMFYROBE_MOBILE_GALLERY_IMAGES } from './gallery/comfyrobeProductGalleryImages';
import { TECHDOWN_MOBILE_GALLERY_IMAGES } from './gallery/techdown/productGalleryImages';
import { MICROFIBER_MOBILE_GALLERY_IMAGES, MICROFIBER_VARGNATT_DESKTOP_GALLERY_IMAGES } from './gallery/mikrofiber/mikrofiberProductGalleryImages';
import { SVALE_MOBILE_GALLERY_IMAGES } from './gallery/svale/svaleProductGalleryImages';
const ASPECT_RATIO_TOLERANCE = 0.015;
const reportedImages = new Set<string>();
function originalImages(images: ProductImage[], viewport: 'desktop' | 'mobile', handle: string) {
  const [width, height] = viewport === 'mobile' ? [2, 3] : [4, 5];
  // Allow 1.5% relative ratio deviation; preserve the original dimensions.
  return images.filter(image => {
    // These explicitly selected desktop originals retain their native proportions.
    const selectedOriginal = viewport === 'desktop' && (
      (handle === 'utekos-dun' && image.url === '/images/kunnskap/Fjell-Blue-3000x2000.png') ||
      (handle === 'comfyrobe' && image.url === '/images/kunnskap/Comfy_Woman_2_2x3.webp')
    );
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
  if (['utekos-dun', 'utekos-mikrofiber'].includes(product.handle) && color !== 'Fjellblå') {
    const images = variant.image ? [variant.image] : [];
    const desktop = product.handle === 'utekos-mikrofiber' && color === 'Vargnatt' ? MICROFIBER_VARGNATT_DESKTOP_GALLERY_IMAGES : images;
    return { desktop: originalImages(desktop, 'desktop', product.handle), mobile: originalImages(images, 'mobile', product.handle) };
  }
  const desktop = PRODUCT_GALLERY_IMAGE_OVERRIDES[product.handle] ?? product.images.nodes;
  const mobile = ({ comfyrobe: COMFYROBE_MOBILE_GALLERY_IMAGES, 'utekos-techdown': TECHDOWN_MOBILE_GALLERY_IMAGES, 'utekos-mikrofiber': MICROFIBER_MOBILE_GALLERY_IMAGES, 'utekos-svale': SVALE_MOBILE_GALLERY_IMAGES })[product.handle] ?? desktop;
  return { desktop: originalImages(desktop, 'desktop', product.handle), mobile: originalImages(mobile, 'mobile', product.handle) };
}

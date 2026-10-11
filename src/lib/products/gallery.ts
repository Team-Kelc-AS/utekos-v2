import 'server-only';
import type { ShopifyProduct, ProductVariant, ProductImage } from '@/lib/shopify/product-types';
import { PRODUCT_GALLERY_IMAGE_OVERRIDES } from './gallery/productGalleryImageOverrides';
import { COMFYROBE_MOBILE_GALLERY_IMAGES } from './gallery/comfyrobeProductGalleryImages';
import { TECHDOWN_MOBILE_GALLERY_IMAGES } from './gallery/techdown/productGalleryImages';
import { MICROFIBER_MOBILE_GALLERY_IMAGES } from './gallery/mikrofiber/mikrofiberProductGalleryImages';
import { SVALE_MOBILE_GALLERY_IMAGES } from './gallery/svale/svaleProductGalleryImages';
function mobileImages(images: ProductImage[]) {
  // Preserve original formats: mobile accepts 2:3 sources only.
  return images.filter(image => image.width > 0 && image.height > 0 && Number.isFinite(image.width) && Number.isFinite(image.height) && image.width * 3 === image.height * 2);
}
export function productGallery(product: ShopifyProduct, variant: ProductVariant) {
  const color = variant.selectedOptions.find(o => ['Farge', 'Color'].includes(o.name))?.value;
  if (['utekos-dun', 'utekos-mikrofiber'].includes(product.handle) && color !== 'Fjellblå') {
    const images = variant.image ? [variant.image] : [];
    return { desktop: images, mobile: mobileImages(images) };
  }
  const desktop = PRODUCT_GALLERY_IMAGE_OVERRIDES[product.handle] ?? product.images.nodes;
  const mobile = ({ comfyrobe: COMFYROBE_MOBILE_GALLERY_IMAGES, 'utekos-techdown': TECHDOWN_MOBILE_GALLERY_IMAGES, 'utekos-mikrofiber': MICROFIBER_MOBILE_GALLERY_IMAGES, 'utekos-svale': SVALE_MOBILE_GALLERY_IMAGES })[product.handle] ?? desktop;
  return { desktop, mobile: mobileImages(mobile) };
}

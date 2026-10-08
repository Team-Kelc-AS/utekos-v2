import 'server-only';
import type { ShopifyProduct, ProductVariant } from '@/lib/shopify/product-types';
import { PRODUCT_GALLERY_IMAGE_OVERRIDES } from './gallery/productGalleryImageOverrides';
import { COMFYROBE_MOBILE_GALLERY_IMAGES } from './gallery/comfyrobeProductGalleryImages';
import { TECHDOWN_MOBILE_GALLERY_IMAGES } from './gallery/techdown/productGalleryImages';
import { MICROFIBER_MOBILE_GALLERY_IMAGES } from './gallery/mikrofiber/mikrofiberProductGalleryImages';
import { SVALE_MOBILE_GALLERY_IMAGES } from './gallery/svale/svaleProductGalleryImages';
export function productGallery(product: ShopifyProduct, variant: ProductVariant) {
  const color = variant.selectedOptions.find(o => ['Farge', 'Color'].includes(o.name))?.value;
  if (['utekos-dun', 'utekos-mikrofiber'].includes(product.handle) && color !== 'Fjellblå') {
    const images = variant.image ? [variant.image] : [];
    return { desktop: images, mobile: images };
  }
  const desktop = PRODUCT_GALLERY_IMAGE_OVERRIDES[product.handle] ?? product.images.nodes;
  const mobile = ({ comfyrobe: COMFYROBE_MOBILE_GALLERY_IMAGES, 'utekos-techdown': TECHDOWN_MOBILE_GALLERY_IMAGES, 'utekos-mikrofiber': MICROFIBER_MOBILE_GALLERY_IMAGES, 'utekos-svale': SVALE_MOBILE_GALLERY_IMAGES })[product.handle] ?? desktop;
  return { desktop, mobile };
}

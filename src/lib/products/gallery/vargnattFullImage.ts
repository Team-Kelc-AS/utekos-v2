import type { ProductImage } from '@/lib/shopify/product-types';

// Explicitly selected for both Dun and Mikrofiber Vargnatt.
// Keep the original 2:3 dimensions; ProductGallery adds the desktop 4:5 frame.
export const VARGNATT_FULL_IMAGE: ProductImage = {
  id: 'utekos-vargnatt-full',
  url: '/images/kunnskap/Black_Mikrofiber_Full.webp',
  altText: 'Svart Utekos Vargnatt i full lengde, sett forfra med oransje glidelåser og hettefôr.',
  width: 2000,
  height: 3000,
};
